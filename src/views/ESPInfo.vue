<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes, formatHz, formatMacAddress, formatTime } from "@/functions";
import type { ESPInfo } from "@/types/types";

interface SummaryCard {
  title: string;
  value: string;
  caption: string;
  icon: string;
  accent: string;
  tint: string;
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

async function fetchESPInformation() {
  isLoading.value = true;
  try {
    const response = await fetch(getAPIUrl("espinfo"));
    const data: ESPInfo = await response.json();
    espInfo.value = data;
  } catch (error) {
    console.error("Error fetching esp information", error);
  } finally {
    isLoading.value = false;
  }
}

function flashMode(mode: number | undefined | null): string {
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
      return "Unknown";
  }
}

const summaryCards = computed<SummaryCard[]>(() => {
  const info = espInfo.value;
  if (!info) {
    return [];
  }

  const heapUsed = Math.max(0, info.heap_size - info.free_heap);
  const psramUsed = Math.max(0, info.psram_size - info.free_psram);

  const cards: SummaryCard[] = [
    {
      title: "Uptime",
      value: formatTime(info.up_time),
      caption: "Since last reset",
      icon: "mdi-clock-outline",
      accent: "#3949ab",
      tint: "rgba(57, 73, 171, 0.12)"
    },
    {
      title: "CPU Frequency",
      value: info.cpu_frequency ? `${info.cpu_frequency} MHz` : "Unknown",
      caption: `${info.cores_count} core${info.cores_count === 1 ? "" : "s"}`,
      icon: "mdi-speedometer",
      accent: "#ef6c00",
      tint: "rgba(239, 108, 0, 0.12)"
    },
    {
      title: "Flash Size",
      value: formatBytes(info.flash_chip_size),
      caption: flashMode(info.flash_mode),
      icon: "mdi-chip",
      accent: "#26a69a",
      tint: "rgba(38, 166, 154, 0.12)"
    },
    {
      title: "Heap Usage",
      value: `${formatBytes(heapUsed)} used`,
      caption: `${formatBytes(info.heap_size)} total`,
      icon: "mdi-memory",
      accent: "#8e24aa",
      tint: "rgba(142, 36, 170, 0.12)"
    }
  ];

  if (info.psram_size > 0) {
    cards.push({
      title: "PSRAM Usage",
      value: `${formatBytes(psramUsed)} used`,
      caption: `${formatBytes(info.psram_size)} total`,
      icon: "mdi-server",
      accent: "#5c6bc0",
      tint: "rgba(92, 107, 192, 0.12)"
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
          value: typeof info.chip_revision === "number" ? `Rev ${info.chip_revision}` : "Unknown"
        },
        {
          label: "CPU Frequency",
          value: info.cpu_frequency ? `${info.cpu_frequency} MHz` : "Unknown"
        },
        {
          label: "Cycle Count",
          value: cycleCount
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
          label: "Free Sketch Space",
          value: formatBytes(info.free_sketch)
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
          label: "Heap Max Block",
          value: formatBytes(info.heap_max_alloc)
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
                value: formatBytes(info.psram_max_alloc)
              }
            ]
          : [])
      ]
    },
    {
      title: "Identifiers",
      icon: "mdi-identifier",
      items: [
        {
          label: "eFuse MAC Address",
          value: formatMacAddress(info.mac)
        }
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
          <v-card
            v-for="card in summaryCards"
            :key="card.title"
            flat
            class="summary-card"
            :style="{ borderColor: card.accent, background: card.tint }"
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
