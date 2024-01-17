import { defineStore } from 'pinia'
import { ref, computed } from 'vue';
import type { BoardData, PinStateMap, Memory } from '@/types/types';

export const gpioStore = defineStore('gpioviewer', () => {
  const currentBoard = ref<BoardData | null>(null);
  const currentStates = ref<PinStateMap | null>(null);
  const freeHeap = ref<Memory | null>(null);
  const ipAddress = ref("");
  const httpPort = ref(0)
  // const count = ref(0)
  // const name = ref('Eduardo')
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  return { currentBoard, ipAddress, httpPort, currentStates, freeHeap }
})