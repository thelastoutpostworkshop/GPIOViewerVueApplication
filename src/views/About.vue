<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore';

const store = gpioStore();

interface AboutAction {
  icon: string;
  title: string;
  summary: string;
  url: string;
  color: string;
  buttonLabel: string;
  chip: string;
}

const actions: AboutAction[] = [
  {
    icon: 'mdi-forum-outline',
    title: 'Join the Community',
    summary:
      'Share build logs, ask questions, and discover how other makers extend GPIOViewer in the wild.',
    url: 'https://github.com/thelastoutpostworkshop/gpio_viewer/discussions',
    color: 'primary',
    buttonLabel: 'Open GitHub discussions',
    chip: 'Community'
  },
  {
    icon: 'mdi-alert-circle-outline',
    title: 'Report or Request',
    summary:
      'Found a bug, need a new board profile, or want to track an enhancement? Let us know directly.',
    url: 'https://github.com/thelastoutpostworkshop/gpio_viewer/issues',
    color: 'error',
    buttonLabel: 'View issue tracker',
    chip: 'Feedback'
  },
  {
    icon: 'mdi-coffee-outline',
    title: 'Support the Project',
    summary:
      'If GPIOViewer saves you time, fuel future releases with a coffee and keep these dashboards evolving.',
    url: 'https://www.buymeacoffee.com/thelastoutpostworkshop',
    color: 'amber-darken-2',
    buttonLabel: 'Buy Mila a coffee',
    chip: 'Support'
  }
];

const highlights = [
  'Visualize GPIO pin states and transitions instantly from any browser.',
  'Inspect flash, heap, and PSRAM usage without reflashing your ESP32.',
  'Optimized dashboards tuned for the lab bench, production line, and field service calls.'
];

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener');
}
</script>

<template>
  <v-container class="about-page" fluid>
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="about-hero" elevation="12">
          <div class="about-hero__badge">Open Source | ESP32</div>
          <h1 class="about-hero__title">GPIOViewer for ESP32</h1>
          <p class="about-hero__subtitle">
            Troubleshoot microcontrollers faster with live pin telemetry, memory dashboards, and a workflow designed for the lab and the field.
          </p>
          <ul class="about-hero__highlights">
            <li v-for="point in highlights" :key="point">
              <v-icon icon="mdi-check-circle-outline" size="18" class="mr-2 about-hero__bullet" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <div class="about-hero__meta">
            <div class="about-hero__meta-item">
              <span class="about-hero__meta-label">Firmware release</span>
              <span class="about-hero__meta-value">v{{ store.GPIOViewerRelease }}</span>
            </div>
            <v-divider vertical class="about-hero__divider" />
            <div class="about-hero__meta-item">
              <span class="about-hero__meta-label">Web application</span>
              <span class="about-hero__meta-value">v{{ store.WebApplicationRelease }}</span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="about-actions" justify="center">
      <v-col cols="12" md="4" v-for="action in actions" :key="action.title">
        <v-card class="about-action-card" elevation="8">
          <v-card-item>
            <div class="about-action-card__header">
              <div class="about-action-card__icon" :class="`about-action-card__icon--${action.color}`">
                <v-icon :icon="action.icon" size="30" />
              </div>
              <div>
                <div class="about-action-card__chip">{{ action.chip }}</div>
                <h2 class="about-action-card__title">{{ action.title }}</h2>
              </div>
            </div>
          </v-card-item>
          <v-card-text class="about-action-card__body">
            {{ action.summary }}
          </v-card-text>
          <v-card-actions>
            <v-btn :color="action.color" variant="tonal" block @click="openExternal(action.url)">
              {{ action.buttonLabel }}
              <v-icon icon="mdi-open-in-new" end size="18" />
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <v-card class="about-footer-card" elevation="0" variant="tonal">
          <div class="about-footer-card__content">
            <div>
              <h3 class="about-footer-card__title">Stars & shout-outs keep the project healthy</h3>
              <p class="about-footer-card__subtitle">
                Drop a star on GitHub, share GPIOViewer with your lab mates, or open issues when you spot rough edges.
              </p>
            </div>
            <v-btn
              color="primary"
              variant="flat"
              @click="openExternal('https://github.com/thelastoutpostworkshop/gpio_viewer')"
            >
              Visit the repository
              <v-icon icon="mdi-github" end />
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.about-page {
  padding: 2.5rem 1rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.about-hero {
  padding: 2.25rem 2.5rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(57, 73, 171, 0.1), rgba(92, 107, 192, 0.16));
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
  position: relative;
  overflow: hidden;
}

.about-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(63, 81, 181, 0.12);
  color: #3949ab;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.about-hero__title {
  margin: 1.1rem 0 0.5rem;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2933;
}

.about-hero__subtitle {
  margin: 0;
  color: #475569;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 52ch;
}

.about-hero__highlights {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #27364b;
  font-size: 0.95rem;
}

.about-hero__highlights li {
  display: flex;
  align-items: center;
}

.about-hero__bullet {
  color: #26a69a;
}

.about-hero__meta {
  margin-top: 1.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.about-hero__meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.about-hero__meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #64748b;
  font-weight: 600;
}

.about-hero__meta-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1f2933;
}

.about-hero__divider {
  height: 40px;
  opacity: 0.35;
}

.about-actions {
  gap: 1.5rem 0;
}

.about-action-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  padding-bottom: 0.5rem;
}

.about-action-card__header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.about-action-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
}

.about-action-card__icon--primary {
  background: linear-gradient(135deg, #3949ab, #5c6bc0);
}

.about-action-card__icon--error {
  background: linear-gradient(135deg, #d32f2f, #ef5350);
}

.about-action-card__icon--amber-darken-2 {
  background: linear-gradient(135deg, #ffb300, #ffca28);
  color: #312102;
}

.about-action-card__chip {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 600;
}

.about-action-card__title {
  margin: 0.35rem 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2933;
}

.about-action-card__body {
  flex: 1;
  color: #465464;
  font-size: 0.95rem;
  line-height: 1.55;
}

.about-footer-card {
  border-radius: 20px;
  padding: 1.75rem 2rem;
  background: rgba(57, 73, 171, 0.12);
}

.about-footer-card__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.about-footer-card__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2933;
}

.about-footer-card__subtitle {
  margin: 0.35rem 0 0;
  color: #475569;
}

:deep(.v-theme--dark) .about-page {
  color: #e2e8f0;
}

:deep(.v-theme--dark) .about-hero {
  background: linear-gradient(135deg, rgba(38, 50, 79, 0.85), rgba(56, 78, 128, 0.68));
  box-shadow: 0 24px 48px rgba(7, 12, 23, 0.6);
}

:deep(.v-theme--dark) .about-hero__badge {
  background: rgba(148, 163, 184, 0.18);
  color: #c7d2fe;
}

:deep(.v-theme--dark) .about-hero__title {
  color: #f8fafc;
}

:deep(.v-theme--dark) .about-hero__subtitle {
  color: #d1d9ff;
}

:deep(.v-theme--dark) .about-hero__highlights {
  color: #e2e8f0;
}

:deep(.v-theme--dark) .about-hero__meta-label {
  color: #94a3b8;
}

:deep(.v-theme--dark) .about-hero__meta-value {
  color: #f8fafc;
}

:deep(.v-theme--dark) .about-action-card {
  background: rgba(19, 28, 46, 0.85);
  box-shadow: 0 16px 36px rgba(7, 12, 24, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

:deep(.v-theme--dark) .about-action-card__title,
:deep(.v-theme--dark) .about-action-card__body {
  color: #eceff9;
}

:deep(.v-theme--dark) .about-action-card__chip {
  color: #c7cffb;
}

:deep(.v-theme--dark) .about-footer-card {
  background: rgba(37, 49, 83, 0.7);
  color: #e2e8f0;
}

:deep(.v-theme--dark) .about-footer-card__title {
  color: #f8fafc;
}

:deep(.v-theme--dark) .about-footer-card__subtitle {
  color: #cbd5f5;
}

@media (max-width: 960px) {
  .about-hero {
    padding: 1.75rem 1.85rem;
  }

  .about-hero__title {
    font-size: 1.7rem;
  }

  .about-hero__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.85rem;
  }

  .about-hero__divider {
    display: none;
  }

  .about-footer-card__content {
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .about-page {
    padding: 1.75rem 0.75rem 2.5rem;
  }

  .about-hero__highlights {
    font-size: 0.9rem;
  }
}
</style>
