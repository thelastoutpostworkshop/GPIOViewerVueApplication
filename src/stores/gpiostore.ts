import { defineStore } from 'pinia'
import { ref } from 'vue';
import { type BoardData, type PinStateMap, type Memory, type PinsConfiguration, type LastPinValues, type PinMode, type PinsFunctions, type PinFunctionDescriptions, type BoardPinsFunction } from '@/types/types';
import { PinModeValue } from '@/const';

export const gpioStore = defineStore('gpioviewer', () => {
  const boards = ref<BoardData[] | null>(null)
  const currentBoard = ref<BoardData | null>(null)
  const currentStates = ref<PinStateMap | null>(null)
  const pinsPreserved = ref<PinsConfiguration | null>(null)
  const lastPinValues = ref<LastPinValues[]>([])
  const pinModes = ref<PinMode[] | null>(null);
  const freeHeap = ref<Memory | null>(null)
  const freePSRAM = ref<Memory | null>(null)
  const freeSketch = ref<Memory | null>(null)
  const ipAddress = ref("")
  const httpPort = ref(0)
  const freeze = ref(false)
  const pinTypeDisplay = ref(0)
  const SamplingInterval = ref(0)
  const connectedToESP32 = ref(false)
  const magnifyImage = ref(0)
  const wifiActivity = ref(0);
  const GPIOViewerRelease = ref("")
  const WebApplicationRelease = ref("")
  const boardPinFunctions = ref<BoardPinsFunction | null>(null)
  function getPinModeValue(pin: number) {
    if (pinModes.value === null) {
      return PinModeValue.UNAVAILABLE;
    }
    const pinWithMode = pinModes.value.find(p => Number(p.pin) === pin);
    return pinWithMode ? Number(pinWithMode.mode) : PinModeValue.NOT_SET;
  }
  function getPinFunction(pin: number): PinFunctionDescriptions[] {
    if (!boardPinFunctions.value?.boardpinsfunction) {
      return [];
    }

    const results: PinFunctionDescriptions[] = [];
    // Iterate through each PinsFunctions in boardPinsFunction.boardpinsfunction
    for (const pinsFunction of boardPinFunctions.value.boardpinsfunction) {
      // Find all descriptions where the pin matches
      const matchingDescriptions = pinsFunction.functions.filter(description => description.pin === pin);
      results.push(...matchingDescriptions);
    }
    return results;
  }

  // const count = ref(0)
  // const name = ref('Eduardo')
  // const doubleCount = computed(() => count.value * 2)
  // function increment() {
  //   count.value++
  // }

  return {
    currentBoard, ipAddress, httpPort, currentStates, freeHeap, freePSRAM,
    freeSketch, freeze, boards, pinTypeDisplay, SamplingInterval, pinsPreserved, connectedToESP32, magnifyImage,
    wifiActivity, GPIOViewerRelease, WebApplicationRelease, lastPinValues, pinModes, getPinModeValue, getPinFunction, boardPinFunctions
  }
})