<script setup lang="ts">
import type {  BoardData,  PinsConfiguration,  PinState,  Pins,  PinStateMap } from '@/types/types';
import { ref, watch, computed, onUnmounted } from 'vue';
import { gpioStore } from '@/stores/gpiostore'
import PinInfo from '@/components/PinInformation.vue';
import { pinMode } from '@/functions'
import { PinColors,PinType } from '@/const';

const props = defineProps({
    board: Object as () => BoardData | null
});
const store = gpioStore();
const wifiActivity = ref(false);
watch([() => store.currentStates, () => store.freeHeap, () => store.wifiActivity, () => store.freePSRAM, () => store.freeSketch], () => {
    wifiActivity.value = !wifiActivity.value;
}, { immediate: true });

const wifiClass = computed(() => {
    if (pinsConf?.value?.wifiFeedback.background === "light") {

        return wifiActivity.value ? 'wifi-icon-light animate-wifi-light' : 'wifi-icon-light';
    } else {
        return wifiActivity.value ? 'wifi-icon-dark animate-wifi-dark' : 'wifi-icon-dark';
    }
});

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
        if (pinsConf.value?.settings.showPinNumber) {
            store.pinTypeDisplay = 0;
        } else {
            store.pinTypeDisplay = 1;
        }
        if (oldPinConf) {
            restorePinsState(oldPinConf);
        } else {
            // Coming from another route
            if (store.pinsPreserved) {
                restorePinsState(store.pinsPreserved);
            }
        }
        store.magnifyImage = 80;
    }
}, { immediate: true }); // immediate: true ensures the effect runs on mount

function restorePinsState(newPinsConf: PinsConfiguration) {
    pinsConf.value?.pins.forEach(newPin => {
        // Find the corresponding pin in the old configuration
        const oldPin = newPinsConf?.pins.find(oldP => oldP.gpioid === newPin.gpioid);

        // Update the color of the current pin with the color from the old configuration
        if (oldPin) {
            newPin.color = oldPin.color;
            newPin.displayValue = oldPin.displayValue;
            newPin.displayBarValue = oldPin.displayBarValue;
            newPin.displayType = oldPin.displayType;
        };
    });
}
onUnmounted(() => {
    store.pinsPreserved = pinsConf?.value ?? null;
});

function updatePinStates(newStates: PinStateMap, pinsConfiguration: PinsConfiguration) {
    Object.entries(newStates).forEach(([gpioId, pinState]) => {
        const pin = pinsConfiguration?.pins.find((position: Pins) => position.gpioid === parseInt(gpioId));
        if (pin) {
            pin.color = getColorForPin(pinState);
            pin.displayValue = getValueForPin(pinState);
            pin.displayBarValue = getBarValue(pinState);
            pin.displayType = getPinType(pinState);
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
    const index = Math.floor((value / 255) * (PinColors.length - 1));
    return PinColors[index];
};

const getBarValue = (pinState: PinState): number => {
    const value = Math.max(0, Math.min(pinState.s, 255));
    const widthPercent = (value / 255) * 100;
    return widthPercent;
};

const getPinType = (pin: PinState): string => {
    let pintype = "";
    switch (pin.t) {
        case PinType.Digital:
            pintype = "D";
            break;
        case PinType.PWM:
            pintype = "P";
            break;
        case PinType.Analog:
            pintype = "A";
            break;
        default:
            break;
    }
    return pintype;
}
const showPinInfoCard = ref(false);
const selectedPin = ref<Pins | null>(null);
const showPinInfo = (pin: Pins) => {
    selectedPin.value = pin;
    showPinInfoCard.value = true;
};



</script>

<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image"
            :style="{ 'max-width': store.magnifyImage + 'vw', 'max-height': store.magnifyImage + 'vh' }" />
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid" class="indicator"
            :style="{ top: pin.top + '%', left: pin.left + '%', width: pinsConf.settings.pinWidth + '%', height: pinsConf.settings.pinHeight + '%', backgroundColor: pin.color }"
            :id="`gpio${pin.gpioid}`" @click="showPinInfo(pin)">
            <div v-if="store.pinTypeDisplay === 0" class="non-clickable"
                :style="{ fontSize: pinsConf.settings.valueFontSize + 'dvb' }">
                {{
                    pin.gpioid }}</div>
            <div v-if="store.pinTypeDisplay === 1" class="non-clickable"
                :style="{ fontSize: pinsConf.settings.valueFontSize + 'dvb' }">
                {{ pin.displayType }}
            </div>
            <div v-if="store.pinTypeDisplay === 2" class="non-clickable"
                :style="{ fontSize: pinsConf.settings.valueFontSize + 'dvb' }">
                {{ pinMode(pin) }}
            </div>
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
            <div>{{ pin.displayValue }}</div>
            <div class="value-bar" :style="{ width: pin.displayBarValue + '%' }"></div>
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
        <div v-if="pinsConf">
            <img v-if="store.connectedToESP32" src="@/assets/images/wifiicon.webp" :class="wifiClass"
                :style="{ top: pinsConf.wifiFeedback.top + '%', left: pinsConf.wifiFeedback.left + '%', width: pinsConf.wifiFeedback.width + '% ' }" />
            <img v-else src="@/assets/images/noconnection.webp" :class="wifiClass"
                :style="{ top: pinsConf.wifiFeedback.top + '%', left: pinsConf.wifiFeedback.left + '%', width: pinsConf.wifiFeedback.width + '% ' }" />
        </div>

        <PinInfo :pin="selectedPin" :showPinInfo="showPinInfoCard" @update:modelValue="showPinInfoCard = false">
        </PinInfo>
    </div>
</template>
<style scoped>
.non-clickable {
    pointer-events: none;
    cursor: default;
    /* Change the cursor to indicate non-interactive */
}

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
    margin-top: 2%;
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