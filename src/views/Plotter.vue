<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, onMounted, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js';
import { gpioStore } from '@/stores/gpiostore'
import { PinType, GraphColors, PinModeBroad } from '@/const';
import { pinBroadMode } from '@/functions'

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

const pinsData: ChartData<'line'> = {
      labels: [],
      datasets: [],
};

const options: ChartOptions<'line'> = {
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      plugins: {
            tooltip: {
                  callbacks: {
                        title: function (context) { return '' }
                  }
            },
            title: {
                  display: true,
                  text: "Last 100 values"
            }
      },
      scales: {
            x: {
                  title: {
                        display: true,
                        text: "Time"
                  }
            },
            y: {
                  type: "linear",
                  title: {
                        display: true,
                        text: 'Value'
                  }
            }

      }
}

const store = gpioStore();

const dataAvailable = ref<boolean>(false);
const cle = ref<number>(0);
const selectedPins = ref<number[]>([]);
const pins = ref<number[]>([]);

watch(selectedPins, (newVal, oldVal) => {
      newVal.forEach(pin => {
            addDataset(pinsData, {
                  label: pin.toString(),
                  backgroundColor: 'rgb(0,0,0)',
                  borderColor: GraphColors[Number(pin)],
                  data: [],
                  stepped: true,
                  yAxisID: 'y'
            }, pin.toString())

      })
      pinsData.datasets.forEach(datasets => {
            if (!selectedPins.value.includes(Number(datasets.label))) {
                  removeDatasetByLabel(pinsData, String(datasets.label));
                  cle.value += 1;
            }
      })
});

watch(
      () => store.currentStates,
      (newStates) => {
            updatePinStates(newStates);
      }
);

onMounted(() => {
      store.lastPinValues.sort((a, b) => a.gpio - b.gpio).forEach(pin => {
            pins.value.push(pin.gpio);
      })
});

function selectPinTypes(pintype: number) {
      reset();
      const digitalPins = store.lastPinValues.filter(pin => pin.gpioType === pintype);
      digitalPins.forEach(pin => { selectedPins.value.push(pin.gpio) })
}

function selectPinBroadMode(mode: string) {
      reset();
      store.lastPinValues.forEach(pin => {
            if (pinBroadMode(pin.gpioType, pin.gpio) === mode) {
                  selectedPins.value.push(pin.gpio)
            }
      })
}

const isPinTypeAvailable = (pintype: number) => computed(() => {
      return store.lastPinValues.some(pin => pin.gpioType === pintype);
});

const isPinBroadModeAvailable = (mode: string) => computed(() => {
      return store.lastPinValues.some(pin => {
            const pinMode = pinBroadMode(pin.gpioType, pin.gpio);
            return pinMode === mode;
      });
});

function reset() {
      selectedPins.value = [];
      pinsData.datasets = [];
      pinsData.labels = [];
      cle.value += 1;
}

function removeDatasetByLabel(chart: ChartData, label: string) {
      if (!chart.datasets) return;

      const index = chart.datasets.findIndex(dataset => dataset.label === label);

      if (index > -1) {
            chart.datasets.splice(index, 1);
      }
}

function addDataset(chart: ChartData, newDataset: any, pin: string) {
      if (!chart.datasets) {
            chart.datasets = [];
      }

      const exists = chart.datasets.some(dataset => dataset.label === newDataset.label);

      if (!exists) {
            chart.datasets.push(newDataset);
            addDataToDatasetByLabel(chart, Number(pin), false);
      }
}

function updatePinStates(states: PinStateMap | null) {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                  addDataToDatasetByLabel(pinsData, gpioIdNum, pinState.t === PinType.Digital);
            }
      }
}

function addDataToDatasetByLabel(chart: ChartData, gpio: number, digitalPin: boolean) {
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
                  <v-card-text>
                        <v-chip-group column multiple v-model="selectedPins">
                              <v-chip v-for="pin in pins" :key="pin" :value="pin" color="blue" filter
                                    density="comfortable" size="small" variant="flat">{{
                                          pin.toString() }}</v-chip>
                        </v-chip-group>

                  </v-card-text>
                  <v-card-actions>
                        <v-btn @click="reset()" elevation="4" size="x-small" class="pa-1"
                              :disabled="selectedPins.length == 0">Reset</v-btn>
                        <v-btn :disabled="!isPinTypeAvailable(PinType.Digital).value"
                              @click="selectPinTypes(PinType.Digital)" size="x-small" class="pa-1">Digital</v-btn>
                        <v-btn :disabled="!isPinTypeAvailable(PinType.Analog).value"
                              @click="selectPinTypes(PinType.Analog)" size="x-small" class="pa-1">Analog</v-btn>
                        <v-btn :disabled="!isPinTypeAvailable(PinType.PWM).value" @click="selectPinTypes(PinType.PWM)"
                              size="x-small" class="pa-1">PWM</v-btn>
                        <v-btn :disabled="!isPinBroadModeAvailable(PinModeBroad.OUTPUT).value"
                              @click="selectPinBroadMode(PinModeBroad.OUTPUT)" size="x-small" class="pa-1">Output</v-btn>
                        <v-btn :disabled="!isPinBroadModeAvailable(PinModeBroad.INPUT).value"
                              @click="selectPinBroadMode(PinModeBroad.INPUT)" size="x-small" class="pa-1">Input</v-btn>
                  </v-card-actions>
            </v-card>
            <v-sheet class="mt-6" elevation="16" height="65vh">
                  <Line v-if="dataAvailable" :data="pinsData" :options="options" :key="cle" />
            </v-sheet>
      </v-container>
</template>
