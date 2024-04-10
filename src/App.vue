<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import ParamsError from '@/components/ParamsError.vue';
import type { Memory, PinStateMap, GPIOViewerRelease, SamplingInterval } from "../src/types/types";
import type { BoardData } from "@/types/types";
import { gpioStore } from '@/stores/gpiostore'
import { getAPIUrl } from "@/functions";

const store = gpioStore();
const drawerOpen = ref(false);
const maxLastPinValuesStored = 100;

store.WebApplicationRelease = "2.1.0";

declare var window: any;

onMounted(() => {
  if (window.gpio_settings) {
    store.ipAddress = window.gpio_settings.ip;
    store.httpPort = window.gpio_settings.port;
    store.freeSketch = window.gpio_settings.freeSketchRam;
    console.log(window.gpio_settings);
    initEventSource();
  }
});

function addLastPinValues(states: PinStateMap) {
  // First, update or add new states from the states object
  Object.entries(states).forEach(([gpio, pinState]) => {
    const gpioNum = parseInt(gpio);
    let pinEntry = store.lastPinValues.find(p => p.gpio === gpioNum);

    if (!pinEntry) {
      pinEntry = { gpio: gpioNum, values: [] };
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
  <v-layout>
    <div v-if="localNetworkAdressKnown">

      <v-app-bar color="primary" rounded elevated density="compact">

        <template v-slot:prepend>
          <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen"></v-app-bar-nav-icon>
        </template>
        <RouterView name="AppBar" />

      </v-app-bar>

      <v-navigation-drawer color="primary" v-model="drawerOpen" temporary>
        <v-list-item title="GPIOViewer" :subtitle="'v' + store.GPIOViewerRelease"></v-list-item>
        <v-divider></v-divider>
        <v-list-item link title="About" @click="$router.push({ name: 'about' })"></v-list-item>
        <v-list-item link title="GPIOViewer" @click="$router.push({ name: 'gpioview' })"></v-list-item>
        <v-list-item link title="ESP32 Information" @click="$router.push({ name: 'espinfo' })"></v-list-item>
        <v-list-item link title="Memory Map" @click="$router.push({ name: 'memorymap' })"></v-list-item>
        <v-list-item link title="Pin Data Graph" @click="$router.push({ name: 'pinplotter' })"></v-list-item>
        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2 text-caption text-grey-lighten-1">
            Web application v{{ store.WebApplicationRelease }}
          </div>
        </template>
      </v-navigation-drawer>

      <v-main class="main">
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
}
</style>
