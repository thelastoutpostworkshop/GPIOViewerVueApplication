  
<script setup lang="ts">
import type { BoardData, PinsConfiguration, PinState, PinStateMap, Pins } from '@/types/types';
import { ref, watch, computed } from 'vue';
import type { ComputedRef } from 'vue';
import { gpioStore } from '@/stores/gpiostore'

const props = defineProps({
    board: Object as () => BoardData | null
});
const store = gpioStore();

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
const pinsConfiguration = ref<PinsConfiguration[] | undefined>();
async function loadIndicators(): Promise<PinsConfiguration[] | undefined> {
    try {
        if (props.board) {
            const response = await fetch(props.board.pins);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json() as PinsConfiguration[];
        }
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}


// Watch for changes in the board prop and call loadIndicators
watch(() => props.board, async (newBoard, oldBoard) => {
    if (newBoard && newBoard !== oldBoard) {
        pinsConfiguration.value = await loadIndicators();
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount

watch(
    () => store.currentStates,
    (newStates) => {
        if (newStates && pinsConfiguration.value) {
            Object.entries(newStates).forEach(([gpioId, pinState]) => {
                const pin = pinsConfiguration.value?.pins.find((position: Pins) => position.gpioid === parseInt(gpioId));
                if (pin) {
                    const pinColor = getColorForPin(pinState); // Assuming getColorForPin takes a PinState object
                    pin.color = pinColor;
                }
            });
        }
    }
);

const getColorForPin = (pinState: PinState): string => {
    const value = Math.max(0, Math.min(pinState.s, 255));
    const index = Math.floor((value / 255) * (colors.length - 1));
    return colors[index];
};

</script>
  
<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image" />
        <div v-if="pinsConfiguration" v-for="pin in pinsConfiguration.pins" :key="pin.gpioid" class="indicator"
            :style="{ top: pin.top + '%', left: pin.left + '%', width: pinsConfiguration.settings.pinWidth + '%', height: pinsConfiguration.settings.pinHeight + '%', backgroundColor: pin.color }"
            :id="`gpio${pin.gpioid}`">
        </div>
        <div v-if="pinsConfiguration" v-for="pin in pinsConfiguration.pins" :key="pin.gpioid"
            :class="pin.valueJustify === -1 ? 'value value_right' : 'value'"
            :style="{ top: pin.top + '%', left: pin.left + '%', height: pinsConfiguration.settings.pinHeight - 0.25 + '%', backgroundColor: pin.color }"
            :id="`gpio${pin.gpioid}`">
        </div>
    </div>
</template>
<style scoped>
.board-image {
    max-width: 80vw;
    max-height: 80vh;
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

.value {
    position: absolute;
    font-size: 1.2vh;
    min-width: 15%;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(6, 23, 175);
    background-color: aqua;
    display: flex;
    align-items: center;
    /* Vertical alignment */
    justify-content: left;
    /* Horizontal alignment */
}

.value_right {
    position: absolute;
    justify-content: right;
    /* Horizontal alignment */
}

.value .value-bar,
.value_right .value-bar {
    position: absolute;
    bottom: 0;
    height: 100%;
    background-color: rgba(0, 0, 255, 0.25);
    transition: width 0.5s ease;
    /* Animate the width change over 0.5 seconds */
}

.value_right .value-bar {
    right: 0;
    /* For right-aligned bars */
}</style>
  