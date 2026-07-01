<script setup lang="ts">
import arduinoMakerWorkshopThumbnail from '@/assets/tool-thumbnails/arduino-maker-workshop.jpg';
import espConnectThumbnail from '@/assets/tool-thumbnails/espconnect.jpg';
import gpioViewerThumbnail from '@/assets/tool-thumbnails/gpio-viewer.jpg';
import partitionBuilderThumbnail from '@/assets/tool-thumbnails/partition-builder.jpg';
import videoConversionThumbnail from '@/assets/tool-thumbnails/video-conversion.jpg';

interface ToolItem {
  key: string;
  title: string;
  icon: string;
  thumbnail: string;
  url: string;
  description: string;
  actionLabel?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  tutorialUrl?: string;
}

const coffeeUrl = 'https://buymeacoffee.com/thelastoutpostworkshop';

const toolItems: ToolItem[] = [
  {
    key: 'espconnect',
    title: 'ESPConnect',
    icon: 'mdi-connection',
    thumbnail: espConnectThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/ESPConnect/',
    description:
      'A browser utility for ESP devices. Inspect hardware details, manage filesystem content, back up flash, and deploy firmware from a Chromium browser.',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/ESPConnect',
    sourceLabel: 'thelastoutpostworkshop/ESPConnect',
    tutorialUrl: 'https://www.youtube.com/watch?v=-nhDKzBxHiI'
  },
  {
    key: 'partition-builder',
    title: 'ESP32 Partition Builder',
    icon: 'mdi-table-cog',
    thumbnail: partitionBuilderThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/ESP32PartitionBuilder/',
    description:
      'Plan and create custom ESP32 partition layouts, including flash-size-aware partition tables for embedded projects.',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/ESP32PartitionBuilder',
    sourceLabel: 'thelastoutpostworkshop/ESP32PartitionBuilder',
    tutorialUrl: 'https://www.youtube.com/watch?v=EuHxodrye6E'
  },
  {
    key: 'video-conversion',
    title: 'Video Conversion Studio',
    icon: 'mdi-movie-cog-outline',
    thumbnail: videoConversionThumbnail,
    url: 'https://thelastoutpostworkshop.github.io/video_conversion/',
    description:
      'Convert video and audio assets into output suitable for ESP32 display projects and embedded media experiments.',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/video_conversion',
    sourceLabel: 'thelastoutpostworkshop/video_conversion',
    tutorialUrl: 'https://www.youtube.com/watch?v=bFq05qXqin0'
  },
  {
    key: 'gpio-viewer',
    title: 'GPIOViewer',
    icon: 'mdi-chip',
    thumbnail: gpioViewerThumbnail,
    url: 'https://www.youtube.com/watch?v=JJzRXcQrl3I',
    description:
      'Visualize GPIO pin activity in real time from a web browser so wiring, signal changes, and board behavior are easier to troubleshoot.',
    actionLabel: 'Watch tutorial',
    sourceUrl: 'https://github.com/thelastoutpostworkshop/gpio_viewer',
    sourceLabel: 'thelastoutpostworkshop/gpio_viewer'
  },
  {
    key: 'arduino-maker-workshop',
    title: 'Arduino Maker Workshop',
    icon: 'mdi-microsoft-visual-studio-code',
    thumbnail: arduinoMakerWorkshopThumbnail,
    url: 'https://marketplace.visualstudio.com/items?itemName=TheLastOutpostWorkshop.arduino-maker-workshop',
    description:
      'A VS Code extension for Arduino-centered maker development, focused on a tighter workflow for sketch-driven embedded projects.',
    sourceLabel: 'VS Code Marketplace extension',
    tutorialUrl: 'https://www.youtube.com/watch?v=rduTUUVkzqM'
  }
];

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener');
}

function getThumbnailActionUrl(tool: ToolItem): string {
  return tool.tutorialUrl ?? tool.url;
}
</script>

<template>
  <v-container class="tools-page" fluid>
    <section class="tools-hero">
      <div>
        <div class="tools-hero__eyebrow">Resources</div>
        <h1>Maker Tools</h1>
        <p>
          Utilities from The Last Outpost Workshop for ESP32 and embedded projects.
        </p>
      </div>
      <v-btn color="warning" variant="tonal" prepend-icon="mdi-coffee-outline" @click="openExternal(coffeeUrl)">
        Buy Me a Coffee
      </v-btn>
    </section>

    <div class="tools-grid">
      <v-card
        v-for="(tool, index) in toolItems"
        :key="tool.key"
        class="tool-card"
        elevation="8"
        :style="{ '--entry-index': index }"
      >
        <v-card-text class="tool-card__body">
          <button
            class="tool-card__thumbnail"
            type="button"
            :aria-label="`Open ${tool.title}`"
            @click="openExternal(getThumbnailActionUrl(tool))"
          >
            <img :src="tool.thumbnail" :alt="`${tool.title} preview`" loading="lazy" />
            <span class="tool-card__thumbnail-icon" aria-hidden="true">
              <v-icon :icon="tool.icon" size="18" />
            </span>
            <span class="tool-card__play-badge" aria-hidden="true">
              <v-icon icon="mdi-play" size="24" />
            </span>
          </button>
          <div class="tool-card__copy">
            <h2>{{ tool.title }}</h2>
            <p>{{ tool.description }}</p>
            <button
              v-if="tool.sourceUrl"
              class="tool-card__source"
              type="button"
              @click="openExternal(tool.sourceUrl)"
            >
              {{ tool.sourceLabel }}
            </button>
            <div v-else class="tool-card__source-label">
              {{ tool.sourceLabel }}
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-btn
            v-if="tool.tutorialUrl"
            color="primary"
            variant="text"
            prepend-icon="mdi-youtube"
            @click="openExternal(tool.tutorialUrl)"
          >
            Watch tutorial
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-open-in-new" @click="openExternal(tool.url)">
            {{ tool.actionLabel ?? 'Open tool' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem clamp(1rem, 3vw, 2.5rem) 2.5rem;
  color: rgb(var(--v-theme-on-background));
}

.tools-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 12px;
  padding: 1.25rem 1.35rem;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 4px 18px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 10%, transparent);
}

.tools-hero__eyebrow {
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 64%, transparent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tools-hero h1 {
  margin: 0.25rem 0 0;
  font-size: 1.45rem;
  line-height: 1.2;
}

.tools-hero p {
  margin: 0.45rem 0 0;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 72%, transparent);
  line-height: 1.5;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  opacity: 0;
  animation: tool-card-enter 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--entry-index) * 55ms);
}

.tool-card__body {
  display: grid;
  flex: 1 1 auto;
  grid-template-columns: minmax(150px, 190px) minmax(0, 1fr);
  gap: 1rem;
}

.tool-card__thumbnail {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  padding: 0;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 15%, transparent);
  border-radius: 10px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, transparent),
      color-mix(in srgb, rgb(var(--v-theme-info)) 10%, transparent)
    ),
    rgb(var(--v-theme-surface));
  color: #ffffff;
  cursor: pointer;
}

.tool-card__thumbnail img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.tool-card__thumbnail::after {
  position: absolute;
  inset: 0;
  content: "";
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.34)),
    linear-gradient(90deg, rgba(15, 23, 42, 0.38), transparent 52%);
}

.tool-card__thumbnail:hover img {
  filter: saturate(1.08) contrast(1.03);
  transform: scale(1.025);
}

.tool-card__thumbnail:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}

.tool-card__thumbnail-icon,
.tool-card__play-badge {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 24px rgba(3, 13, 10, 0.22);
}

.tool-card__thumbnail-icon {
  top: 0.5rem;
  left: 0.5rem;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.64);
  backdrop-filter: blur(6px);
}

.tool-card__play-badge {
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 88%, #000000 12%);
  transform: translate(-50%, -50%);
}

.tool-card__copy h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 750;
}

.tool-card__copy p {
  margin: 0.5rem 0 0.65rem;
  color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 72%, transparent);
  line-height: 1.5;
}

.tool-card__source,
.tool-card__source-label {
  color: rgb(var(--v-theme-info));
  font: inherit;
  font-size: 0.86rem;
}

.tool-card__source {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  text-align: left;
}

.tool-card__source:hover {
  text-decoration: underline;
}

@keyframes tool-card-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 860px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .tools-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .tools-page {
    padding-inline: 0.75rem;
  }

  .tool-card__body {
    grid-template-columns: 1fr;
  }

  .tool-card__thumbnail {
    max-width: 420px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tool-card {
    opacity: 1;
    animation: none;
  }
}
</style>
