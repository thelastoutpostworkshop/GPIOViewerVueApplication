<script setup lang="ts">
import type { PinStateMap } from '@/types/types';
import { ref, watch, computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale, Filler } from 'chart.js'
import type { ChartData, ChartDataset, ChartOptions } from 'chart.js';
import { gpioStore } from '@/stores/gpiostore'
import { PinType, GraphColors, PinModeBroad } from '@/const';
import { pinBroadMode } from '@/functions'
import { useTheme } from 'vuetify';

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

const pinsData = ref<ChartData<'line', number[], string>>({
      labels: [],
      datasets: [],
});

const store = gpioStore();
const theme = useTheme();

const selectedPins = ref<number[]>([]);
const graphPaused = ref(false);
const activePins = computed(() =>
      [...store.lastPinValues]
            .sort((a, b) => a.gpio - b.gpio)
            .map((pin) => ({
                  gpio: pin.gpio,
                  type: pin.gpioType,
                  mode: pinBroadMode(pin.gpioType, pin.gpio),
                  sampleCount: pin.values.length
            }))
);
const chartHasSelection = computed(() => selectedPins.value.length > 0);
const chartHasData = computed(() =>
      pinsData.value.datasets.some((dataset) => Array.isArray(dataset.data) && dataset.data.length > 0)
);
const selectedSampleCount = computed(() =>
      selectedPins.value.reduce((highest, pin) => {
            const pinEntry = store.lastPinValues.find((entry) => entry.gpio === pin);
            return Math.max(highest, pinEntry?.values.length ?? 0);
      }, 0)
);
const samplingStatus = computed(() =>
      store.SamplingInterval > 0 ? `@${store.SamplingInterval}ms` : '@--ms'
);
const graphStatus = computed(() => {
      if (graphPaused.value) {
            return {
                  label: 'Paused',
                  color: 'warning',
                  icon: 'mdi-pause-circle-outline'
            };
      }
      if (chartHasData.value) {
            return {
                  label: 'Live',
                  color: 'success',
                  icon: 'mdi-pulse'
            };
      }
      if (chartHasSelection.value) {
            return {
                  label: 'Waiting',
                  color: 'warning',
                  icon: 'mdi-timer-sand'
            };
      }
      return {
            label: 'Idle',
            color: 'default',
            icon: 'mdi-chart-line'
      };
});
const chartOptions = computed<ChartOptions<'line'>>(() => {
      const currentTheme = theme.global.current.value;
      const foreground = currentTheme.dark ? '#e2e8f0' : '#1f2937';
      const mutedForeground = currentTheme.dark ? '#94a3b8' : '#64748b';
      const gridColor = currentTheme.dark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.12)';
      const tooltipBackground = currentTheme.dark ? '#0f172a' : '#ffffff';
      return {
            responsive: true,
            animation: false,
            maintainAspectRatio: false,
            plugins: {
                  legend: {
                        labels: {
                              color: foreground,
                              boxWidth: 14,
                              boxHeight: 14
                        }
                  },
                  tooltip: {
                        backgroundColor: tooltipBackground,
                        titleColor: foreground,
                        bodyColor: foreground,
                        borderColor: gridColor,
                        borderWidth: 1,
                        callbacks: {
                              title: () => ''
                        }
                  },
                  title: {
                        display: true,
                        text: 'Last 100 values',
                        color: foreground,
                        font: {
                              size: 14,
                              weight: 600
                        }
                  }
            },
            scales: {
                  x: {
                        grid: {
                              color: gridColor
                        },
                        ticks: {
                              color: mutedForeground
                        },
                        title: {
                              display: true,
                              text: 'Time offset',
                              color: foreground
                        }
                  },
                  y: {
                        type: 'linear',
                        grid: {
                              color: gridColor
                        },
                        ticks: {
                              color: mutedForeground
                        },
                        title: {
                              display: true,
                              text: 'Value',
                              color: foreground
                        }
                  }
            }
      };
});

watch(selectedPins, () => {
      syncChartData();
});

watch(
      () => store.currentStates,
      (newStates) => {
            updatePinStates(newStates);
      }
);

function selectPinTypes(pintype: number) {
      reset();
      selectedPins.value = store.lastPinValues
            .filter(pin => pin.gpioType === pintype)
            .map(pin => pin.gpio);
}

function selectPinBroadMode(mode: string) {
      reset();
      selectedPins.value = store.lastPinValues
            .filter(pin => pinBroadMode(pin.gpioType, pin.gpio) === mode)
            .map(pin => pin.gpio);
}

function selectAllPins() {
      reset();
      selectedPins.value = activePins.value.map(pin => pin.gpio);
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
      pinsData.value = {
            labels: [],
            datasets: []
      };
}

function updatePinStates(states: PinStateMap | null) {
      if (!states || graphPaused.value) {
            return;
      }
      if (!Object.keys(states).some((gpioId) => selectedPins.value.includes(parseInt(gpioId)))) {
            return;
      }

      syncChartData();
}

function toggleGraphPaused() {
      graphPaused.value = !graphPaused.value;
      if (!graphPaused.value) {
            syncChartData();
      }
}

function syncChartData() {
      const nextDatasets = selectedPins.value.map((pin) => createDatasetForPin(pin));
      const longestSeriesLength = nextDatasets.reduce(
            (longest, dataset) => Math.max(longest, dataset.data.length),
            0
      );

      pinsData.value = {
            labels: createTimeLabels(longestSeriesLength),
            datasets: nextDatasets
      };
}

function createDatasetForPin(pin: number): ChartDataset<'line', number[]> {
      const pinEntry = store.lastPinValues.find((entry) => entry.gpio === pin);
      return {
            label: `GPIO ${pin}`,
            backgroundColor: getGraphColor(pin),
            borderColor: getGraphColor(pin),
            data: pinEntry?.values ? [...pinEntry.values] : [],
            stepped: true,
            yAxisID: 'y',
            pointRadius: 1.5,
            borderWidth: 2,
            tension: 0
      };
}

function createTimeLabels(length: number): string[] {
      return Array.from({ length }, (_, index) => {
            const samplesAgo = length - index - 1;
            if (samplesAgo === 0) {
                  return 'now';
            }
            return formatTimeOffset(samplesAgo * store.SamplingInterval);
      });
}

function formatTimeOffset(milliseconds: number): string {
      if (milliseconds >= 1000) {
            return `-${(milliseconds / 1000).toFixed(milliseconds % 1000 === 0 ? 0 : 1)}s`;
      }
      return `-${milliseconds}ms`;
}

function getGraphColor(pin: number): string {
      return GraphColors[pin % GraphColors.length] ?? '#60a5fa';
}

function pinTypeLabel(pinType: number): string {
      if (pinType === PinType.Digital) {
            return 'Digital';
      }
      if (pinType === PinType.Analog) {
            return 'Analog';
      }
      if (pinType === PinType.PWM) {
            return 'PWM';
      }
      return 'Unknown';
}

</script>

<template>
      <v-container class="plotter-page" fluid>
            <section class="plotter-toolbar">
                  <div class="plotter-toolbar__header">
                        <div>
                              <h2>Pin Data Graph</h2>
                              <p>
                                    <span>{{ selectedPins.length }} selected</span>
                                    <span class="plotter-separator" aria-hidden="true">&middot;</span>
                                    <span>{{ activePins.length }} active pins</span>
                              </p>
                        </div>
                        <div class="plotter-toolbar__actions">
                              <div class="plotter-status" aria-live="polite">
                                    <v-chip :color="graphStatus.color" density="comfortable" size="small" variant="tonal">
                                          <v-icon :icon="graphStatus.icon" size="16" start></v-icon>
                                          {{ graphStatus.label }}
                                    </v-chip>
                                    <span class="plotter-status__meta">{{ selectedSampleCount }} / 100 samples</span>
                                    <span class="plotter-status__meta">{{ samplingStatus }}</span>
                              </div>
                              <v-btn @click="toggleGraphPaused" size="small" variant="tonal"
                                    :disabled="!chartHasSelection">
                                    <v-icon :icon="graphPaused ? 'mdi-play' : 'mdi-pause'" size="16" start></v-icon>
                                    {{ graphPaused ? 'Resume graph' : 'Pause graph' }}
                              </v-btn>
                              <v-btn @click="selectAllPins" size="small" variant="tonal"
                                    :disabled="activePins.length === 0">Select all</v-btn>
                              <v-btn @click="reset" size="small" variant="text"
                                    :disabled="selectedPins.length === 0">Clear</v-btn>
                        </div>
                  </div>

                  <div class="plotter-filter-row">
                        <v-btn :disabled="!isPinTypeAvailable(PinType.Digital).value"
                              @click="selectPinTypes(PinType.Digital)" size="small" variant="tonal">Digital</v-btn>
                        <v-btn :disabled="!isPinTypeAvailable(PinType.Analog).value"
                              @click="selectPinTypes(PinType.Analog)" size="small" variant="tonal">Analog</v-btn>
                        <v-btn :disabled="!isPinTypeAvailable(PinType.PWM).value" @click="selectPinTypes(PinType.PWM)"
                              size="small" variant="tonal">PWM</v-btn>
                        <v-btn :disabled="!isPinBroadModeAvailable(PinModeBroad.OUTPUT).value"
                              @click="selectPinBroadMode(PinModeBroad.OUTPUT)" size="small" variant="tonal">Output</v-btn>
                        <v-btn :disabled="!isPinBroadModeAvailable(PinModeBroad.INPUT).value"
                              @click="selectPinBroadMode(PinModeBroad.INPUT)" size="small" variant="tonal">Input</v-btn>
                  </div>

                  <v-chip-group column multiple v-model="selectedPins" class="pin-chip-group">
                        <v-chip v-for="pin in activePins" :key="pin.gpio" :value="pin.gpio" color="blue" filter
                              density="comfortable" size="small" variant="flat">
                              GPIO {{ pin.gpio }}
                              <span class="pin-chip-meta">
                                    {{ pinTypeLabel(pin.type) }}
                                    <span aria-hidden="true">&middot;</span>
                                    {{ pin.mode }}
                              </span>
                        </v-chip>
                  </v-chip-group>
            </section>

            <v-sheet class="plotter-chart" elevation="10">
                  <Line v-if="chartHasData" :data="pinsData" :options="chartOptions" update-mode="none" />
                  <div v-else class="plotter-empty-state">
                        <v-icon icon="mdi-chart-line" size="44"></v-icon>
                        <div class="plotter-empty-state__title">
                              {{ chartHasSelection ? (graphPaused ? 'Graph paused' : 'Waiting for samples') : 'Select pins to plot' }}
                        </div>
                        <div class="plotter-empty-state__text">
                              {{ chartHasSelection
                                    ? (graphPaused
                                          ? 'Resume graph updates to continue plotting incoming samples.'
                                          : 'Selected pins will appear here when GPIO samples arrive.')
                                    : 'Select one or more active GPIO pins to plot their last 100 samples.' }}
                        </div>
                  </div>
            </v-sheet>
      </v-container>
</template>

<style scoped>
.plotter-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.25rem clamp(1rem, 2.5vw, 2rem) 1.75rem;
}

.plotter-toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgb(var(--v-theme-surface));
      color: rgb(var(--v-theme-on-surface));
      box-shadow: 0 2px 8px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 9%, transparent);
}

.plotter-toolbar__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
}

.plotter-toolbar__header h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 650;
}

.plotter-toolbar__header p {
      margin: 0.2rem 0 0;
      color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
      font-size: 0.88rem;
}

.plotter-toolbar__actions,
.plotter-filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
}

.plotter-toolbar__actions {
      justify-content: flex-end;
      align-items: center;
}

.plotter-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2rem;
}

.plotter-status__meta {
      color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
      font-size: 0.82rem;
      white-space: nowrap;
}

.plotter-separator {
      margin: 0 0.35rem;
}

.pin-chip-group {
      max-height: 9.5rem;
      overflow: auto;
}

.pin-chip-meta {
      margin-left: 0.45rem;
      font-size: 0.72rem;
      opacity: 0.78;
}

.plotter-chart {
      height: 65vh;
      min-height: 360px;
      padding: 1rem;
      border-radius: 12px;
      background: rgb(var(--v-theme-surface));
      color: rgb(var(--v-theme-on-surface));
}

.plotter-empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      text-align: center;
      color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent);
}

.plotter-empty-state__title {
      font-size: 1.05rem;
      font-weight: 650;
      color: rgb(var(--v-theme-on-surface));
}

.plotter-empty-state__text {
      max-width: 34rem;
      font-size: 0.92rem;
}

@media (max-width: 640px) {
      .plotter-toolbar__header {
            flex-direction: column;
      }

      .plotter-toolbar__actions {
            justify-content: flex-start;
      }

      .plotter-chart {
            min-height: 320px;
      }
}
</style>
