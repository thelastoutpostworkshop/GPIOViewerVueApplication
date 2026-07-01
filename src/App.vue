<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
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
const desktopDrawerOpen = ref(lgAndUp.value);
const mobileDrawerOpen = ref(false);
const drawerOpen = computed({
  get: () => lgAndUp.value ? desktopDrawerOpen.value : mobileDrawerOpen.value,
  set: (isOpen: boolean) => {
    if (lgAndUp.value) {
      desktopDrawerOpen.value = isOpen;
      return;
    }

    mobileDrawerOpen.value = isOpen;
  }
});
const maxLastPinValuesStored = 100;
const router = useRouter()
const route = useRoute()
const { currentThemeName, isDarkTheme, loadSavedTheme, toggleTheme } = useAppTheme();

const resourceLinks = [
  {
    title: 'Tutorial',
    icon: 'mdi-school-outline',
    url: 'https://youtu.be/JJzRXcQrl3I'
  },
  {
    title: 'Buy Me a Coffee',
    icon: 'mdi-coffee-outline',
    url: 'https://buymeacoffee.com/thelastoutpostworkshop'
  },
  {
    title: 'Get Help',
    icon: 'mdi-help-circle-outline',
    url: 'https://github.com/thelastoutpostworkshop/gpio_viewer/discussions'
  }
] as const;

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
    desktopDrawerOpen.value = true;
    return;
  }

  mobileDrawerOpen.value = false;
}, { immediate: true });

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

function openExternalResource(url: string) {
  closeDrawerOnCompactScreen();
  window.open(url, '_blank', 'noopener');
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
        color="surface"
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
        <div class="app-bar-route">
          <RouterView name="AppBar" />
        </div>
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
        :key="lgAndUp ? 'desktop-drawer' : 'mobile-drawer'"
        :class="['sidebar', { 'sidebar--full-height': lgAndUp && drawerOpen }]"
        color="surface"
        v-model="drawerOpen"
        :temporary="!lgAndUp"
        :permanent="lgAndUp"
      >
        <div class="sidebar-brand">
          <div class="sidebar-brand__mark" aria-hidden="true">
            <v-icon icon="mdi-chip"></v-icon>
          </div>
          <div class="sidebar-brand__copy">
            <div class="sidebar-brand__title">GPIOViewer</div>
            <div class="sidebar-brand__version">App v{{ store.WebApplicationRelease }}</div>
          </div>
          <v-btn
            :icon="lgAndUp ? 'mdi-menu-open' : 'mdi-close'"
            variant="text"
            size="small"
            class="sidebar-brand__action"
            :aria-label="lgAndUp ? 'Collapse sidebar' : 'Close sidebar'"
            @click="drawerOpen = false"
          ></v-btn>
        </div>

        <v-list class="sidebar-nav" density="comfortable" nav>
          <v-list-item
            link
            title="GPIOViewer"
            prepend-icon="mdi-view-dashboard-outline"
            :active="route.name === 'gpioview'"
            @click="navigateToRoute('gpioview')"
          ></v-list-item>
          <v-list-item
            link
            title="ESP32 Information"
            prepend-icon="mdi-chip"
            :active="route.name === 'espinfo'"
            @click="navigateToRoute('espinfo')"
          ></v-list-item>
          <v-list-item
            link
            title="Memory Map"
            prepend-icon="mdi-memory"
            :active="route.name === 'memorymap'"
            @click="navigateToRoute('memorymap')"
          ></v-list-item>
          <v-list-item
            link
            title="Pin Data Graph"
            prepend-icon="mdi-chart-line"
            :active="route.name === 'pinplotter'"
            @click="navigateToRoute('pinplotter')"
          ></v-list-item>
        </v-list>

        <v-divider class="sidebar-divider"></v-divider>

        <v-list class="sidebar-nav sidebar-nav--resources" density="comfortable" nav>
          <v-list-subheader class="sidebar-subheader">Resources</v-list-subheader>
          <v-list-item
            v-for="item in resourceLinks"
            :key="item.title"
            link
            :title="item.title"
            :prepend-icon="item.icon"
            append-icon="mdi-open-in-new"
            @click="openExternalResource(item.url)"
          ></v-list-item>
          <v-list-item
            link
            title="About"
            prepend-icon="mdi-information-outline"
            :active="route.name === 'about'"
            @click="navigateToRoute('about')"
          ></v-list-item>
          <v-list-item
            link
            title="Maker Tools"
            prepend-icon="mdi-tools"
            :active="route.name === 'makertools'"
            @click="navigateToRoute('makertools')"
          ></v-list-item>
        </v-list>
        <template v-slot:append>
          <div class="sidebar-footer">
            <span class="sidebar-footer__label">Library</span>
            <span class="sidebar-footer__version">v{{ store.GPIOViewerRelease }}</span>
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

.app-bar-route {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  margin-right: 8px;
}

.sidebar--full-height {
  top: 0 !important;
  height: 100vh !important;
}

.sidebar {
  border-right: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 10%, transparent);
}

.sidebar-brand {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 32px;
  gap: 10px;
  align-items: center;
  margin: 10px;
  padding: 14px 10px;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-primary));
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, rgb(var(--v-theme-primary)) 92%, rgb(var(--v-theme-info)) 8%) 0%,
      color-mix(in srgb, rgb(var(--v-theme-info)) 34%, rgb(var(--v-theme-primary)) 66%) 56%,
      color-mix(in srgb, rgb(var(--v-theme-success)) 40%, rgb(var(--v-theme-primary)) 60%) 100%
    );
  box-shadow: 0 10px 26px color-mix(in srgb, rgb(var(--v-theme-primary)) 28%, transparent);
}

.sidebar-brand__mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  font-size: 1.35rem;
}

.sidebar-brand__copy {
  min-width: 0;
}

.sidebar-brand__title {
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.1;
}

.sidebar-brand__version {
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  padding: 0.16rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.sidebar-brand__action {
  color: rgb(var(--v-theme-on-primary));
}

.sidebar-nav {
  padding: 2px 8px 8px;
}

.sidebar-nav--resources {
  padding-top: 4px;
}

.sidebar-divider {
  margin: 2px 10px 6px;
  opacity: 0.7;
}

.sidebar-subheader {
  min-height: 30px;
  padding-inline: 8px;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 66%, transparent);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sidebar :deep(.v-list-item) {
  margin: 2px 0;
  border-radius: 8px;
}

.sidebar :deep(.v-list-item-title) {
  font-weight: 600;
}

.sidebar :deep(.v-list-item--active) {
  color: rgb(var(--v-theme-info));
  background: color-mix(in srgb, rgb(var(--v-theme-info)) 12%, transparent);
}

.sidebar :deep(.v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 8px 10px 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, rgb(var(--v-theme-secondary)) 72%, transparent);
  color: rgb(var(--v-theme-on-secondary));
  font-size: 0.78rem;
}

.sidebar-footer__label {
  font-weight: 700;
}

.sidebar-footer__version {
  font-family: "Lucida Console", monospace;
  font-weight: 800;
  white-space: nowrap;
}
</style>
