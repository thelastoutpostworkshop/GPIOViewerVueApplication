import { defineStore } from 'pinia'
import { ref, computed } from 'vue';
import type { BoardData } from '@/types/types';

export const gpioStore = defineStore('gpioviewer', () => {
  const currentBoard = ref<BoardData | null>(null);
  const ipAddress = ref("");
  const httpPort = ref(0)
  // const count = ref(0)
  // const name = ref('Eduardo')
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  return { currentBoard,ipAddress,httpPort }
})