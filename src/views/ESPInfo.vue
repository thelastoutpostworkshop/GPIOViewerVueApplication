<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes, formatHz, formatMacAddress, formatTime } from "@/functions";
import type { ESPInfo } from "@/types/types";
import { RouterLink } from 'vue-router';

interface SummaryCard {
  title: string;
  value: string;
  caption: string;
  icon: string;
  accent: string;
  routeName?: string;
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
    title: "Flash Size",
    value: formatBytes(info.flash_chip_size),
    caption: flashMode(info.flash_mode),
    icon: "mdi-chip",
    accent: "#26a69a",
    routeName: "memorymap"
  });

  cards.push({
    title: "CPU Frequency",
    value: info.cpu_frequency ? `${info.cpu_frequency} MHz` : "Unknown",
    caption: `${info.cores_count} core${info.cores_count === 1 ? "" : "s"}`,
    icon: "mdi-speedometer",
    accent: "#ef6c00"
  });

  if (info.temperature_c !== null) {
    cards.push({
      title: "Temperature",
      value: formatTemperature(info.temperature_c),
      caption: "Internal sensor",
      icon: "mdi-thermometer",
      accent: "#e53935"
    });
  }

  cards.push({
    title: "MAC Address",
    value: formatMacAddress(info.mac),
    caption: "eFuse identifier",
    icon: "mdi-wifi",
    accent: "#00838f"
  });

  cards.push({
    title: "Heap Usage",
    value: `${formatBytes(heapUsed)} used`,
    caption: `${formatBytes(info.heap_size)} total`,
    icon: "mdi-memory",
    accent: "#8e24aa",
    routeName: "memorymap"
  });

  if (info.psram_size > 0) {
    cards.push({
      title: "PSRAM Usage",
      value: `${formatBytes(psramUsed)} used`,
      caption: `${formatBytes(info.psram_size)} total`,
      icon: "mdi-server",
      accent: "#5c6bc0",
      routeName: "memorymap"
    });
  }

  cards.push({
    title: "Uptime",
    value: formatTime(info.up_time),
    caption: "Since last reset",
    icon: "mdi-clock-outline",
    accent: "#3949ab"
  });

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
    <section class="hero">
      <div class="hero__title">ESP32 Runtime Overview</div>
      <div class="hero__subtitle">
        Live diagnostics for the board running GPIOViewer.
      </div>
    </section>

    <section class="content-grid">
      <div class="content-grid__left">
        <section v-if="summaryCards.length" class="summary-grid">
          <component
            v-for="(card, cardIndex) in summaryCards"
            :key="card.title"
            :is="card.routeName ? RouterLink : 'div'"
            class="summary-card-link"
            :class="{ 'summary-card-link--interactive': Boolean(card.routeName) }"
            :style="{ '--entry-index': cardIndex }"
            v-bind="card.routeName ? { to: { name: card.routeName } } : {}"
          >
            <v-card
              flat
              :class="[
                'summary-card',
                { 'summary-card--interactive': Boolean(card.routeName) }
              ]"
              :style="{
                borderColor: card.accent,
                '--summary-card-accent': card.accent
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
          </component>
        </section>
      </div>

      <div class="content-grid__right">
        <section class="info-sections">
          <article
            v-for="(section, sectionIndex) in infoSections"
            :key="section.title"
            class="info-section"
            :style="{ '--entry-index': summaryCards.length + sectionIndex }"
          >
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
  padding: 1.5rem clamp(1.25rem, 3vw, 2.5rem) 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.hero {
  background: linear-gradient(
    120deg,
    color-mix(in srgb, rgb(var(--v-theme-primary)) 14%, rgb(var(--v-theme-surface))),
    color-mix(in srgb, rgb(var(--v-theme-info)) 12%, rgb(var(--v-theme-surface)))
  );
  border-radius: 16px;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, transparent);
}

.hero__title {
  font-size: 1.3rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.hero__subtitle {
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 72%, transparent);
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

.summary-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  opacity: 0;
  animation: card-enter 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--entry-index) * 55ms);
}

.summary-card-link--interactive {
  outline: none;
}

.summary-card {
  background: color-mix(in srgb, var(--summary-card-accent) 10%, rgb(var(--v-theme-surface)));
  border-radius: 14px;
  border-left: 4px solid;
  padding: 1rem 1.1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 4px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, transparent);
  cursor: default;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
}

.summary-card--interactive {
  cursor: pointer;
}

.summary-card-link--interactive:focus-visible .summary-card {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.55);
  transform: translateY(-1px);
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
  background-color: color-mix(in srgb, var(--summary-card-accent) 12%, rgb(var(--v-theme-surface)));
}

.summary-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.summary-card__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 72%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-card__value {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.summary-card__caption {
  font-size: 0.8rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
}

.info-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.info-section {
  background-color: rgb(var(--v-theme-surface));
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 8px 24px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 10%, transparent);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0;
  animation: card-enter 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--entry-index) * 55ms);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.info-section__header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
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
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 70%, transparent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-list__row dd {
  margin: 0;
  font-size: 0.95rem;
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-list__row dd span {
  overflow-wrap: anywhere;
}

.info-list__row dd small {
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent);
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
  color: rgb(var(--v-theme-on-surface));
}

.error-state__caption {
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 68%, transparent);
  font-size: 0.9rem;
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

@media (prefers-reduced-motion: reduce) {
  .summary-card-link,
  .info-section {
    opacity: 1;
    animation: none;
  }
}
</style>
