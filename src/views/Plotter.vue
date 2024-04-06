<script setup lang="ts">
import type { BoardData, PinsConfiguration, PinState, Pins, PinStateMap } from '@/types/types';
import { ref, watch, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'
import type { ChartData } from 'chart.js';
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

const store = gpioStore();

const dataAvailable = ref<boolean>(false);
const pinsData: ChartData = {
      labels: [],
      datasets: [
            {
                  label: "test",
                  backgroundColor: '#f87979',
                  data: [],
            }
      ],
};

const displayData = ref<ChartData>();

function dataToPlot(gpiopin: number, states: PinStateMap | null): number | undefined {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                  if (gpioIdNum === gpiopin) {
                        return pinState.v;
                  }
            }
      }
      return undefined;
}

function updateDataToPlot(v: number) {
      pinsData.datasets[0].data.push(v);
      pinsData.labels?.push(v.toString());
      displayData.value = JSON.parse(JSON.stringify(pinsData));
      dataAvailable.value = true;

}

watch(
      () => store.currentStates,
      (newStates) => {

            const result = dataToPlot(18, newStates); // Example for GPIO pin 7

            if (result) {
                  console.log(result);
                  updateDataToPlot(result);
            }
      }
);
</script>

<template>
      <Line v-if="dataAvailable" :data="displayData"
            :chart-options="{ responsive: true, maintainAspectRatio: false }" />
      <!-- <div>{{ chartData.datasets[0].data }}</div> -->
</template>
