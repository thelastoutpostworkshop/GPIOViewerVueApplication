  
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
const pinsConf = ref<PinsConfiguration[] | undefined>();
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
        pinsConf.value = await loadIndicators();
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount

watch(
    () => store.currentStates,
    (newStates) => {
        if (newStates && pinsConf.value) {
            Object.entries(newStates).forEach(([gpioId, pinState]) => {
                const pin = pinsConf.value?.pins.find((position: Pins) => position.gpioid === parseInt(gpioId));
                if (pin) {
                    pin.color = getColorForPin(pinState);;
                    pin.showValue = getValueForPin(pinState);
                }
            });
        }
    }
);

const getValueForPin = (pinState: PinState): string => {
    var displayValue = "";
    if (pinState.t == 0) {
        //it's a digital pin
        if (pinState.v == 0) {
            displayValue = "LOW";
        } else {
            if (pinState.v == 1) {
                displayValue = "HIGH";
            } else {
                displayValue = pinState.v.toString();
            }
        }
    } else {
        displayValue = pinState.v.toString();
    }
    return displayValue;
};

const getColorForPin = (pinState: PinState): string => {
    const value = Math.max(0, Math.min(pinState.s, 255));
    const index = Math.floor((value / 255) * (colors.length - 1));
    return colors[index];
};

</script>
  
<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image" />
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid" class="indicator"
            :style="{ top: pin.top + '%', left: pin.left + '%', width: pinsConf.settings.pinWidth + '%', height: pinsConf.settings.pinHeight + '%', backgroundColor: pin.color }"
            :id="`gpio${pin.gpioid}`">
        </div>
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid"
            :class="pin.valueJustify === -1 ? 'value value_right' : 'value'" :style="{
                top: pin.top - (pinsConf.settings.pinHeight / 2) + '%',
                left: (pin.valueJustify === -1 ? pin.left - pinsConf.settings.valueMinWidth - pinsConf.settings.valuePinMargin : pin.left + pinsConf.settings.valuePinMargin) + '%',
                height: pinsConf.settings.pinHeight - 0.25 + '%',
                backgroundColor: pinsConf.settings.valueBackGroundColor,
                minWidth: pinsConf.settings.valueMinWidth + '%'
            }" :id="`gpio${pin.gpioid}`">
            <div class="value-text">{{ pin.showValue }}</div>
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
    font-size: 1.3dvb;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(6, 23, 175);
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
}
</style>
  