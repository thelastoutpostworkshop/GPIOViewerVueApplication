<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, computed, reactive,onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale,Filler } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js';
import { gpioStore } from '@/stores/gpiostore'
import { colors } from '@/colors';

ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Filler,
      Title,
      Tooltip,
      Legend
)

const pinsData: ChartData = {
      labels: [],
      datasets: [],
};

const options: ChartOptions = {
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      scales: {
            x: {
                  title: {
                        display: true,
                        text: "ms (approximative)"
                  }
            },
            y: {
                  stacked: true
            }
      }
}

const store = gpioStore();

const dataAvailable = ref<boolean>(false);
const cle = ref<number>(0);

const checkedPins = reactive<{ [key: number]: boolean }>({});

const gpioCheckboxes = computed(() =>
      store.lastPinValues.map(pin => ({
            pin,
            checked: checkedPins[pin.gpio]
      }))
);

watch(checkedPins, (newVal, oldVal) => {
      for (const pin in newVal) {
            if (newVal[pin]) {
                  addDataset(pinsData, {
                        label: pin,
                        backgroundColor: 'rgb(0,0,0)',
                        borderColor:colors[Number(pin)],
                        data: [],
                        stepped: true,
                  },pin)
            } else {
                  removeDatasetByLabel(pinsData, pin.toString());
                  cle.value += 1;
            }
      }
});

watch(
      () => store.currentStates,
      (newStates) => {
            updatePinStates(newStates);
      }
);

onMounted(() => {
      store.lastPinValues.forEach(pin => {
      checkedPins[pin.gpio] = false;
})
});

function removeDatasetByLabel(chart: ChartData, label: string) {
      if (!chart.datasets) return;

      const index = chart.datasets.findIndex(dataset => dataset.label === label);

      if (index > -1) {
            chart.datasets.splice(index, 1);
      }
}

function addDataset(chart: ChartData, newDataset: any,pin:string) {
      if (!chart.datasets) {
            chart.datasets = [];
      }

      const exists = chart.datasets.some(dataset => dataset.label === newDataset.label);

      if (!exists) {
            chart.datasets.push(newDataset);
            addDataToDatasetByLabel(chart,Number(pin));
      }
}

function updatePinStates(states: PinStateMap | null) {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                  addDataToDatasetByLabel(pinsData, gpioIdNum);
            }
      }
}

function addDataToDatasetByLabel(chart: ChartData, gpio: number) {
      const datasetIndex = chart.datasets.findIndex(dataset => dataset.label === gpio.toString());

      if (datasetIndex !== -1) {
            let pinEntry = store.lastPinValues.find(p => p.gpio === gpio);
            if (pinEntry) {
                  if (pinEntry.values) {
                        chart.datasets[datasetIndex].data = [...pinEntry.values];
                        chart.labels = new Array(pinEntry.values.length).fill(store.SamplingInterval.toString());

                  } else {
                        chart.datasets[datasetIndex].data = [];
                        chart.labels = [];
                  }
                  cle.value += 1;
                  dataAvailable.value = true;
            }
      }
}

</script>

<template>
      <v-container fluid>
            <v-card elevation="16">
                  <v-card-title>
                        Select any active GPIO pins
                  </v-card-title>
                  <div class="d-flex flex-wrap ml-2">
                        <div class="mr-6" v-for="pin in gpioCheckboxes" :key="pin.pin.gpio">
                              <v-switch :label="pin.pin.gpio.toString()" v-model="checkedPins[pin.pin.gpio]" color="primary"
                                    density="compact"></v-switch>
                        </div>

                  </div>
            </v-card>
            <v-sheet class="mt-6" elevation="16">
                  <Line v-if="dataAvailable" :data="pinsData" :options="options" :key="cle" />

            </v-sheet>
      </v-container>
</template>
