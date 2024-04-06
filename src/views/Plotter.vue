<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch } from 'vue';
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
                        addOrUpdateGpioValue(gpiopin,pinState.v)
                        return pinState.v;
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
      <v-container>
            <Line v-if="dataAvailable" :data="pinsData" :options="options" :key="cle" />
      </v-container>
</template>
