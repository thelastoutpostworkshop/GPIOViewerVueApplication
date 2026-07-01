<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ESPInfo, ESPPartition } from "@/types/types";
import { getAPIUrl, formatBytes } from "@/functions";
import { buildPartitionBuilderUrl } from "@/partitionBuilder";

const spiffs = "spiffs";
const ffat = "ffat";

interface FlashStackSegment {
  id: string;
  label: string;
  percent: number;
  bytes: number;
  background: string;
  textColor: string;
  usageKind: "App" | "Data" | "Unused" | "Unknown";
}

interface MemoryUsageOverview {
  totalBytes: number;
  usedBytes: number;
  percent: number;
}

const espInfo = ref<ESPInfo>();
const espPartitions = ref<ESPPartition[]>([]);
const flashStackSegments = ref<FlashStackSegment[]>([]);
const stackedColumnSegments = computed(() => [...flashStackSegments.value].reverse());
const heapOverview = ref<MemoryUsageOverview | null>(null);
const psramOverview = ref<MemoryUsageOverview | null>(null);
const isLoading = ref(true);
const reclaimableBytes = ref(0);
const flashSizeSummary = computed(() => {
  const size = espInfo.value?.flash_chip_size;
  if (size === undefined || size === null) {
    return "Unknown";
  }
  const formatted = formatBytes(size);
  const bytesLabel = size.toLocaleString();
  return `${formatted} • ${bytesLabel} bytes`;
});
const partitionTutorialUrl = "https://youtu.be/EuHxodrye6E";
const partitionBuilderUrl = computed(() =>
  buildPartitionBuilderUrl(espPartitions.value, espInfo.value?.flash_chip_size)
);

const partitionColorOverrides: Record<string, string> = {
  factory: "#f8b26a",
  ota_0: "#7cc576",
  ota_1: "#58a55b",
  ota_2: "#499550",
  ota: "#8d6be6",
  otadata: "#8d6be6",
  nvs: "#4dd0e1",
  fat: "#7986cb",
  ffat: "#7986cb",
  spiffs: "#64b5f6",
  littlefs: "#81d4fa",
  coredump: "#ef9a9a",
  phy: "#aed581",
  phy_init: "#aed581",
  test: "#f48fb1"
};

const partitionTypeColors: Record<number, string> = {
  0x00: "#4caf50",
  0x01: "#2196f3"
};

const partitionPalette: string[] = [
  "#ffadad",
  "#ffd6a5",
  "#fdffb6",
  "#caffbf",
  "#9bf6ff",
  "#a0c4ff",
  "#bdb2ff",
  "#ffc6ff"
];
const FREE_SEGMENT_BACKGROUND =
  "repeating-linear-gradient(135deg, rgba(248, 113, 113, 0.88) 0px, rgba(248, 113, 113, 0.88) 10px, rgba(220, 38, 38, 0.92) 10px, rgba(220, 38, 38, 0.92) 20px)";

const MIN_RECLAIMABLE_BYTES = 64 * 1024; // 64 KiB
const MIN_RECLAIMABLE_PERCENT = 1; // 1% of total flash
const MIN_STACK_LABEL_PERCENT = 1; // 1% height visibly fits text
const MIN_STACK_LABEL_BYTES = 8 * 1024; // 8 KiB minimum as textual anchor

function resolvePartitionColor(partition: ESPPartition, index: number): string {
  const normalizedLabel = partition.label.trim().toLowerCase();

  const overrideColor = partitionColorOverrides[normalizedLabel];
  if (overrideColor) {
    return overrideColor;
  }

  const otaMatch = normalizedLabel.match(/^ota_(\d+)$/);
  if (otaMatch) {
    const key = `ota_${otaMatch[1]}`;
    const otaOverride = partitionColorOverrides[key];
    if (otaOverride) {
      return otaOverride;
    }
  }

  if (normalizedLabel === "ota data" || normalizedLabel === "ota-data") {
    return partitionColorOverrides["ota"] ?? "#8d6be6";
  }

  const partitionType = (partition as { type?: number }).type;
  if (typeof partitionType === "number") {
    const typeColor = partitionTypeColors[partitionType];
    if (typeColor) {
      return typeColor;
    }
  }

  const usageKind = resolvePartitionUsageKind(partition);
  if (usageKind === "App") {
    return partitionTypeColors[0x00] ?? "#4caf50";
  }
  if (usageKind === "Data") {
    return partitionTypeColors[0x01] ?? "#2196f3";
  }

  const paletteLength = partitionPalette.length;
  if (paletteLength === 0) {
    return "#4caf50";
  }
  return partitionPalette[index % paletteLength] ?? partitionPalette[0] ?? "#ffadad";
}

function hexToRgb(color: string): [number, number, number] | null {
  const normalized = color.replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }
  const bigint = parseInt(normalized, 16);
  if (Number.isNaN(bigint)) {
    return null;
  }
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function adjustColor(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  const mapped = rgb.map((component) =>
    clamp(Math.round(component + component * amount), 0, 255)
  ) as [number, number, number];
  const [r, g, b] = mapped;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function createGradient(color: string): string {
  const lighter = adjustColor(color, 0.18);
  const darker = adjustColor(color, -0.12);
  return `linear-gradient(180deg, ${lighter}, ${darker})`;
}

function getTextColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "#ffffff";
  }
  const mapped = rgb.map((component) => component / 255) as [number, number, number];
  const [r, g, b] = mapped;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#1f2933" : "#ffffff";
}

function resolvePartitionUsageKind(partition: ESPPartition): "App" | "Data" | "Unknown" {
  const partitionType = (partition as { type?: number }).type;
  if (typeof partitionType === "number") {
    if (partitionType === 0x00) {
      return "App";
    }
    if (partitionType === 0x01) {
      return "Data";
    }
  }

  const normalized = partition.label.toLowerCase();

  const dataKeywords = ["nvs", "data", "spiffs", "ffat", "storage", "phy", "fs", "eeprom", "littlefs"];
  if (dataKeywords.some((keyword) => normalized.includes(keyword))) {
    return "Data";
  }

  if (
    normalized === "factory" ||
    /^ota[_\d]*$/i.test(partition.label) ||
    normalized.startsWith("app")
  ) {
    return "App";
  }

  if (partition.subtype >= 0x10 && partition.subtype <= 0x33) {
    return "App";
  }

  return "Unknown";
}

function shouldShowStackLabel(segment: FlashStackSegment): boolean {
  if (segment.usageKind === "Unused") {
    return true;
  }
  if (segment.percent >= MIN_STACK_LABEL_PERCENT) {
    return true;
  }
  if (segment.bytes >= MIN_STACK_LABEL_BYTES) {
    return true;
  }
  if (flashStackSegments.value.length <= 4) {
    return true;
  }
  return false;
}

function segmentTypeLabel(segment: FlashStackSegment): string | null {
  if (segment.usageKind === "Unknown" || segment.usageKind === "Unused") {
    return null;
  }
  return segment.usageKind;
}

function formatSegmentTooltip(segment: FlashStackSegment): string {
  const typeSuffix = segment.usageKind === "Unknown" ? "" : ` (${segment.usageKind})`;
  return `${segment.label}${typeSuffix}: ${segment.percent}% - ${formatBytes(segment.bytes)}`;
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
  let fsPartition: ESPPartition | undefined;

  const stackSegments: FlashStackSegment[] = [];
  let colorIndex = 0;
  let previousEnd: number | null = null;

  partitions.forEach((partition, index) => {
    const normalizedLabel = partition.label.toLowerCase();
    if (normalizedLabel === spiffs || normalizedLabel === ffat) {
      if (!fsPartition) {
        fsPartition = partition;
      }
    }

    const parsedStart = parseInt(partition.address, 16);
    const startAddress = Number.isNaN(parsedStart) ? previousEnd ?? 0 : parsedStart;

    if (
      previousEnd !== null &&
      flashCapacity &&
      startAddress > previousEnd
    ) {
      const gapBytes = startAddress - previousEnd;
      if (gapBytes > 0) {
        const gapPercent = Math.max(0, Math.round((gapBytes / flashCapacity) * 1000) / 10);
        stackSegments.push({
          id: `free-gap-${index}`,
          label: "Free",
          percent: gapPercent,
          bytes: gapBytes,
          background: FREE_SEGMENT_BACKGROUND,
          textColor: "#ffffff",
          usageKind: "Unused"
        });
      }
    }

    const percent = flashCapacity
      ? Math.max(0, Math.round((partition.size / flashCapacity) * 1000) / 10)
      : 0;

    const baseColor = resolvePartitionColor(partition, colorIndex);
    stackSegments.push({
      id: `partition-${index}`,
      label: partition.label,
      percent,
      bytes: partition.size,
      background: createGradient(baseColor),
      textColor: getTextColor(baseColor),
      usageKind: resolvePartitionUsageKind(partition)
    });
    colorIndex += 1;
    previousEnd = startAddress + partition.size;
  });

  if (flashCapacity && previousEnd !== null && flashCapacity > previousEnd) {
    const freeBytes = flashCapacity - previousEnd;
    const freePercent = Math.max(0, Math.round((freeBytes / flashCapacity) * 1000) / 10);
    stackSegments.push({
      id: "free",
      label: "Unused",
      percent: freePercent,
      bytes: freeBytes,
      background: FREE_SEGMENT_BACKGROUND,
      textColor: "#ffffff",
      usageKind: "Unused"
    });
  }

  const totalFreeBytes = stackSegments
    .filter((segment) => segment.id.startsWith("free"))
    .reduce((sum, segment) => sum + segment.bytes, 0);

  flashStackSegments.value = stackSegments;
  reclaimableBytes.value = totalFreeBytes;

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

const hasReclaimableFlash = computed(() => {
  if (!espInfo.value || reclaimableBytes.value <= 0) {
    return false;
  }

  const flashSize = espInfo.value.flash_chip_size ?? 0;
  const percent = flashSize > 0 ? (reclaimableBytes.value / flashSize) * 100 : 0;

  const exceedsByteThreshold = reclaimableBytes.value >= MIN_RECLAIMABLE_BYTES;
  const exceedsPercentThreshold = percent >= MIN_RECLAIMABLE_PERCENT;

  const hasFreeSegment = flashStackSegments.value.some(
    (segment) => segment.id.startsWith("free") && segment.bytes > 0
  );

  return hasFreeSegment && (exceedsByteThreshold || exceedsPercentThreshold);
});

const reclaimableFlashSummary = computed(() => {
  if (reclaimableBytes.value <= 0) {
    return "";
  }
  const formatted = formatBytes(reclaimableBytes.value);
  const bytesLabel = reclaimableBytes.value.toLocaleString();
  return `${formatted} (${bytesLabel} bytes)`;
});

onMounted(async () => {
  try {
    const [espInfoData, espPartitionData] = await Promise.all([fetchESPInformation(), fetchESPPartition()]);

    if (espInfoData && espPartitionData) {
      espInfo.value = espInfoData;
      espPartitions.value = espPartitionData;
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
    <div
      class="memory-grid"
      :class="{ 'memory-grid--two-column': heapOverview || psramOverview }"
    >
      <section
        class="memory-pane memory-pane--flash-stack"
        :style="{ '--entry-index': 0 }"
      >
        <header class="pane-header">
          <h2>Flash Stack Map</h2>
        </header>
        <div class="flash-total-highlight">
          <span class="flash-total-label">Flash Size</span>
          <span class="flash-total-value">{{ flashSizeSummary }}</span>
        </div>
        <p class="stacked-description">Relative share of flash by partition table entries</p>

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
            Unused flash detected - about <span class="reclaim-highlight">{{ reclaimableFlashSummary }}</span> is reclaimable.
            <br />
            See the
            <a :href="partitionTutorialUrl" target="_blank" rel="noopener" class="reclaim-link">partition tutorial</a>
            or try the
            <a :href="partitionBuilderUrl" target="_blank" rel="noopener" class="reclaim-link">ESP32 partition builder</a>.
          </span>
        </v-alert>

        <template v-if="flashStackSegments.length">
          <div class="stacked-column-wrapper">
            <div class="stacked-column">
              <v-tooltip
                v-for="(segment, segmentIndex) in stackedColumnSegments"
                :key="segment.id"
                :text="formatSegmentTooltip(segment)"
                location="right"
              >
                <template #activator="{ props }">
                  <div
                    :class="['stacked-column__segment', { 'stacked-column__segment--free': segment.usageKind === 'Unused' }]"
                    v-bind="props"
                    :style="[
                      {
                        height: segment.percent + '%',
                        background: segment.background,
                        color: segment.textColor,
                        '--segment-index': segmentIndex
                      },
                      segment.percent < 6 ? { minHeight: '28px' } : {}
                    ]"
                  >
                    <span v-if="shouldShowStackLabel(segment)" class="stacked-column__label">{{ segment.label }}</span>
                  </div>
                </template>
              </v-tooltip>
            </div>

            <ul class="stacked-legend">
              <li v-for="segment in flashStackSegments" :key="`${segment.id}-legend`">
                <span class="stacked-legend__color" :style="{ background: segment.background }"></span>
                <span class="stacked-legend__text">
                  {{ segment.label }}
                  <span v-if="segmentTypeLabel(segment)" class="stacked-legend__type">{{ segmentTypeLabel(segment) }}</span>
                </span>
                <span class="stacked-legend__value">{{ segment.percent }}% - {{ formatBytes(segment.bytes) }}</span>
              </li>
            </ul>
          </div>

        </template>
        <div v-else class="empty-state">
          Flash usage data unavailable.
        </div>
      </section>

      <div v-if="heapOverview || psramOverview" class="memory-right-column">
        <section
          v-if="heapOverview"
          class="memory-pane memory-pane--heap"
          :style="{ '--entry-index': 1 }"
        >
          <header class="pane-header">
            <h2>Heap Usage</h2>
            <span class="pane-meta">Total {{ formatBytes(heapOverview.totalBytes) }}</span>
          </header>

          <div class="usage-block">
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

        <section
          v-if="psramOverview"
          class="memory-pane memory-pane--psram"
          :style="{ '--entry-index': heapOverview ? 2 : 1 }"
        >
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
  color: rgb(var(--v-theme-on-background));
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
  .memory-grid--two-column {
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
    grid-template-areas: "flash-stack right-column";
    align-items: start;
  }

  .memory-grid--two-column .memory-right-column {
    grid-area: right-column;
    align-self: start;
  }

  .memory-grid--two-column .memory-pane--flash-stack {
    grid-area: flash-stack;
  }
}

@media (min-width: 1280px) {
  .memory-grid--two-column {
    grid-template-columns: 1.75fr 1fr;
  }

  .memory-right-column {
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

}

.memory-pane {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 9%, transparent);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0;
  animation: memory-card-enter 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--entry-index) * 70ms);
}

@keyframes memory-card-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  color: rgb(var(--v-theme-on-surface));
}

.pane-meta {
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 64%, transparent);
  font-size: 0.85rem;
}

.flash-total-highlight {
  margin: 0.35rem 0 0.85rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, rgb(var(--v-theme-primary)) 10%, rgb(var(--v-theme-surface))),
    color-mix(in srgb, rgb(var(--v-theme-success)) 8%, rgb(var(--v-theme-surface)))
  );
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-primary)) 18%, transparent);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: baseline;
}

.flash-total-label {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 78%, transparent);
}

.flash-total-value {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  font-variant-numeric: tabular-nums;
}

.stacked-description {
  margin: 0;
  font-size: 0.86rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
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
  flex: 0 0 auto;
  width: 100%;
  min-height: 340px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
  background: color-mix(in srgb, rgb(var(--v-theme-background)) 62%, rgb(var(--v-theme-surface)));
  transform-origin: bottom;
  animation: stack-map-enter 0.58s cubic-bezier(0.2, 0.8, 0.2, 1) 180ms both;
}

@keyframes stack-map-enter {
  from {
    opacity: 0;
    transform: scaleY(0.08);
  }

  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

@media (max-width: 600px) {
  .stacked-column {
    min-height: 420px;
  }
}

@media (min-width: 1024px) {
  .stacked-column {
    flex: 0 0 120px;
    width: 120px;
    height: clamp(420px, calc(100dvh - 340px), 620px);
    min-height: 0;
  }
}

.stacked-column__segment {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.25rem;
  text-align: center;
  opacity: 0;
  animation: stack-segment-enter 0.3s ease-out both;
  animation-delay: calc(420ms + (var(--segment-index) * 35ms));
}

@keyframes stack-segment-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.stacked-column__segment--free {
  box-shadow: inset 0 0 0 1px rgba(185, 28, 28, 0.35);
  color: #ffffff;
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
  color: rgb(var(--v-theme-on-surface));
}

.stacked-legend__color {
  width: 18px;
  height: 18px;
  display: inline-block;
  border-radius: 5px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
  flex-shrink: 0;
}

.stacked-legend__text {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.stacked-legend__type {
  margin-left: 0.4rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 64%, transparent);
  font-weight: 600;
}

.stacked-legend__value {
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 78%, transparent);
  justify-self: end;
}

.reclaim-hint {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #f59e0b 18%, rgb(var(--v-theme-surface))),
    color-mix(in srgb, #facc15 14%, rgb(var(--v-theme-surface)))
  ) !important;
  border-left-width: 6px !important;
  border-color: #f59e0b !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.reclaim-hint :deep(.v-alert__prepend) {
  color: #f59e0b;
}

.reclaim-hint--inline {
  margin-bottom: 0.85rem;
}

.reclaim-highlight {
  font-weight: 700;
  color: color-mix(in srgb, #f59e0b 82%, rgb(var(--v-theme-on-surface)));
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
  color: color-mix(in srgb, rgb(var(--v-theme-info)) 78%, rgb(var(--v-theme-on-surface)));
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.reclaim-link:hover {
  text-decoration: none;
}

.usage-footer {
  font-size: 0.85rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
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
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, transparent);
  border-radius: 8px;
  font-size: 0.9rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .memory-pane,
  .stacked-column,
  .stacked-column__segment {
    opacity: 1;
    animation: none;
    transform: none;
  }
}
</style>
