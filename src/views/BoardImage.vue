  
<script setup lang="ts">
import type { BoardData, PinsConfiguration, PinState, Pins,PinStateMap } from '@/types/types';
import { ref, watch, computed, onUnmounted } from 'vue';
import type { ComputedRef } from 'vue';
import { gpioStore } from '@/stores/gpiostore'

const props = defineProps({
    board: Object as () => BoardData | null
});
const store = gpioStore();
const wifiActivity = ref(false);
watch([() => store.currentStates, () => store.freeHeap, () => store.freePSRAM, () => store.freeSketch], () => {
    wifiActivity.value = !wifiActivity.value;
}, { immediate: true });

const wifiClass = computed(() => {
    if (pinsConf?.value?.wifiFeedback.background === "light") {

        return wifiActivity.value ? 'wifi-icon-light animate-wifi-light' : 'wifi-icon-light';
    } else {
        return wifiActivity.value ? 'wifi-icon-dark animate-wifi-dark' : 'wifi-icon-dark';
    }
});

function savePinStates() {
    // Logic to execute when the component is unmounted
    console.log('Component is being unmounted');
}


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
const pinsConf = ref<PinsConfiguration | undefined>();
async function loadIndicators(): Promise<PinsConfiguration | undefined> {
    try {
        if (props.board) {
            const response = await fetch(props.board.pins);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json() as PinsConfiguration;
        }
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}


// Watch for changes in the board prop and call loadIndicators
watch(() => props.board, async (newBoard, oldBoard) => {
    if (newBoard && newBoard !== oldBoard) {
        let oldPinConf = pinsConf.value;
        pinsConf.value = await loadIndicators();
        pinsConf.value?.pins.forEach(newPin => {
            // Find the corresponding pin in the old configuration
            const oldPin = oldPinConf?.pins.find(oldP => oldP.gpioid === newPin.gpioid);

            // Update the color of the current pin with the color from the old configuration
            if (oldPin) {
                newPin.color = oldPin.color;
                newPin.showValue = oldPin.showValue;
                newPin.showBarValue = oldPin.showBarValue;
            }
            ;
        });
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount

function updatePinStates(newStates:PinStateMap, pinsConfiguration:PinsConfiguration) {
    Object.entries(newStates).forEach(([gpioId, pinState]) => {
        const pin = pinsConfiguration?.pins.find((position: Pins) => position.gpioid === parseInt(gpioId));
        if (pin) {
            pin.color = getColorForPin(pinState);
            pin.showValue = getValueForPin(pinState);
            pin.showBarValue = getBarValue(pinState);
        }
    });
}

watch(
    () => store.currentStates,
    (newStates) => {
        if (newStates && pinsConf.value) {
            updatePinStates(newStates, pinsConf.value);
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

const getBarValue = (pinState: PinState): number => {
    const value = Math.max(0, Math.min(pinState.s, 255));
    const widthPercent = (value / 255) * 100;
    return widthPercent;
};

</script>
  
<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image" />
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid" class="indicator"
            :style="{ top: pin.top + '%', left: pin.left + '%', width: pinsConf.settings.pinWidth + '%', height: pinsConf.settings.pinHeight + '%', backgroundColor: pin.color }"
            :id="`gpio${pin.gpioid}`">
            <div v-if="pinsConf.settings.showPinNumber" :style="{ fontSize: pinsConf.settings.valueFontSize + 'dvb' }">{{
                pin.gpioid }}</div>
        </div>
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid"
            :class="pin.valueJustify === -1 ? 'value value_right' : 'value'" :style="{
                top: pin.top - (pinsConf.settings.pinHeight / 2) + '%',
                left: (pin.valueJustify === -1 ? pin.left - pinsConf.settings.valueMinWidth - pinsConf.settings.valuePinMargin : pin.left + pinsConf.settings.valuePinMargin) + '%',
                height: pinsConf.settings.pinHeight - 0.25 + '%',
                backgroundColor: pinsConf.settings.valueBackGroundColor,
                minWidth: pinsConf.settings.valueMinWidth + '%',
                fontSize: pinsConf.settings.valueFontSize + 'dvb'
            }" :id="`gpio${pin.gpioid}`">
            <div>{{ pin.showValue }}</div>
            <div class="value-bar" :style="{ width: pin.showBarValue + '%' }"></div>
        </div>
        <div v-if="pinsConf && pinsConf.stats" class="stats"
            :style="{ top: pinsConf.stats.top + '%', left: pinsConf.stats.left + '%', fontSize: pinsConf.stats.fontSize + 'dvb' }">
            Free Heap:{{ store.freeHeap }}</div>
        <div v-if="pinsConf && pinsConf.stats" class="stats"
            :style="{ top: pinsConf.stats.top + pinsConf.stats.gap + '%', left: pinsConf.stats.left + '%', fontSize: pinsConf.stats.fontSize + 'dvb' }">
            Free Sketch:{{ store.freeSketch }}</div>
        <div v-if="pinsConf && pinsConf.stats" class="stats"
            :style="{ top: pinsConf.stats.top + pinsConf.stats.gap * 2 + '%', left: pinsConf.stats.left + '%', fontSize: pinsConf.stats.fontSize + 'dvb' }">
            Free PSRAM:{{ store.freePSRAM || 'No PSRAM' }}</div>
        <img v-if="pinsConf" src="../assets/images/wifiicon.png" :class="wifiClass"
            :style="{ top: pinsConf.wifiFeedback.top + '%', left: pinsConf.wifiFeedback.left + '%', width: pinsConf.wifiFeedback.width + '% ' }" />

    </div>
</template>
<style scoped>
.wifi-icon-dark {
    position: absolute;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
    /* Subtle glow */
    transition: filter 0.05s ease-in-out;
}

.animate-wifi-dark {
    position: absolute;
    filter: drop-shadow(0 0 20px rgba(255, 255, 255, 1));
    /* Pronounced glow */
}

/* Style for light background */
.wifi-icon-light {
    position: absolute;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.5));
    /* Subtle glow */
    transition: filter 0.05s ease-in-out;
}

.animate-wifi-light {
    position: absolute;
    filter: drop-shadow(0 0 20px rgba(0, 0, 0, 1));
    /* Pronounced glow */
}

.stats {
    position: absolute;
    background-color: rgba(8, 246, 24, 0.9);
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(7, 7, 247);
    display: flex;
    align-items: center;
}

.board-image {
    max-width: 80vw;
    max-height: 80vh;
}

.indicator {
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    border-radius: 50%;
    padding: 5px;
    transform: translate(-50%, -50%);
    background-color: gray;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
}

.board-container {
    position: relative;
    /* Relative positioning for the container */
}

.value {
    position: absolute;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(6, 23, 175);
    display: flex;
    align-items: center;
    justify-content: left;
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
  