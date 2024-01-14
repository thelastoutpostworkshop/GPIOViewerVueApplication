  
<script setup lang="ts">
import type { BoardData, IndicatorPosition } from '@/types/types';
import { ref, watch } from 'vue';

const props = defineProps({
    board: Object as () => BoardData | null
});
const indicators = ref<IndicatorPosition[] | undefined>();
async function loadIndicators(): Promise<IndicatorPosition[] | undefined> {
    try {
        if (props.board) {
            const response = await fetch(props.board.pins);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json() as IndicatorPosition[];
        }
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}
// Watch for changes in the board prop and call loadIndicators
watch(() => props.board, async (newBoard, oldBoard) => {
    if (newBoard && newBoard !== oldBoard) {
        indicators.value = await loadIndicators();
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount
</script>
  
<template>
    <div v-if="board" class="board-container">
      <img v-if="board.image" :src="board.image" class="board-image" />
      <div v-for="indicator in indicators" :key="indicator.gpioid"
           class="indicator"
           :style="{ top: indicator.top + '%', left: indicator.left + '%' }"
           :id="`gpio${indicator.gpioid}`">
      </div>
    </div>
  </template>
<style scoped>
.image {
    max-width: 80vw;
    max-height: 80vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
}

.indicator {
    position: absolute;
    border-radius: 50%;
    padding: 5px;
    transform: translate(-50%, -50%);
    background-color: gray;
}
.board-container {
  position: relative; /* Relative positioning for the container */
}
</style>
  