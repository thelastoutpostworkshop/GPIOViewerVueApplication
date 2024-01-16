<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import AppBar from '../src/views/AppBar.vue';
import ParamsError from '../src/components/ParamsError.vue';
import { gpioStore } from '@/stores/gpiostore'
import type { BoardData, PinStateMap } from "../src/types/types";

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
      const states = JSON.parse(e.data) as PinStateMap;
      store.currentStates = states;
      // saveBoardStates(states);
      // setAllIndicatorColor(states);
      // showWifiActivity();
    },
    false
  );

  source.addEventListener(
    "free_heap",
    (e: MessageEvent) => {
      const freeHeap = document.getElementById("freeHeap");
      if (freeHeap) {
        freeHeap.innerHTML = "Free Heap:" + e.data;
      }
      // showWifiActivity();
    },
    false
  );

  source.addEventListener(
    "free_psram",
    (e: MessageEvent) => {
      const freePSRAM = document.getElementById("freePSRAM");
      if (freePSRAM) {
        freePSRAM.innerHTML = "Free PSRAM:" + e.data;
      }
      // showWifiActivity();
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

</script>

<template>
  <VLayout>
    <div v-if="isDataAvailable">
      <AppBar />


      <VMain class="main">
        <RouterView />
      </VMain>
    </div>
    <ParamsError v-else />

  </VLayout>


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
