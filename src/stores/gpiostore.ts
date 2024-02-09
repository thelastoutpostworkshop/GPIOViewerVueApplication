import { defineStore } from 'pinia'
import { ref, computed } from 'vue';
import type { BoardData, PinStateMap, Memory, PinsConfiguration } from '@/types/types';

export const gpioStore = defineStore('gpioviewer', () => {
  const boards = ref<BoardData[] | null>(null);
  const currentBoard = ref<BoardData | null>(null);
  const currentStates = ref<PinStateMap | null>(null);
  const pinsPreserved = ref<PinsConfiguration | null>(null);
  const freeHeap = ref<Memory | null>(null);
  const freePSRAM = ref<Memory | null>(null);
  const freeSketch = ref<Memory | null>(null);
  const ipAddress = ref("");
  const httpPort = ref(0)
  const freeze = ref(false);
  const pintype = ref(false);
  const SamplingInterval = ref(0);
  const connectedToESP32 = ref(false);
  const magnifyImage = ref(0);
  const wifiActivity = ref(0);
  // const count = ref(0)
  // const name = ref('Eduardo')
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  return {
    currentBoard, ipAddress, httpPort, currentStates, freeHeap, freePSRAM,
    freeSketch, freeze, boards, pintype, SamplingInterval, pinsPreserved, connectedToESP32, magnifyImage,
    wifiActivity
  }
})