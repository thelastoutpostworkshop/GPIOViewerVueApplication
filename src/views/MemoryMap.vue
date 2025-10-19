<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ESPInfo, ESPPartition } from "@/types/types";
import { getAPIUrl, formatBytes } from "@/functions";

const spiffs = "spiffs";
const ffat = "ffat";

interface PartitionCard extends ESPPartition {
  color: string;
  percentOfFlash: number;
  formattedSize: string;
  formattedAddress: string;
}

interface FlashOverview {
  totalBytes: number;
  sketchPercent: number;
  sketchBytes: number;
  fsPercent: number;
  fsBytes: number;
  fsLabel: string;
  freePercent: number;
  freeBytes: number;
}

interface FlashStackSegment {
  id: string;
  label: string;
  percent: number;
  bytes: number;
  background: string;
  textColor: string;
}

interface MemoryUsageOverview {
  totalBytes: number;
  usedBytes: number;
  percent: number;
}

const espInfo = ref<ESPInfo>();
const partitionCards = ref<PartitionCard[]>([]);
const flashOverview = ref<FlashOverview | null>(null);
const flashStackSegments = ref<FlashStackSegment[]>([]);
const heapOverview = ref<MemoryUsageOverview | null>(null);
const psramOverview = ref<MemoryUsageOverview | null>(null);
const isLoading = ref(true);
const partitionTutorialUrl = "https://youtu.be/EuHxodrye6E";

const partitionColorOverrides: Record<string, string> = {
  boot: "#3949ab",
  factory: "#8d6e63",
  ota_0: "#ff7043",
  ota_1: "#ffa726",
  nvs: "#26a69a",
  phy_init: "#ab47bc",
  otadata: "#42a5f5"
};

const partitionPalette = ["#5c6bc0", "#26a69a", "#ffa726", "#8d6e63", "#ab47bc", "#29b6f6", "#ffca28", "#ec407a"];

function resolvePartitionColor(label: string, index: number): string {
  const normalized = label.toLowerCase();
  if (partitionColorOverrides[normalized]) {
    return partitionColorOverrides[normalized];
  }
  return partitionPalette[index % partitionPalette.length];
}

async function fetchESPInformation(): Promise<ESPInfo | null> {
  try {
    const response = await fetch(getAPIUrl("espinfo"));
    const data: ESPInfo = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching esp information", error);
    return null;
  }
}

async function fetchESPPartition(): Promise<ESPPartition[] | null> {
  try {
    const response = await fetch(getAPIUrl("partition"));
    const data: ESPPartition[] = await response.json();
    data.sort((a, b) => parseInt(a.address, 16) - parseInt(b.address, 16));
    return data;
  } catch (error) {
    console.error("Error fetching esp partition", error);
    return null;
  }
}

function calculateMetrics(info: ESPInfo, partitions: ESPPartition[]) {
  const flashCapacity = info.flash_chip_size;
  let colorIndex = 0;
  let fsPartition: ESPPartition | undefined;

  const cards: PartitionCard[] = partitions.reduce<PartitionCard[]>((acc, partition) => {
    const normalizedLabel = partition.label.toLowerCase();
    if (normalizedLabel === spiffs || normalizedLabel === ffat) {
      if (!fsPartition) {
        fsPartition = partition;
      }
      return acc;
    }

    const percent = flashCapacity
      ? Math.max(0, Math.round((partition.size / flashCapacity) * 1000) / 10)
      : 0;

    const card: PartitionCard = {
      ...partition,
      color: resolvePartitionColor(partition.label, colorIndex),
      percentOfFlash: percent,
      formattedSize: formatBytes(partition.size),
      formattedAddress: partition.address.startsWith("0x") ? partition.address : `0x${partition.address}`
    };

    colorIndex += 1;
    acc.push(card);
    return acc;
  }, []);

  partitionCards.value = cards;

  const sketchPercent = flashCapacity
    ? Math.max(0, Math.round((info.sketch_size / flashCapacity) * 1000) / 10)
    : 0;

  const fsPercent = flashCapacity && fsPartition
    ? Math.max(0, Math.round((fsPartition.size / flashCapacity) * 1000) / 10)
    : 0;

  const freeBytes = Math.max(0, flashCapacity - info.sketch_size - (fsPartition?.size ?? 0));
  const freePercent = flashCapacity
    ? Math.max(0, Math.round((freeBytes / flashCapacity) * 1000) / 10)
    : 0;

  flashOverview.value = {
    totalBytes: flashCapacity,
    sketchPercent,
    sketchBytes: info.sketch_size,
    fsPercent,
    fsBytes: fsPartition?.size ?? 0,
    fsLabel: fsPartition?.label ?? "",
    freePercent,
    freeBytes
  };

  const stackSegments: FlashStackSegment[] = [];
  if (sketchPercent > 0) {
    stackSegments.push({
      id: "sketch",
      label: "Sketch",
      percent: sketchPercent,
      bytes: info.sketch_size,
      background: "linear-gradient(180deg, #3949ab, #5c6bc0)",
      textColor: "#ffffff"
    });
  }

  if (fsPercent > 0) {
    stackSegments.push({
      id: "filesystem",
      label: fsPartition?.label ? fsPartition.label.toUpperCase() : "FILESYSTEM",
      percent: fsPercent,
      bytes: fsPartition?.size ?? 0,
      background: "linear-gradient(180deg, #00897b, #26a69a)",
      textColor: "#ffffff"
    });
  }

  if (freePercent > 0) {
    stackSegments.push({
      id: "free",
      label: "Free",
      percent: freePercent,
      bytes: freeBytes,
      background: "linear-gradient(180deg, #e0e7ec, #f5f7fa)",
      textColor: "#1f2933"
    });
  }

  flashStackSegments.value = stackSegments;

  const heapUsedBytes = Math.max(0, info.heap_size - info.free_heap);
  heapOverview.value = {
    totalBytes: info.heap_size,
    usedBytes: heapUsedBytes,
    percent: info.heap_size
      ? Math.max(0, Math.round((heapUsedBytes / info.heap_size) * 1000) / 10)
      : 0
  };

  if (info.psram_size > 0) {
    const psramUsedBytes = Math.max(0, info.psram_size - info.free_psram);
    psramOverview.value = {
      totalBytes: info.psram_size,
      usedBytes: psramUsedBytes,
      percent: Math.max(0, Math.round((psramUsedBytes / info.psram_size) * 1000) / 10)
    };
  } else {
    psramOverview.value = null;
  }
}

const hasReclaimableFlash = computed(() =>
  flashStackSegments.value.some((segment) => segment.id === "free" && segment.bytes > 0)
);

onMounted(async () => {
  try {
    const [espInfoData, espPartitionData] = await Promise.all([fetchESPInformation(), fetchESPPartition()]);

    if (espInfoData && espPartitionData) {
      espInfo.value = espInfoData;
      calculateMetrics(espInfoData, espPartitionData);
    }
  } catch (error) {
    console.error("Error getting partition and ESP Information data", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div v-if="!isLoading && espInfo" class="memory-dashboard">
    <div class="memory-grid">
      <section class="memory-pane memory-pane--flash-layout">
        <header class="pane-header">
          <h2>Flash Layout</h2>
          <span class="pane-meta">Total {{ formatBytes(espInfo.flash_chip_size) }}</span>
        </header>

        <div v-if="partitionCards.length" class="partition-list">
          <v-tooltip
            v-for="partition in partitionCards"
            :key="partition.address"
            :text="`${partition.label.toUpperCase()} - ${partition.formattedSize} - Offset ${partition.formattedAddress}`"
            location="bottom"
          >
            <template #activator="{ props }">
              <div class="partition-card" v-bind="props">
                <div class="partition-card__header">
                  <div class="partition-chip" :style="{ backgroundColor: partition.color }"></div>
                  <div class="partition-title">{{ partition.label }}</div>
                  <div class="partition-size">{{ partition.formattedSize }}</div>
                </div>
                <v-progress-linear
                  :model-value="partition.percentOfFlash"
                  :color="partition.color"
                  height="12"
                  rounded
                  class="partition-progress"
                ></v-progress-linear>
                <div class="partition-meta">
                  <span>{{ partition.percentOfFlash }}% of flash</span>
                  <span>Start {{ partition.formattedAddress }}</span>
                </div>
              </div>
            </template>
          </v-tooltip>
        </div>
        <div v-else class="empty-state">
          No additional partitions detected.
        </div>
      </section>

      <div class="memory-right-column">
        <section class="memory-pane memory-pane--flash-usage">
          <header class="pane-header">
            <h2>Flash Usage</h2>
            <span class="pane-meta">Overview of sketch and filesystem usage</span>
          </header>

          <div v-if="flashOverview" class="usage-block">
            <div class="stacked-bar" v-if="flashOverview.totalBytes">
              <v-tooltip
                :text="`Sketch: ${flashOverview.sketchPercent}% - ${formatBytes(flashOverview.sketchBytes)}`"
                location="bottom"
              >
                <template #activator="{ props }">
                  <div
                    class="stacked-segment stacked-segment--sketch"
                    v-bind="props"
                    :style="{ width: flashOverview.sketchPercent + '%' }"
                  ></div>
                </template>
              </v-tooltip>

              <v-tooltip
                v-if="flashOverview.fsPercent > 0"
                :text="`${flashOverview.fsLabel.toUpperCase()}: ${flashOverview.fsPercent}% - ${formatBytes(flashOverview.fsBytes)}`"
                location="bottom"
              >
                <template #activator="{ props }">
                  <div
                    class="stacked-segment stacked-segment--fs"
                    v-bind="props"
                    :style="{ width: flashOverview.fsPercent + '%' }"
                  ></div>
                </template>
              </v-tooltip>

              <v-tooltip
                v-if="flashOverview.freePercent > 0"
                :text="`Free: ${flashOverview.freePercent}% - ${formatBytes(flashOverview.freeBytes)}`"
                location="bottom"
              >
                <template #activator="{ props }">
                  <div
                    class="stacked-segment stacked-segment--free"
                    v-bind="props"
                    :style="{ width: flashOverview.freePercent + '%' }"
                  ></div>
                </template>
              </v-tooltip>
            </div>

            <ul class="usage-list">
              <li>
                <span class="usage-label">Sketch</span>
                <span class="usage-value">{{ flashOverview.sketchPercent }}% - {{ formatBytes(flashOverview.sketchBytes) }}</span>
              </li>
              <li v-if="flashOverview.fsPercent > 0">
                <span class="usage-label">{{ flashOverview.fsLabel }}</span>
                <span class="usage-value">{{ flashOverview.fsPercent }}% - {{ formatBytes(flashOverview.fsBytes) }}</span>
              </li>
              <li>
                <span class="usage-label">Free</span>
                <span class="usage-value">{{ flashOverview.freePercent }}% - {{ formatBytes(flashOverview.freeBytes) }}</span>
              </li>
            </ul>
          </div>
        </section>

        <section class="memory-pane memory-pane--heap">
          <header class="pane-header">
            <h2>Heap Usage</h2>
            <span class="pane-meta">Total {{ formatBytes(heapOverview?.totalBytes ?? 0) }}</span>
          </header>

          <div v-if="heapOverview" class="usage-block">
            <v-tooltip
              :text="`Used: ${heapOverview.percent}% - ${formatBytes(heapOverview.usedBytes)}`"
              location="bottom"
            >
              <template #activator="{ props }">
                <v-progress-linear
                  v-bind="props"
                  :model-value="heapOverview.percent"
                  color="#3949ab"
                  height="14"
                  rounded
                ></v-progress-linear>
              </template>
            </v-tooltip>
            <div class="usage-footer">
              {{ heapOverview.percent }}% used ({{ formatBytes(heapOverview.usedBytes) }})
            </div>
          </div>
        </section>

        <section v-if="psramOverview" class="memory-pane memory-pane--psram">
          <header class="pane-header">
            <h2>PSRAM Usage</h2>
            <span class="pane-meta">Total {{ formatBytes(psramOverview.totalBytes) }}</span>
          </header>

          <div class="usage-block">
            <v-tooltip
              :text="`Used: ${psramOverview.percent}% - ${formatBytes(psramOverview.usedBytes)}`"
              location="bottom"
            >
              <template #activator="{ props }">
                <v-progress-linear
                  v-bind="props"
                  :model-value="psramOverview.percent"
                  color="#8e24aa"
                  height="14"
                  rounded
                ></v-progress-linear>
              </template>
            </v-tooltip>
            <div class="usage-footer">
              {{ psramOverview.percent }}% used ({{ formatBytes(psramOverview.usedBytes) }})
            </div>
          </div>
        </section>
      </div>

      <section class="memory-pane memory-pane--flash-stack">
        <header class="pane-header">
          <h2>Flash Stack Map</h2>
          <span class="pane-meta">Relative share of flash by usage</span>
        </header>

        <v-alert
          v-if="flashStackSegments.length && hasReclaimableFlash"
          color="orange-darken-2"
          variant="tonal"
          border="start"
          class="reclaim-hint reclaim-hint--inline"
          density="compact"
          icon="mdi-lightbulb-on-outline"
        >
          <span>
            Unused flash detected.
            <span class="reclaim-highlight">Reclaim wasted space</span> - see the
            <a :href="partitionTutorialUrl" target="_blank" rel="noopener" class="reclaim-link">partition tutorial</a>.
          </span>
        </v-alert>

        <template v-if="flashStackSegments.length">
          <div class="stacked-column-wrapper">
            <div class="stacked-column">
              <v-tooltip
                v-for="segment in flashStackSegments"
                :key="segment.id"
                :text="`${segment.label}: ${segment.percent}% - ${formatBytes(segment.bytes)}`"
                location="right"
              >
                <template #activator="{ props }">
                  <div
                    class="stacked-column__segment"
                    v-bind="props"
                    :style="[
                      { height: segment.percent + '%', background: segment.background, color: segment.textColor },
                      segment.percent < 6 ? { minHeight: '28px' } : {}
                    ]"
                  >
                    <span v-if="segment.percent >= 12" class="stacked-column__label">{{ segment.label }}</span>
                  </div>
                </template>
              </v-tooltip>
            </div>

            <ul class="stacked-legend">
              <li v-for="segment in flashStackSegments" :key="`${segment.id}-legend`">
                <span class="stacked-legend__color" :style="{ background: segment.background }"></span>
                <span class="stacked-legend__text">{{ segment.label }}</span>
                <span class="stacked-legend__value">{{ segment.percent }}% - {{ formatBytes(segment.bytes) }}</span>
              </li>
            </ul>
          </div>

        </template>
        <div v-else class="empty-state">
          Flash usage data unavailable.
        </div>
      </section>
    </div>
  </div>

  <div v-else class="loading-state">
    <v-container>
      <v-progress-circular :size="96" :width="8" color="green" indeterminate></v-progress-circular>
    </v-container>
  </div>
</template>

<style scoped>
.memory-dashboard {
  padding: 1.5rem 0;
}

.memory-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

.memory-right-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

@media (min-width: 900px) {
  .memory-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-flow: row dense;
  }

  .memory-pane--flash-layout {
    grid-column: 1 / -1;
  }

  .memory-right-column {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1280px) {
  .memory-grid {
    grid-template-columns: 1.75fr 1fr;
    grid-template-areas:
      "flash-layout right-column"
      "flash-stack right-column";
    align-items: start;
  }

  .memory-pane--flash-layout {
    grid-area: flash-layout;
  }

  .memory-pane--flash-stack {
    grid-area: flash-stack;
  }

  .memory-right-column {
    grid-area: right-column;
    align-self: start;
    max-width: 400px;
    gap: 1rem;
  }

  .memory-right-column .memory-pane {
    padding: 0.85rem 1rem;
    gap: 0.55rem;
  }

  .memory-right-column .pane-header {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.35rem;
  }

  .memory-right-column .pane-header h2 {
    font-size: 0.98rem;
  }

  .memory-right-column .pane-meta {
    font-size: 0.8rem;
    margin-left: auto;
  }

  .memory-right-column .usage-block {
    gap: 0.45rem;
  }

  .memory-right-column .usage-list li {
    font-size: 0.86rem;
  }
}

.memory-pane {
  background-color: #f8f9fd;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pane-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pane-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2933;
}

.pane-meta {
  color: #607086;
  font-size: 0.85rem;
}

.partition-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.partition-card {
  padding: 0.75rem 0.75rem 0.5rem;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(99, 110, 123, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.partition-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.partition-chip {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  flex-shrink: 0;
}

.partition-title {
  font-weight: 600;
  text-transform: uppercase;
  color: #334155;
  flex-grow: 1;
  letter-spacing: 0.03em;
}

.partition-size {
  font-size: 0.85rem;
  color: #475569;
}

.partition-progress {
  background-color: rgba(99, 110, 123, 0.12);
}

.partition-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #607086;
}

.usage-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stacked-column-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
  flex-wrap: nowrap;
}

.stacked-column {
  flex: 0 0 120px;
  height: 260px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  box-shadow: inset 0 0 0 1px rgba(99, 110, 123, 0.1);
  background: #edf1f7;
}

.stacked-column__segment {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.35rem 0.25rem;
  text-align: center;
}

.stacked-column__label {
  display: block;
}

.stacked-legend {
  list-style: none;
  margin: 0;
  padding: 0 0 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.stacked-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 0.4rem;
  font-size: 0.86rem;
  color: #334155;
}

.stacked-legend__color {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px rgba(31, 41, 51, 0.08);
  flex-shrink: 0;
}

.stacked-legend__text {
  font-weight: 600;
  color: #1f2933;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stacked-legend__value {
  font-variant-numeric: tabular-nums;
  color: #24344b;
  justify-self: end;
}

.reclaim-hint {
  background: linear-gradient(135deg, rgba(255, 171, 64, 0.22), rgba(255, 214, 102, 0.28));
  border-left-width: 6px !important;
  border-color: rgba(255, 143, 0, 0.8) !important;
}

.reclaim-hint--inline {
  margin-bottom: 0.85rem;
}

.reclaim-highlight {
  font-weight: 700;
  color: #c05621;
}

@media (min-width: 1024px) {
  .stacked-column-wrapper {
    flex-direction: row;
    gap: 1.2rem;
    align-items: stretch;
  }

  .stacked-legend {
    flex: 1 1 auto;
    align-self: center;
  }
}

.reclaim-link {
  color: #1a57c5;
  font-weight: 600;
  text-decoration: underline;
}

.reclaim-link:hover {
  text-decoration: none;
}

.stacked-bar {
  display: flex;
  height: 18px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(99, 110, 123, 0.1);
}

.stacked-segment {
  height: 100%;
}

.stacked-segment--sketch {
  background: linear-gradient(90deg, #3949ab, #5c6bc0);
}

.stacked-segment--fs {
  background: linear-gradient(90deg, #00897b, #26a69a);
}

.stacked-segment--free {
  background: linear-gradient(90deg, #cfd8dc, #eceff1);
}

.usage-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.usage-list li {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #475569;
}

.usage-label {
  font-weight: 600;
  color: #334155;
}

.usage-value {
  font-variant-numeric: tabular-nums;
}

.usage-footer {
  font-size: 0.85rem;
  color: #475569;
  text-align: right;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40dvh;
}

.empty-state {
  padding: 1rem;
  background: rgba(99, 110, 123, 0.08);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #607086;
  text-align: center;
}

:deep(.v-theme--dark) .memory-dashboard {
  color: #e2e8f0;
}

:deep(.v-theme--dark) .memory-pane {
  background-color: rgba(15, 23, 42, 0.78);
  box-shadow: 0 12px 32px rgba(10, 17, 29, 0.72);
}

:deep(.v-theme--dark) .pane-header h2 {
  color: #f8fafc;
}

:deep(.v-theme--dark) .pane-meta {
  color: #94a3b8;
}

:deep(.v-theme--dark) .partition-card {
  background-color: rgba(24, 35, 52, 0.9);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.1);
}

:deep(.v-theme--dark) .partition-title {
  color: #f8fafc;
}

:deep(.v-theme--dark) .partition-size,
:deep(.v-theme--dark) .partition-meta {
  color: #cbd5f5;
}

:deep(.v-theme--dark) .stacked-column {
  background: rgba(15, 23, 42, 0.92);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

:deep(.v-theme--dark) .stacked-legend__text {
  color: #f8fafc;
}

:deep(.v-theme--dark) .stacked-legend__value {
  color: #cbd5f5;
}

:deep(.v-theme--dark) .usage-list li,
:deep(.v-theme--dark) .usage-footer {
  color: #cbd5f5;
}

:deep(.v-theme--dark) .usage-label {
  color: #f8fafc;
}

:deep(.v-theme--dark) .reclaim-hint {
  background: linear-gradient(135deg, rgba(255, 155, 55, 0.25), rgba(255, 204, 102, 0.3));
}

:deep(.v-theme--dark) .empty-state {
  background: rgba(226, 232, 240, 0.06);
  color: #cbd5f5;
}
</style>
