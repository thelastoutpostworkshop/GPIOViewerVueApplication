<script setup lang="ts">
import { ref, onMounted } from 'vue';
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

interface MemoryUsageOverview {
  totalBytes: number;
  usedBytes: number;
  percent: number;
}

const espInfo = ref<ESPInfo>();
const partitionCards = ref<PartitionCard[]>([]);
const flashOverview = ref<FlashOverview | null>(null);
const heapOverview = ref<MemoryUsageOverview | null>(null);
const psramOverview = ref<MemoryUsageOverview | null>(null);
const isLoading = ref(true);

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
      <section class="memory-pane">
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

      <section class="memory-pane">
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

      <section class="memory-pane">
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

      <section v-if="psramOverview" class="memory-pane">
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
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
</style>
