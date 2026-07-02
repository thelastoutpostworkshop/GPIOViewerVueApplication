<script setup lang="ts">
import BoardImage from '@/components/BoardImage.vue';
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();
</script>

<template>
    <section class="board-view">
        <BoardImage :board="store.currentBoard"></BoardImage>
    </section>
</template>

<style scoped>
.board-view {
    --board-view-base: rgb(var(--v-theme-background));
    --board-view-dot: color-mix(in srgb, rgb(var(--v-theme-on-background)) 24%, rgb(var(--v-theme-background)) 76%);
    --board-view-dot-soft: color-mix(in srgb, rgb(var(--v-theme-info)) 34%, rgb(var(--v-theme-background)) 66%);
    --board-view-glow: color-mix(in srgb, rgb(var(--v-theme-info)) 8%, transparent);
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    min-height: calc(100vh - 104px);
    padding: clamp(12px, 2.2vh, 26px) clamp(8px, 2vw, 28px) clamp(78px, 10vh, 112px);
    overflow: hidden;
    background:
        radial-gradient(circle, var(--board-view-dot) 0 1.6px, transparent 2.1px) center / 18px 18px,
        radial-gradient(circle, var(--board-view-dot-soft) 0 1.25px, transparent 1.9px) 9px 9px / 72px 72px,
        radial-gradient(circle at 50% 18%, var(--board-view-glow), transparent 34%),
        linear-gradient(135deg, color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-info)) 8%), var(--board-view-base) 58%, color-mix(in srgb, var(--board-view-base) 92%, rgb(var(--v-theme-info)) 8%));
}

.board-view::before,
.board-view::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.board-view::before {
    z-index: 0;
    background:
        linear-gradient(90deg, color-mix(in srgb, rgb(var(--v-theme-background)) 22%, transparent), transparent 16%, transparent 84%, color-mix(in srgb, rgb(var(--v-theme-background)) 22%, transparent)),
        linear-gradient(180deg, color-mix(in srgb, rgb(var(--v-theme-surface)) 20%, transparent), transparent 22%, transparent 82%, color-mix(in srgb, rgb(var(--v-theme-background)) 18%, transparent));
    opacity: 0.7;
}

.board-view::after {
    z-index: 0;
    background: transparent;
}

:global(.v-theme--GPIOViewerThemeDark .board-view) {
    --board-view-dot: color-mix(in srgb, rgb(var(--v-theme-on-background)) 22%, rgb(var(--v-theme-background)) 78%);
    --board-view-dot-soft: color-mix(in srgb, rgb(var(--v-theme-info)) 38%, rgb(var(--v-theme-background)) 62%);
    --board-view-glow: color-mix(in srgb, rgb(var(--v-theme-info)) 10%, transparent);
    background:
        radial-gradient(circle, var(--board-view-dot) 0 1.6px, transparent 2.1px) center / 18px 18px,
        radial-gradient(circle, var(--board-view-dot-soft) 0 1.25px, transparent 1.9px) 9px 9px / 72px 72px,
        radial-gradient(circle at 50% 18%, var(--board-view-glow), transparent 36%),
        linear-gradient(135deg, color-mix(in srgb, rgb(var(--v-theme-background)) 86%, rgb(var(--v-theme-info)) 14%), rgb(var(--v-theme-background)) 58%, color-mix(in srgb, rgb(var(--v-theme-background)) 88%, rgb(var(--v-theme-surface)) 12%));
}

:global(.v-theme--GPIOViewerThemeDark .board-view::before) {
    opacity: 0.62;
}

:global(.v-theme--GPIOViewerThemeDark .board-view::after) {
    opacity: 0;
}

.board-view > :deep(*) {
    position: relative;
    z-index: 1;
}

@media (max-width: 600px) {
    .board-view {
        min-height: calc(100vh - 96px);
        padding-inline: 6px;
    }
}
</style>
