<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, computed, reactive } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'
import type { ChartData, ChartOptions, ChartDatasetProperties } from 'chart.js';
import { gpioStore } from '@/stores/gpiostore'

interface ActivePins {
      gpio: number[];
      lastValue: number[];
}
ChartJS.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
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
      maintainAspectRatio: true,
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

const maxDataStored = 25;
const store = gpioStore();

const dataAvailable = ref<boolean>(false);
const cle = ref<number>(0);

const activePins = reactive<ActivePins>({
      gpio: [],
      lastValue: []
});


activePins.gpio.forEach(pin => {
      checkedPins[pin] = false;
});

const gpioCheckboxes = computed(() =>
      activePins.gpio.map(pin => ({
            pin,
            checked: checkedPins[pin]
      }))
);
const checkedPins = reactive<{ [key: number]: boolean }>({});

watch(checkedPins, (newVal, oldVal) => {
      for (const pin in newVal) {
            if (newVal[pin]) {
                  addDataset(pinsData, {
                        label: pin.toString(),
                        backgroundColor: '#f87979',
                        data: [],
                        stepped: true
                  })
            } else {
                  removeDatasetByLabel(pinsData, pin.toString());
            }
      }
});

watch(
      () => store.currentStates,
      (newStates) => {
            updatePinStates(newStates);
      }
);

function addOrUpdateGpioValue(gpioNumber: number, value: number) {
      const index = activePins.gpio.indexOf(gpioNumber);

      if (index !== -1) {
            activePins.lastValue[index] = value;
      } else {
            activePins.gpio.push(gpioNumber);
            activePins.lastValue.push(value);
      }
}


function removeDatasetByLabel(chart: ChartData, label: string) {
      if (!chart.datasets) return;

      const index = chart.datasets.findIndex(dataset => dataset.label === label);

      if (index > -1) {
            chart.datasets.splice(index, 1);
      }
}

function addDataset(chart: ChartData, newDataset: any) {
      if (!chart.datasets) {
            chart.datasets = [];
      }

      const exists = chart.datasets.some(dataset => dataset.label === newDataset.label);

      if (!exists) {
            chart.datasets.push(newDataset);
      }
}

function updatePinStates(states: PinStateMap | null) {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                  addOrUpdateGpioValue(gpioIdNum, pinState.v)
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
