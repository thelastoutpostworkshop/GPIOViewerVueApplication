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

store.WebApplicationRelease = "2.0.10";

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

function initEventSource(): void {
  console.log("Waiting to connect to ESP32: with EventSource: ");
  const source = new EventSource("http://" + store.ipAddress + ":" + store.httpPort + "/events");

  source.addEventListener(
    "gpio-state",
    (e: MessageEvent) => {
      if (!store.freeze) {
        const states = JSON.parse(e.data) as PinStateMap;
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
