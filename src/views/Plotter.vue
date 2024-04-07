<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, computed, reactive } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale } from 'chart.js'
import type { ChartData, ChartOptions, ChartDatasetProperties } from 'chart.js';
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

const activePins = reactive<ActivePins>({
      gpio: [],
      lastValue: []
});


activePins.gpio.forEach(pin => {
      checkedPins[pin] = false;
});

const checkedPins = reactive<{ [key: number]: boolean }>({});

watch(checkedPins, (newVal, oldVal) => {
  console.log(newVal);    
  for (const pin in newVal) {
    if (newVal[pin] !== oldVal[pin]) {
      console.log(`GPIO Pin ${pin} toggled to ${newVal[pin]}`);
      // Execute any additional logic here for when a specific pin's state changes
    }
  }
}); 


const gpioCheckboxes = computed(() =>
      activePins.gpio.map(pin => ({
            pin,
            checked: checkedPins[pin]
      }))
);

function addOrUpdateGpioValue(gpioNumber: number, value: number) {
      // Check if the GPIO number is already in the array
      const index = activePins.gpio.indexOf(gpioNumber);

      if (index !== -1) {
            // If the GPIO number exists, update its last value
            activePins.lastValue[index] = value;
      } else {
            // If the GPIO number does not exist, add it and its value
            activePins.gpio.push(gpioNumber);
            activePins.lastValue.push(value);
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

  // Check if dataset with the same label exists
  const exists = chart.datasets.some(dataset => dataset.label === newDataset.label);
  
  if (!exists) {
    chart.datasets.push(newDataset);
//     chart.update();
  }
}


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

function updatePinStates(states: PinStateMap | null) {
      if (states) {
            for (const [gpioId, pinState] of Object.entries(states)) {
                  const gpioIdNum = parseInt(gpioId);
                        addOrUpdateGpioValue(gpioIdNum, pinState.v)
            }
      }
}

function updateDataToPlot(gpio:number,v: number) {
      pinsData.datasets[gpio].data.push(v);
      pinsData.labels?.push(store.SamplingInterval);
      cle.value += 1;
      dataAvailable.value = true;
}

function updateCharts(states: PinStateMap | null) {
      updatePinStates(states);
}

watch(
      () => store.currentStates,
      (newStates) => {
            
            updateCharts(newStates);
            // const result = dataToPlot(7, newStates); // Example for GPIO pin 7

            // if (result !== undefined) {
            //       console.log(result);
            //       updateDataToPlot(7,result);
            // }
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
