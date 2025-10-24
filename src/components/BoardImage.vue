<script setup lang="ts">
import type { BoardData, PinsConfiguration, PinState, Pins, PinStateMap } from '@/types/types';
import { ref, watch, computed, onUnmounted } from 'vue';
import { gpioStore } from '@/stores/gpiostore'
import PinInfo from '@/components/PinInformation.vue';
import { pinBroadMode } from '@/functions'
import { PinColors, PinType, PinDisplayTypeShort, DigitalValuesDisplay, WifiFeedbackConfigKey } from '@/const';

const props = defineProps({
    board: Object as () => BoardData | null
});
const store = gpioStore();
const wifiActivity = ref(false);
watch([() => store.currentStates, () => store.freeHeap, () => store.wifiActivity, () => store.freePSRAM, () => store.freeSketch], () => {
    wifiActivity.value = !wifiActivity.value;
}, { immediate: true });

const wifiClass = computed(() => {
    if (pinsConf?.value?.wifiFeedback.background === WifiFeedbackConfigKey.Light) {

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
            pin.type = pinState.t;
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
            displayValue = DigitalValuesDisplay.Low;
        } else {
            if (pinState.v == 1) {
                displayValue = DigitalValuesDisplay.High;
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
    return PinColors[index] ?? PinColors[0] ?? '#000000';
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
            pintype = PinDisplayTypeShort.Digital;
            break;
        case PinType.PWM:
            pintype = PinDisplayTypeShort.PMW;
            break;
        case PinType.Analog:
            pintype = PinDisplayTypeShort.Analog;
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

function getLeftPosition(pin: Pins) {
    if (pinsConf.value) {
        if (pin.valueJustify === -1) {
            return pin.left - pinsConf.value.settings.valueMinWidth - pinsConf.value.settings.valuePinMargin;
        } else if (pin.valueJustify === -2) {
            // Example: center the vertical bar; adjust as needed for your UI
            return pin.left - (pinsConf.value.settings.pinWidth / 2);
        } else {
            return pin.left + pinsConf.value.settings.valuePinMargin;
        }
    }
}
function getTopPosition(pin: Pins) {
    if (pinsConf.value) {
        if (pin.valueJustify === -1) {
            return pin.top - (pinsConf.value.settings.pinHeight / 2);
        } else if (pin.valueJustify === -2) {
            // Example: center the vertical bar; adjust as needed for your UI
            return pin.top + (pinsConf.value.settings.pinHeight / 2);
        } else {
            return pin.top - (pinsConf.value.settings.pinHeight / 2);
        }
    }
}

function getValueBarStyle(pin: Pins) {
    if (pin.valueJustify === -2) {
        // For vertical bars, set the height dynamically and width to 100%
        return {
            height: `${pin.displayBarValue}%`
        };
    } else {
        // For horizontal bars or any other case, set the width dynamically and height to 100%
        return {
            width: `${pin.displayBarValue}%`,
        };
    }
}


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
                {{ pinBroadMode(pin.type, pin.gpioid) }}
            </div>
        </div>
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid" :class="{
            'value': pin.valueJustify !== -1 && pin.valueJustify !== -2,
            'value value_right': pin.valueJustify === -1,
            'value_vertical': pin.valueJustify === -2
        }" :style="{
            top: getTopPosition(pin) + '%',
            left: getLeftPosition(pin) + '%',
            backgroundColor: pinsConf.settings.valueBackGroundColor,
            '--pin-height': pinsConf.settings.pinHeight - 0.25 + '%',
            '--min-width': pinsConf.settings.valueMinWidth + '%',
            '--bar-height': pin.displayBarValue,
            '--vertical-bar-height': pinsConf.settings.valueMinWidth + '%',
            '--vertical-bar-width': pinsConf.settings.pinWidth + '%',
            fontSize: pinsConf.settings.valueFontSize + 'dvb'

        }" :id="`gpio${pin.gpioid}`">
            <div>{{ pin.displayValue }}</div>
            <div class="value-bar" :style="getValueBarStyle(pin)"></div>
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

.value,
.value_right,
.value_vertical {
    position: absolute;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(6, 23, 175);
    display: flex;
    align-items: center;
}

.value,
.value_right {
    justify-content: flex-start;
    /* Align text to the left by default */
    min-width: var(--min-width);
    /* Dynamically adjust based on settings */
    height: var(--pin-height);
    /* Dynamically adjust based on settings */
}

.value_right {
    justify-content: flex-end;
    /* Align text to the right */
}

.value .value-bar,
.value_right .value-bar {
    position: absolute;
    bottom: 0;
    height: 100%;
    background-color: rgba(0, 0, 255, 0.25);
    transition: width 0.5s ease;
    /* Smooth transition for width changes */
}

.value_vertical {
    flex-direction: column;
    /* Stack children vertically */
    justify-content: flex-start;
    /* Align content to the top */
}

.value_vertical .value-bar {
    width: 100%;
    /* Full width of the container */
    height: var(--bar-height);
    /* Controlled by JavaScript */
    transition: height 0.5s ease;
    background-color: rgba(0, 0, 255, 0.25);

    /* Smooth transition for height changes */
}

.value_vertical {
    height: var(--vertical-bar-height, 10%);
    width: var(--vertical-bar-width, 10%);
    /* Default height if not set by Vue */
}
</style>
