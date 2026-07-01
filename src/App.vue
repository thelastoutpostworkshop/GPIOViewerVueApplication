<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue';
import ParamsError from '@/components/ParamsError.vue';
import type { Memory, PinStateMap, GPIOViewerRelease, SamplingInterval, PinMode, BoardPinsFunction } from "@/types/types";
import type { BoardData } from "@/types/types";
import { gpioStore } from '@/stores/gpiostore'
import { getAPIUrl } from "@/functions";
import { useAppTheme } from '@/composables/useAppTheme';
import { useDisplay } from 'vuetify';

const store = gpioStore();
const { lgAndUp } = useDisplay();
const drawerOpen = ref(lgAndUp.value);
const maxLastPinValuesStored = 100;
const router = useRouter()
const { currentThemeName, isDarkTheme, loadSavedTheme, toggleTheme } = useAppTheme();

store.WebApplicationRelease = __APP_VERSION__;

declare var window: any;

onMounted(() => {
  loadSavedTheme();
  if (window.gpio_settings) {
    store.ipAddress = window.gpio_settings.ip;
    store.httpPort = window.gpio_settings.port;
    store.freeSketch = window.gpio_settings.freeSketchRam;
    console.log(window.gpio_settings);
    initEventSource();
  }
});

watch(lgAndUp, (isWideScreen) => {
  if (isWideScreen) {
    drawerOpen.value = true;
  }
});

function goToTutorial() {
  closeDrawerOnCompactScreen();
  window.open('https://youtu.be/JJzRXcQrl3I', '_blank');
}

function navigateToRoute(routeName: string) {
  closeDrawerOnCompactScreen();
  router.push({ name: routeName });
}

function handleThemeToggle() {
  toggleTheme();
  closeDrawerOnCompactScreen();
}

function closeDrawerOnCompactScreen() {
  if (!lgAndUp.value) {
    drawerOpen.value = false;
  }
}

function addLastPinValues(states: PinStateMap) {
  // First, update or add new states from the states object
  Object.entries(states).forEach(([gpio, pinState]) => {
    const gpioNum = parseInt(gpio);
    let pinEntry = store.lastPinValues.find(p => p.gpio === gpioNum);

    if (!pinEntry) {
      pinEntry = { gpio: gpioNum, values: [], gpioType: pinState.t };
      store.lastPinValues.push(pinEntry);
    }

    // Directly add the new state
    pinEntry.values.push(pinState.v);

    // Ensure only the last 100 states are kept
    if (pinEntry.values.length > maxLastPinValuesStored) {
      pinEntry.values = pinEntry.values.slice(-maxLastPinValuesStored);
    }
  });

  // Then, for each pin in lastPinValues, if it wasn't updated, duplicate the last value
  store.lastPinValues.forEach(pinEntry => {
    if (!states[pinEntry.gpio]) { // If the pin wasn't in the updated states
      const lastValue = pinEntry.values[pinEntry.values.length - 1];
      if (lastValue !== undefined) { // Check to ensure there's a last value to duplicate
        pinEntry.values.push(lastValue);

        // Ensure only the last 100 states are kept
        if (pinEntry.values.length > maxLastPinValuesStored) {
          pinEntry.values = pinEntry.values.slice(-maxLastPinValuesStored);
        }
      }
    }
  });
}

function initEventSource(): void {
  console.log("Waiting to connect to ESP32: with EventSource: ");
  const source = new EventSource("http://" + store.ipAddress + ":" + store.httpPort + "/events");

  source.addEventListener(
    "gpio-state",
    (e: MessageEvent) => {
      if (!store.freeze) {
        const states = JSON.parse(e.data) as PinStateMap;
        addLastPinValues(states);
        store.currentStates = states;
      }
    },
    false
  );


  source.addEventListener(
    "free_heap",
    (e: MessageEvent) => {
      if (!store.freeze) {
        const freeHeap = e.data as Memory;
        store.freeHeap = freeHeap;
        store.wifiActivity++;
      }
    },
    false
  );

  source.addEventListener(
    "free_psram",
    (e: MessageEvent) => {
      if (!store.freeze) {
        const freePSRAM = e.data as Memory;
        store.freePSRAM = freePSRAM;
      }
    },
    false
  );

  source.addEventListener('open', (event) => {
    console.log('Connection to server established.');
    store.connectedToESP32 = true;
    // Additional logic for when the connection is open
  }, false);

  source.addEventListener(
    "error",
    (e: Event) => {
      // Assuming e.target is of type EventSource, otherwise adjust the type accordingly.
      const target = e.target as EventSource;
      if (target.readyState !== EventSource.OPEN) {
        console.log("Events Disconnected");
        store.connectedToESP32 = false;
      }
    },
    false
  );
  source.addEventListener(
    "close",
    (e: MessageEvent) => {
      console.log("Closing connection");
      self.close();
    },
    false
  );
}

const localNetworkAdressKnown = computed(() => window.gpio_settings.ip && window.gpio_settings.port);

onMounted(async () => {
  store.boards = await loadBoardsData();
  fetchGPIOViewerReleaseVersion();
  fetchSamplingInterval();
  store.boardPinFunctions = await fetchPinFunctions();
  store.pinModes = await fetchPinModes();
});

async function loadBoardsData(): Promise<BoardData[]> {
  try {
    const response = await fetch("boards.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json() as BoardData[];
  } catch (error) {
    console.error("Could not load boards data:", error);
    return [] as BoardData[];
  }
}

async function fetchPinModes(): Promise<PinMode[] | null> {
  try {
    const response = await fetch(getAPIUrl("pinmodes"));
    return await response.json() as PinMode[]

  } catch (error) {
    console.error("Error fetching pin modes", error);
    return null
  }
}

async function fetchPinFunctions(): Promise<BoardPinsFunction | null> {
  try {
    const response = await fetch(getAPIUrl("pinfunctions"));
    return await response.json() as BoardPinsFunction

  } catch (error) {
    console.error("Error fetching pin pinfunctions", error);
    return null
  }
}

async function fetchGPIOViewerReleaseVersion() {
  try {
    const response = await fetch(getAPIUrl("release"));
    const data: GPIOViewerRelease = await response.json();
    store.GPIOViewerRelease = data.release;

  } catch (error) {
    store.GPIOViewerRelease = "-unknown";
    console.error("Error fetching release version:", error);
  }
}
async function fetchSamplingInterval() {
  try {
    const response = await fetch(getAPIUrl("sampling"));
    const data: SamplingInterval = await response.json();
    store.SamplingInterval = data.sampling;

  } catch (error) {
    store.SamplingInterval = 0;
    console.error("Error fetching sampling interval:", error);
  }
}
</script>

<template>
  <v-layout :theme="currentThemeName">
    <div v-if="localNetworkAdressKnown">

      <v-app-bar
        color="primary"
        rounded
        elevated
        density="compact"
        :class="{ 'app-bar--with-sidebar': lgAndUp && drawerOpen }"
      >

        <template v-slot:prepend>
          <v-app-bar-nav-icon
            v-if="!lgAndUp || !drawerOpen"
            @click="drawerOpen = !drawerOpen"
          ></v-app-bar-nav-icon>
        </template>
        <RouterView name="AppBar" />
        <v-spacer></v-spacer>
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              :aria-label="isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'"
              @click="handleThemeToggle"
            >
              <v-icon :icon="isDarkTheme ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"></v-icon>
            </v-btn>
          </template>
          <span>{{ isDarkTheme ? 'Dark Theme' : 'Light Theme' }}</span>
        </v-tooltip>

      </v-app-bar>

      <v-navigation-drawer
        color="primary"
        v-model="drawerOpen"
        :temporary="!lgAndUp"
        :permanent="lgAndUp"
        :class="{ 'sidebar--full-height': lgAndUp && drawerOpen }"
      >
        <v-list-item title="GPIOViewer" :subtitle="'v' + store.GPIOViewerRelease">
          <template v-if="lgAndUp" #prepend>
            <v-btn
              icon="mdi-menu"
              variant="text"
              size="small"
              aria-label="Collapse sidebar"
              @click="drawerOpen = false"
            ></v-btn>
          </template>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item link title="About" @click="navigateToRoute('about')"></v-list-item>
        <v-list-item link title="GPIOViewer" @click="navigateToRoute('gpioview')"></v-list-item>
        <v-list-item link title="ESP32 Information" @click="navigateToRoute('espinfo')"></v-list-item>
        <v-list-item link title="Memory Map" @click="navigateToRoute('memorymap')"></v-list-item>
        <v-list-item link title="Pin Data Graph" @click="navigateToRoute('pinplotter')"></v-list-item>
        <v-divider></v-divider>
        <v-list-item link title="Tutorial" @click="goToTutorial()" append-icon="mdi-open-in-new"></v-list-item>
        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2 text-caption text-grey-lighten-1">
            Web application v{{ store.WebApplicationRelease }}
          </div>
        </template>
      </v-navigation-drawer>

      <v-main class="main" :theme="currentThemeName" :class="`v-theme--${currentThemeName}`">
        <RouterView />
      </v-main>
      <v-bottom-navigation bg-color="secondary">
        <RouterView name="BottomBar" />
      </v-bottom-navigation>
    </div>
    <ParamsError v-else />
  </v-layout>
</template>

<style scoped>
.main {
  width: 100vw;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.app-bar--with-sidebar {
  margin-left: 256px;
  width: calc(100% - 256px) !important;
}

.sidebar--full-height {
  top: 0 !important;
  height: 100vh !important;
}
</style>
