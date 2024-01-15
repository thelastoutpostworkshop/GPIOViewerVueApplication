  
<script setup lang="ts">
import type { BoardData, PinsDefinition } from '@/types/types';
import { ref, watch } from 'vue';

const props = defineProps({
    board: Object as () => BoardData | null
});
const colors: string[] = ["#00ff00",
    "#1fff00",
    "#3eff00",
    "#5dff00",
    "#7cff00",
    "#9bff00",
    "#baff00",
    "#d9ff00",
    "#f8ff00",
    "#ffff00", // Yellow
    "#ffef00",
    "#ffdf00",
    "#ffcf00",
    "#ffbf00",
    "#ffaf00",
    "#ff9f00",
    "#ff8f00",
    "#ff7f00",
    "#FE5454",
    "#ff0000", // Red
];
const pinsDefinition = ref<PinsDefinition[] | undefined>();
async function loadIndicators(): Promise<PinsDefinition[] | undefined> {
    try {
        if (props.board) {
            const response = await fetch(props.board.pins);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json() as PinsDefinition[];
        }
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}


// Watch for changes in the board prop and call loadIndicators
watch(() => props.board, async (newBoard, oldBoard) => {
    if (newBoard && newBoard !== oldBoard) {
        pinsDefinition.value = await loadIndicators();
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount
</script>
  
<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image" />
        <div v-if="pinsDefinition" v-for="pin in pinsDefinition.pins" :key="pin.gpioid" class="indicator"
            :style="{ top: pin.top + '%', left: pin.left + '%', width: pinsDefinition.settings.pinWidth + '%', height: pinsDefinition.settings.pinHeight + '%' }"
            :id="`gpio${pin.gpioid}`">
        </div>
    </div>
</template>
<style scoped>
.board-image {
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
    position: relative;
    /* Relative positioning for the container */
}
</style>
  