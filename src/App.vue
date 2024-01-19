<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import AppBar from '../src/components/AppBar.vue';
import ParamsError from '../src/components/ParamsError.vue';
import type { Memory, PinStateMap } from "../src/types/types";
import type { BoardData } from "../types/types";
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';

const store = gpioStore();

declare var window: any;

onMounted(() => {
  if (window.gpio_settings) {
    store.ipAddress = window.gpio_settings.ip;
    store.httpPort = window.gpio_settings.port;
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

  source.addEventListener(
    "error",
    (e: Event) => {
      // Assuming e.target is of type EventSource, otherwise adjust the type accordingly.
      const target = e.target as EventSource;
      if (target.readyState !== EventSource.OPEN) {
        console.log("Events Disconnected");
      }
    },
    false
  );
}

const isDataAvailable = computed(() => window.gpio_settings.ip && window.gpio_settings.port);

const boardsData = ref<BoardData[] | undefined>();
onMounted(async () => {
  boardsData.value = await loadBoardsData();
});

async function loadBoardsData(): Promise<BoardData[] | undefined> {
  try {
    const response = await fetch("boards.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json() as BoardData[];
  } catch (error) {
    console.error("Could not load boards data:", error);
  }
}

</script>

<template>
  <v-layout>
    <div v-if="isDataAvailable">
      <v-app-bar color="secondary" rounded elevated density="compact">
        <BoardSelect v-if="boardsData" :boards="boardsData" />
        <v-spacer></v-spacer>

        <v-switch v-model="store.freeze" label="Freeze" color="primary" value="primary" hide-details></v-switch>
      </v-app-bar>

      <v-navigation-drawer temporary>
        <v-list-item title="My Application" subtitle="Vuetify"></v-list-item>
        <v-divider></v-divider>
        <v-list-item link title="List Item 1"></v-list-item>
        <v-list-item link title="List Item 2"></v-list-item>
        <v-list-item link title="List Item 3"></v-list-item>
      </v-navigation-drawer>

      <v-main class="main">
        <RouterView />
      </v-main>
    </div>
    <ParamsError v-else />

  </v-layout>


  <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
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
