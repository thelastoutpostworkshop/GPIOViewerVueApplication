<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes, formatHz, formatMacAddress, formatTime } from "@/functions";
import type { ESPInfo } from "@/types/types";
import { useTheme } from 'vuetify';

interface SummaryCard {
  title: string;
  value: string;
  caption: string;
  icon: string;
  accent: string;
  tintLight: string;
  tintDark: string;
}

interface InfoSectionItem {
  label: string;
  value: string;
  hint?: string;
}

interface InfoSection {
  title: string;
  icon: string;
  items: InfoSectionItem[];
}

const espInfo = ref<ESPInfo>();
const isLoading = ref(true);
const numberFormatter = new Intl.NumberFormat();
const theme = useTheme();
const isDarkTheme = computed(() => theme.global.current.value?.dark ?? false);

function coerceNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function coerceOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function coerceString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function coerceFlashMode(value: unknown): number | string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed;
  }
  return null;
}

function coerceFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((feature) => String(feature));
  }
  return [];
}

function prettifyWord(word: string): string {
  if (!word) {
    return word;
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function prettifyFeature(feature: string): string {
  return feature
    .split(/[_\s]+/)
    .map(prettifyWord)
    .join(" ");
}

function formatChipFeatureList(features: string[]): string {
  if (!features.length) {
    return "Unknown";
  }
  return features.map(prettifyFeature).join(", ");
}

function formatSketchHash(hash: string): string {
  if (!hash) {
    return "Unknown";
  }
  return hash.toUpperCase();
}

async function fetchESPInformation() {
  isLoading.value = true;
  try {
    const response = await fetch(getAPIUrl("espinfo"));
    const raw = await response.json() as Record<string, unknown>;
    const normalized: ESPInfo = {
      chip_model: coerceString(raw.chip_model),
      cores_count: coerceNumber(raw.cores_count),
      chip_revision:
        typeof raw.chip_revision === "number" || typeof raw.chip_revision === "string"
          ? raw.chip_revision
          : "",
      cpu_frequency: coerceNumber(raw.cpu_frequency),
      cycle_count: coerceNumber(raw.cycle_count),
      mac: coerceNumber(raw.mac),
      flash_mode: coerceFlashMode(raw.flash_mode),
      flash_chip_size: coerceNumber(raw.flash_chip_size),
      flash_chip_speed: coerceNumber(raw.flash_chip_speed),
      heap_size: coerceNumber(raw.heap_size),
      heap_max_alloc: coerceNumber(raw.heap_max_alloc),
      psram_size: coerceNumber(raw.psram_size),
      free_psram: coerceNumber(raw.free_psram),
      psram_max_alloc: coerceNumber(raw.psram_max_alloc),
      free_heap: coerceNumber(raw.free_heap),
      heap_free_8bit: coerceNumber(raw.heap_free_8bit),
      heap_free_32bit: coerceNumber(raw.heap_free_32bit),
      heap_largest_free_block: coerceNumber(raw.heap_largest_free_block),
      temperature_c: coerceOptionalNumber(raw.temperature_c),
      up_time: coerceNumber(raw.up_time),
      uptime_us: coerceNumber(raw.uptime_us),
      sketch_size: coerceNumber(raw.sketch_size),
      free_sketch: coerceNumber(raw.free_sketch),
      arduino_core_version: coerceString(raw.arduino_core_version),
      sdk_version: coerceString(raw.sdk_version),
      idf_version: coerceString(raw.idf_version),
      sketch_md5: coerceString(raw.sketch_md5),
      chip_features: coerceFeatures(raw.chip_features),
      reset_reason_code: coerceNumber(raw.reset_reason_code),
      reset_reason: coerceString(raw.reset_reason)
    };
    espInfo.value = normalized;
  } catch (error) {
    console.error("Error fetching esp information", error);
  } finally {
    isLoading.value = false;
  }
}

function flashMode(mode: number | string | undefined | null): string {
  switch (mode) {
    case 0x00:
      return "Quad I/O";
    case 0x01:
      return "Quad Output";
    case 0x02:
      return "Dual I/O";
    case 0x03:
      return "Dual Output";
    case 0x04:
      return "Fast Read";
    case 0x05:
      return "Slow Read";
    default:
      break;
  }

  if (mode === null || mode === undefined) {
    return "Unknown";
  }

  if (typeof mode === "string") {
    const trimmed = mode.trim();
    if (!trimmed) {
      return "Unknown";
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return flashMode(numeric);
    }
    return trimmed
      .split(/[_\s]+/)
      .map(prettifyWord)
      .join(" ");
  }

  if (typeof mode === "number") {
    return `Mode 0x${mode.toString(16)}`;
  }

  return "Unknown";
}

function formatMicroseconds(value: number): string {
  if (value <= 0) {
    return "Unknown";
  }
  return `${numberFormatter.format(value)} µs`;
}

function formatResetReasonHint(code: number): string | undefined {
  if (!code) {
    return undefined;
  }
  return `Code ${code}`;
}

function formatTemperature(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unknown";
  }
  return `${value.toFixed(1)} °C`;
}

function formatChipRevision(revision: number | string | null | undefined): string {
  if (revision === null || revision === undefined) {
    return "Unknown";
  }
  if (typeof revision === "number") {
    return Number.isFinite(revision) ? `Rev ${revision}` : "Unknown";
  }
  const numeric = Number(revision);
  if (!Number.isNaN(numeric)) {
    return `Rev ${numeric}`;
  }
  const trimmed = String(revision).trim();
  return trimmed.length ? trimmed : "Unknown";
}

const summaryCards = computed<SummaryCard[]>(() => {
  const info = espInfo.value;
  if (!info) {
    return [];
  }

  const heapUsed = Math.max(0, info.heap_size - info.free_heap);
  const psramUsed = Math.max(0, info.psram_size - info.free_psram);

  const cards: SummaryCard[] = [];

  cards.push({
    title: "Uptime",
    value: formatTime(info.up_time),
    caption: "Since last reset",
    icon: "mdi-clock-outline",
    accent: "#3949ab",
    tintLight: "rgba(57, 73, 171, 0.12)",
    tintDark: "linear-gradient(135deg, rgba(96, 125, 255, 0.6), rgba(129, 140, 248, 0.55))"
  });

  cards.push({
    title: "CPU Frequency",
    value: info.cpu_frequency ? `${info.cpu_frequency} MHz` : "Unknown",
    caption: `${info.cores_count} core${info.cores_count === 1 ? "" : "s"}`,
    icon: "mdi-speedometer",
    accent: "#ef6c00",
    tintLight: "rgba(239, 108, 0, 0.12)",
    tintDark: "linear-gradient(135deg, rgba(255, 193, 120, 0.7), rgba(255, 214, 153, 0.6))"
  });

  if (info.temperature_c !== null) {
    cards.push({
      title: "Temperature",
      value: formatTemperature(info.temperature_c),
      caption: "Internal sensor",
      icon: "mdi-thermometer",
      accent: "#e53935",
      tintLight: "rgba(229, 57, 53, 0.12)",
      tintDark: "linear-gradient(135deg, rgba(244, 67, 54, 0.7), rgba(255, 138, 101, 0.6))"
    });
  }

  cards.push({
    title: "MAC Address",
    value: formatMacAddress(info.mac),
    caption: "eFuse identifier",
    icon: "mdi-identifier",
    accent: "#00838f",
    tintLight: "rgba(0, 131, 143, 0.12)",
    tintDark: "linear-gradient(135deg, rgba(0, 172, 193, 0.7), rgba(77, 208, 225, 0.55))"
  });

  cards.push({
    title: "Flash Size",
    value: formatBytes(info.flash_chip_size),
    caption: flashMode(info.flash_mode),
    icon: "mdi-chip",
    accent: "#26a69a",
    tintLight: "rgba(38, 166, 154, 0.12)",
    tintDark: "linear-gradient(135deg, rgba(77, 210, 195, 0.65), rgba(128, 222, 234, 0.55))"
  });

  cards.push({
    title: "Heap Usage",
    value: `${formatBytes(heapUsed)} used`,
    caption: `${formatBytes(info.heap_size)} total`,
    icon: "mdi-memory",
    accent: "#8e24aa",
    tintLight: "rgba(142, 36, 170, 0.12)",
    tintDark: "linear-gradient(135deg, rgba(186, 104, 200, 0.65), rgba(224, 176, 255, 0.55))"
  });

  if (info.psram_size > 0) {
    cards.push({
      title: "PSRAM Usage",
      value: `${formatBytes(psramUsed)} used`,
      caption: `${formatBytes(info.psram_size)} total`,
      icon: "mdi-server",
      accent: "#5c6bc0",
      tintLight: "rgba(92, 107, 192, 0.12)",
      tintDark: "linear-gradient(135deg, rgba(153, 162, 255, 0.65), rgba(196, 208, 255, 0.55))"
    });
  }

  return cards;
});

const infoSections = computed<InfoSection[]>(() => {
  const info = espInfo.value;
  if (!info) {
    return [];
  }

  const cycleCount =
    typeof info.cycle_count === "number" ? numberFormatter.format(info.cycle_count) : "Unknown";
  const chipFeaturesValue = formatChipFeatureList(info.chip_features);
  const resetReasonValue = info.reset_reason || "Unknown";
  const resetReasonHint = formatResetReasonHint(info.reset_reason_code);
  const uptimeMicro = formatMicroseconds(info.uptime_us);

  const sections: InfoSection[] = [
    {
      title: "Device Profile",
      icon: "mdi-information-outline",
      items: [
        {
          label: "Espressif Arduino Core",
          value: info.arduino_core_version || "Unknown"
        },
        {
          label: "Chip Model",
          value: info.chip_model || "Unknown"
        },
        {
          label: "Chip Revision",
          value: formatChipRevision(info.chip_revision)
        },
        {
          label: "Temperature",
          value: formatTemperature(info.temperature_c),
          hint: "Internal sensor reading in Celsius."
        },
        {
          label: "eFuse MAC Address",
          value: formatMacAddress(info.mac)
        },
        {
          label: "Chip Features",
          value: chipFeaturesValue,
          hint: chipFeaturesValue === "Unknown" ? undefined : "Capabilities reported by the silicon."
        },
        {
          label: "Reset Reason",
          value: resetReasonValue,
          hint: resetReasonHint
        }
      ]
    },
    {
      title: "Runtime & Timers",
      icon: "mdi-timer-outline",
      items: [
        {
          label: "Uptime",
          value: formatTime(info.up_time),
          hint: "Time since the last device reset."
        },
        {
          label: "Uptime (µs)",
          value: uptimeMicro,
          hint: "Microsecond-resolution uptime from the ESP timer."
        },
        {
          label: "CPU Frequency",
          value: info.cpu_frequency ? `${info.cpu_frequency} MHz` : "Unknown",
          hint: "Reported CPU frequency for active core(s)."
        },
        {
          label: "Cycle Count",
          value: cycleCount,
          hint: "Aggregate CPU cycles consumed since boot."
        }
      ]
    },
    {
      title: "Flash & Sketch",
      icon: "mdi-flash",
      items: [
        {
          label: "Flash Speed",
          value: formatHz(info.flash_chip_speed)
        },
        {
          label: "Flash Mode",
          value: flashMode(info.flash_mode)
        },
        {
          label: "Flash Size",
          value: formatBytes(info.flash_chip_size)
        },
        {
          label: "Sketch Size",
          value: formatBytes(info.sketch_size)
        },
        {
          label: "Free Sketch Space for OTA",
          value: formatBytes(info.free_sketch)
        },
        {
          label: "Sketch MD5",
          value: formatSketchHash(info.sketch_md5),
          hint: "MD5 hash of the uploaded sketch image."
        },
        {
          label: "SDK Version",
          value: info.sdk_version || "Unknown",
          hint: "ESP-IDF SDK tag bundled with Arduino."
        },
        {
          label: "IDF Version",
          value: info.idf_version || "Unknown",
          hint: "Exact ESP-IDF revision compiled into the firmware."
        }
      ]
    },
    {
      title: "Memory",
      icon: "mdi-memory",
      items: [
        {
          label: "Heap Size",
          value: formatBytes(info.heap_size)
        },
        {
          label: "Free Heap",
          value: formatBytes(info.free_heap)
        },
        {
          label: "Free Heap (8-bit)",
          value: formatBytes(info.heap_free_8bit),
          hint: "Total bytes available for general-purpose allocations."
        },
        {
          label: "Free Heap (32-bit)",
          value: formatBytes(info.heap_free_32bit),
          hint: "Heap accessible for 32-bit aligned allocations (fast internal RAM)."
        },
        {
          label: "Largest Heap Block",
          value: formatBytes(info.heap_largest_free_block),
          hint: "Biggest contiguous heap chunk – fragmentation indicator."
        },
        {
          label: "Heap Max Allocation",
          value: formatBytes(info.heap_max_alloc),
          hint: "Largest allocation currently permitted by the heap allocator."
        },
        ...(info.psram_size > 0
          ? [
              {
                label: "PSRAM Size",
                value: formatBytes(info.psram_size)
              },
              {
                label: "Free PSRAM",
                value: formatBytes(info.free_psram)
              },
              {
                label: "PSRAM Max Block",
                value: formatBytes(info.psram_max_alloc),
                hint: "Largest contiguous PSRAM allocation possible right now."
              }
            ]
          : [])
      ]
    }
  ];

  return sections.filter((section) => section.items.length > 0);
});

onMounted(() => {
  fetchESPInformation();
});
</script>

<template>
  <div v-if="!isLoading && espInfo" class="esp-info-dashboard">
    <section :class="['hero', { 'hero--dark': isDarkTheme }]">
      <div class="hero__title">ESP32 Runtime Overview</div>
      <div class="hero__subtitle">
        Live diagnostics for the board running GPIOViewer.
      </div>
    </section>

    <section class="content-grid">
      <div class="content-grid__left">
        <section v-if="summaryCards.length" class="summary-grid">
      <v-card
        v-for="card in summaryCards"
        :key="card.title"
        flat
        :class="['summary-card', { 'summary-card--dark': isDarkTheme }]"
        :style="{
          borderColor: card.accent,
          background: isDarkTheme ? card.tintDark : card.tintLight
        }"
      >
            <div class="summary-card__content">
              <div class="summary-card__icon" :style="{ color: card.accent }">
                <v-icon :icon="card.icon" size="28"></v-icon>
              </div>
              <div class="summary-card__body">
                <div class="summary-card__title">{{ card.title }}</div>
                <div class="summary-card__value">{{ card.value }}</div>
                <div class="summary-card__caption">{{ card.caption }}</div>
              </div>
            </div>
          </v-card>
        </section>
      </div>

      <div class="content-grid__right">
        <section class="info-sections">
          <article v-for="section in infoSections" :key="section.title" class="info-section">
            <header class="info-section__header">
              <v-icon :icon="section.icon" size="22"></v-icon>
              <span>{{ section.title }}</span>
            </header>
            <dl class="info-list">
              <div v-for="item in section.items" :key="`${section.title}-${item.label}`" class="info-list__row">
                <dt>{{ item.label }}</dt>
                <dd>
                  <span>{{ item.value }}</span>
                  <small v-if="item.hint">{{ item.hint }}</small>
                </dd>
              </div>
            </dl>
          </article>
        </section>
      </div>
    </section>
  </div>

  <div v-else-if="isLoading" class="loading-state">
    <v-container>
      <v-progress-circular :size="100" :width="10" color="green" indeterminate></v-progress-circular>
    </v-container>
  </div>

  <div v-else class="error-state">
    <v-container class="text-center">
      <v-icon icon="mdi-alert-circle-outline" size="32" color="orange-darken-2" class="mb-3"></v-icon>
      <div class="error-state__title">No ESP32 information available</div>
      <div class="error-state__caption">The board did not return any diagnostics.</div>
    </v-container>
  </div>
</template>

<style scoped>
.esp-info-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 0 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.hero {
  background: linear-gradient(120deg, rgba(57, 73, 171, 0.12), rgba(92, 107, 192, 0.18));
  border-radius: 16px;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: inset 0 0 0 1px rgba(57, 73, 171, 0.15);
}

.hero--dark {
  background: linear-gradient(135deg, rgba(79, 129, 255, 0.65), rgba(63, 81, 181, 0.45));
  box-shadow: inset 0 0 0 1px rgba(129, 140, 248, 0.55);
}

.hero--dark .hero__title {
  color: #f1f5f9 !important;
}

.hero--dark .hero__subtitle {
  color: #cbd5f5 !important;
}

.hero__title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1f2933;
}

.hero__subtitle {
  color: #4a5568;
  font-size: 0.95rem;
}

.content-grid {
  display: grid;
  gap: 1.5rem;
}

.content-grid__left,
.content-grid__right {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.summary-card {
  border-radius: 14px;
  border-left: 4px solid;
  padding: 1rem 1.1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}

.summary-card__content {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.65);
}

.summary-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary-card__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-card__value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2933;
}

.summary-card__caption {
  font-size: 0.8rem;
  color: #5f6b7a;
}

.summary-card--dark {
  color: #f8fafc;
}

.summary-card--dark .summary-card__title,
.summary-card--dark .summary-card__value {
  color: #ffffff;
}

.summary-card--dark .summary-card__caption {
  color: rgba(255, 255, 255, 0.85);
}

.summary-card--dark .summary-card__icon {
  background-color: rgba(15, 23, 42, 0.35);
}

.info-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.info-section {
  background-color: #f8f9fd;
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-section__header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 600;
  color: #27364b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.info-list__row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 0.75rem;
  align-items: baseline;
}

.info-list__row dt {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-list__row dd {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2933;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-list__row dd span {
  overflow-wrap: anywhere;
}

.info-list__row dd small {
  color: #64748b;
  font-size: 0.75rem;
}

.loading-state,
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40dvh;
}

.error-state__title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1f2933;
}

.error-state__caption {
  color: #5f6b7a;
  font-size: 0.9rem;
}

:deep(.v-theme--dark) .esp-info-dashboard {
  color: #e2e8f0;
}

:deep(.v-theme--dark) .summary-card {
  background: rgba(30, 41, 59, 0.85);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.55);
}

:deep(.v-theme--dark) .summary-card__title {
  color: #ffffff !important;
}

:deep(.v-theme--dark) .summary-card__value {
  color: #f8fafc !important;
}

:deep(.v-theme--dark) .summary-card__caption {
  color: #f8fafc !important;
  opacity: 0.92;
}

:deep(.v-theme--dark) .summary-card__body {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(10, 19, 38, 0.45);
}

:deep(.v-theme--dark) .summary-card__icon {
  background-color: rgba(241, 245, 249, 0.22);
}

:deep(.v-theme--dark) .info-section {
  background-color: rgba(36, 48, 74, 0.78);
  box-shadow: 0 16px 36px rgba(8, 13, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

:deep(.v-theme--dark) .info-section__header {
  color: #e2e8f0 !important;
}

:deep(.v-theme--dark) .info-list__row dt {
  color: #d1d9ff;
}

:deep(.v-theme--dark) .info-list__row dd {
  color: #f9fbff;
}

:deep(.v-theme--dark) .info-list__row dd small {
  color: #c7cffb;
}

:deep(.v-theme--dark) .error-state__title {
  color: #e2e8f0;
}

@media (max-width: 640px) {
  .hero {
    padding: 1.25rem 1.35rem;
  }

  .info-list__row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .info-list__row dt {
    font-size: 0.8rem;
  }

  .info-list__row dd {
    font-size: 0.9rem;
  }
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1.1fr 1.6fr;
    align-items: start;
  }

  .content-grid__left {
    position: sticky;
    top: 1.25rem;
  }
}

@media (min-width: 1280px) {
  .esp-info-dashboard {
    max-width: 1400px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .info-sections {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
