<script setup lang="ts">
import type { BoardData, PinsConfiguration, PinState, Pins, PinStateMap } from '@/types/types';
import { ref, watch } from 'vue';
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

const chartData = ref<ChartData>({
      datasets: [{
            label: "test",
            backgroundColor: '#f87979',
            data: [],
      }],
      labels: []// Initialize labels as an empty array
});

function dataToPlot(gpiopin: number): number | undefined {
      if (store.currentStates) {
            for (const [gpioId, pinState] of Object.entries(store.currentStates)) {
                  const gpioIdNum = parseInt(gpioId);
                  if (gpioIdNum === gpiopin) {
                        return pinState.v;
                  }
            }
      }
      return undefined;
}


watch(() => store.currentStates, (newStates) => {
      const result = dataToPlot(18); // Example for GPIO pin 7
      if (result !== undefined) {
            chartData.value.datasets[0].data.push(result);
            chartData.value.labels?.push(result.toString());
      }
}, { immediate: true, deep: true });
</script>

<template>
      <Line :data="chartData" :chart-options="{ responsive: true, maintainAspectRatio: false }" />
      <!-- <div>{{ chartData.datasets[0].data }}</div> -->
</template>
