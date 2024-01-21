<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import ParamsError from '@/components/ParamsError.vue';
import type { Memory, PinStateMap, GPIOViewerRelease } from "../src/types/types";
import type { BoardData } from "@/types/types";
import { gpioStore } from '@/stores/gpiostore'
import logo from '@/assets/images/GPIOViewerLogo.png';

const store = gpioStore();
const drawerOpen = ref(false);
const GPIOViewerRelease = ref("");
const aboutDialogOpen = ref(false);

const WebApplicationVersion = "2.0.0";

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

function goToGithubDiscussion() {
  window.open('https://github.com/thelastoutpostworkshop/gpio_viewer/discussions', '_blank');
}
function goToGithubIssues() {
  window.open('https://github.com/thelastoutpostworkshop/gpio_viewer/issues', '_blank');
}

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

const localNetworkAdressKnown = computed(() => window.gpio_settings.ip && window.gpio_settings.port);

onMounted(async () => {
  store.boards = await loadBoardsData();
  fetchGPIOViewerReleaseVersion();
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
    const url = `http://${store.ipAddress}:${store.httpPort}/release`;
    const response = await fetch(url);
    const data: GPIOViewerRelease = await response.json();
    GPIOViewerRelease.value = data.release;

  } catch (error) {
    GPIOViewerRelease.value = "1.0.4 or less";
    console.error("Error fetching release version:", error);
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
        <v-list-item title="GPIOViewer" :subtitle="'v' + GPIOViewerRelease"></v-list-item>
        <v-divider></v-divider>
        <v-list-item link title="About" @click="aboutDialogOpen = true"></v-list-item>
        <v-list-item link title="GPIOViewer"></v-list-item>
        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2 text-caption text-grey-lighten-1">
            Web application v{{ WebApplicationVersion }}
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
    <v-dialog v-model="aboutDialogOpen" width="auto">
      <v-card class="" subtitle="'Transforms the way you troubleshoot your microcontroller projects"
        elevation="16">
        <template v-slot:title>
          GPIOViewer
        </template>
        <template v-slot:prepend>
          <v-avatar>
            <v-img :src="logo">

            </v-img>
          </v-avatar>
        </template>
        <v-card-text>
          <p class="text-body-1">
            An open source Arduino Library to see live GPIO Pins on ESP32 boards </p>
          <v-divider></v-divider>
          <p class="text-body-2 pt-4 d-none d-sm-flex">
            <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
            Share Your Story: Join the Discussion<v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
          </p>
          <p class="text-body-2 pt-4 d-flex d-sm-none">
            <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
            Share Your Story <v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
          </p>
          <p class="text-body-2 pt-4 d-none d-sm-flex">
            <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
            Report, Track Issues & Request new board <v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
          </p>
          <p class="text-body-2 pt-4 d-flex d-sm-none">
            <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
            Report Issues <v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
          </p>
        </v-card-text>
        <v-card-actions>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
