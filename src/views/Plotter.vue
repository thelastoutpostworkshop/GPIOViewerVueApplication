<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js';
import { gpioStore } from '@/stores/gpiostore'

ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Title,
      Tooltip,
      Legend
)

interface ActivePins {
      gpio: number[];
      lastValue: number[];
}


const store = gpioStore();

const dataAvailable = ref<boolean>(false);
const cle = ref<number>(0);

const activePins = ref<ActivePins>({
      gpio: [],
      lastValue: []
});

const checkedPins = ref<{ [key: number]: boolean }>({});

activePins.value.gpio.forEach(pin => {
      checkedPins.value[pin] = false;
});

const gpioCheckboxes = computed(() =>
      activePins.value.gpio.map(pin => ({
            pin,
            checked: checkedPins.value[pin]
      }))
);

function addOrUpdateGpioValue(gpioNumber: number, value: number) {
      // Check if the GPIO number is already in the array
      const index = activePins.value.gpio.indexOf(gpioNumber);

      if (index !== -1) {
            // If the GPIO number exists, update its last value
            activePins.value.lastValue[index] = value;
      } else {
            // If the GPIO number does not exist, add it and its value
            activePins.value.gpio.push(gpioNumber);
            activePins.value.lastValue.push(value);
      }
}
const pinsData: ChartData = {
      labels: [],
      datasets: [
            {
                  label: "",
                  backgroundColor: '#f87979',
                  data: [],
                  stepped: true
            }
      ],
};

const options: ChartOptions = {
      responsive: true,
      animation: false,
      maintainAspectRatio: true,
      scales: {
            x: {
                  title: {
                        display: true,
                        text: "ms"
                  }
            }
      }
}

function dataToPlot(gpiopin: number, states: PinStateMap | null): number | undefined {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                  if (gpioIdNum === gpiopin) {
                        addOrUpdateGpioValue(gpioIdNum, pinState.v)
                        return pinState.v;
                  } else {
                        addOrUpdateGpioValue(gpioIdNum, pinState.v)
                  }
            }
      }
      return undefined;
}

function updateDataToPlot(v: number) {
      pinsData.datasets[0].data.push(v);
      pinsData.labels?.push(store.SamplingInterval);
      cle.value += 1;
      dataAvailable.value = true;
}

watch(
      () => store.currentStates,
      (newStates) => {

            const result = dataToPlot(7, newStates); // Example for GPIO pin 7

            if (result !== undefined) {
                  console.log(result);
                  updateDataToPlot(result);
            }
      }
);
</script>

<template>
      <v-container fluid>
            <v-card elevation="16">
                  <v-card-title>
                        Select any active GPIO pins
                  </v-card-title>
                  <div class="d-flex flex-wrap ml-2">
                        <div class="mr-6" v-for="pin in gpioCheckboxes" :key="pin.pin">
                              <v-switch :label="pin.pin.toString()" v-model="checkedPins[pin.pin]" color="primary"
                                    density="compact"></v-switch>
                        </div>

                  </div>
            </v-card>
            <v-sheet class="mt-6">
                  <Line v-if="dataAvailable" :data="pinsData" :options="options" :key="cle" />

            </v-sheet>
      </v-container>
</template>
