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
const activatingPins = ref<Set<number>>(new Set());
const activationTimers = new Map<number, ReturnType<typeof setTimeout>>();
const activeValuePins = computed(() => pinsConf.value?.pins.filter((pin) => Boolean(pin.displayValue)) ?? []);
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
    clearActivationTimers();
});

function updatePinStates(newStates: PinStateMap, pinsConfiguration: PinsConfiguration) {
    Object.entries(newStates).forEach(([gpioId, pinState]) => {
        const pin = pinsConfiguration?.pins.find((position: Pins) => position.gpioid === parseInt(gpioId));
        if (pin) {
            const hadActivity = Boolean(pin.displayValue);
            const displayValue = getValueForPin(pinState);
            pin.color = getColorForPin(pinState);
            pin.displayValue = displayValue;
            pin.displayBarValue = getBarValue(pinState);
            pin.displayType = getPinType(pinState);
            pin.type = pinState.t;
            if (!hadActivity && displayValue) {
                triggerPinActivation(pin.gpioid);
            }
        }
    });
}

function triggerPinActivation(gpioid: number) {
    const existingTimer = activationTimers.get(gpioid);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    const nextActivatingPins = new Set(activatingPins.value);
    nextActivatingPins.add(gpioid);
    activatingPins.value = nextActivatingPins;

    activationTimers.set(gpioid, setTimeout(() => {
        const remainingActivatingPins = new Set(activatingPins.value);
        remainingActivatingPins.delete(gpioid);
        activatingPins.value = remainingActivatingPins;
        activationTimers.delete(gpioid);
    }, 700));
}

function clearActivationTimers() {
    activationTimers.forEach((timer) => clearTimeout(timer));
    activationTimers.clear();
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

function getValueStateClass(pin: Pins): string {
    if (pin.displayValue === DigitalValuesDisplay.High) {
        return 'value--high';
    }
    if (pin.displayValue === DigitalValuesDisplay.Low) {
        return 'value--low';
    }
    return pin.displayValue ? 'value--active' : 'value--idle';
}

function getValueFillClass(pin: Pins): string {
    if (pin.valueJustify === -2) {
        return 'value--fill-vertical';
    }
    if (pin.valueJustify === -1) {
        return 'value--fill-from-right';
    }
    return 'value--fill-from-left';
}

function isPinActivating(gpioid: number): boolean {
    return activatingPins.value.has(gpioid);
}


</script>

<template>
    <div v-if="board" class="board-container">
        <img v-if="board.image" :src="board.image" class="board-image"
            :style="{ 'max-width': store.magnifyImage + 'vw', 'max-height': store.magnifyImage + 'vh' }" />
        <div v-if="pinsConf" v-for="pin in pinsConf.pins" :key="pin.gpioid"
            :class="['indicator', { 'indicator--activating': isPinActivating(pin.gpioid) }]"
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
        <div v-if="pinsConf" v-for="pin in activeValuePins" :key="pin.gpioid" :class="{
            'value': pin.valueJustify !== -1 && pin.valueJustify !== -2,
            'value value_right': pin.valueJustify === -1,
            'value_vertical': pin.valueJustify === -2,
            [getValueStateClass(pin)]: true,
            [getValueFillClass(pin)]: true,
            'value--activating': isPinActivating(pin.gpioid)
        }" :style="{
            top: getTopPosition(pin) + '%',
            left: getLeftPosition(pin) + '%',
            '--pin-height': pinsConf.settings.pinHeight - 0.25 + '%',
            '--min-width': pinsConf.settings.valueMinWidth + '%',
            '--bar-height': pin.displayBarValue,
            '--vertical-bar-height': pinsConf.settings.valueMinWidth + '%',
            '--vertical-bar-width': pinsConf.settings.pinWidth + '%',
            fontSize: pinsConf.settings.valueFontSize + 'dvb'

        }" :id="`gpio${pin.gpioid}`">
            <div class="value__label">{{ pin.displayValue }}</div>
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
    background: color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent);
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: rgb(var(--v-theme-on-surface));
    display: flex;
    align-items: center;
    padding: 0.18em 0.45em;
    border: 1px solid color-mix(in srgb, rgb(var(--v-theme-success)) 45%, transparent);
    border-radius: 6px;
    box-shadow: 0 4px 12px color-mix(in srgb, rgb(var(--v-theme-on-background)) 14%, transparent);
    line-height: 1.15;
    white-space: nowrap;
}

.board-image {
    max-width: 80vw;
    max-height: 80vh;
    display: block;
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
    color: #111827;
    border: 1px solid rgba(15, 23, 42, 0.22);
    box-shadow:
        0 2px 6px rgba(15, 23, 42, 0.38),
        inset 0 0 0 1px rgba(255, 255, 255, 0.42);
    line-height: 1;
}

.indicator--activating {
    animation: pin-activation-pulse 700ms ease-out;
}

.indicator--activating .non-clickable {
    animation: pin-identification-activation 700ms ease-out;
}

:deep(.v-theme--GPIOViewerThemeDark) .indicator {
    color: #111827;
    border-color: color-mix(in srgb, rgb(var(--v-theme-surface)) 72%, transparent);
    box-shadow:
        0 2px 5px color-mix(in srgb, rgb(var(--v-theme-on-background)) 20%, transparent),
        inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.board-container {
    position: relative;
    margin-top: 2%;
    /* Relative positioning for the container */
}

.value,
.value_right,
.value_vertical {
    --value-track-color: rgba(248, 250, 252, 0.94);
    --value-fill-color: #60a5fa;
    position: absolute;
    font-family: "Lucida Console", monospace;
    font-weight: bold;
    color: #111827;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: var(--value-track-color);
    border: 1px solid rgba(15, 23, 42, 0.16);
    border-radius: 999px;
    box-shadow:
        0 3px 10px rgba(15, 23, 42, 0.18),
        inset 0 0 0 1px rgba(255, 255, 255, 0.75);
    line-height: 1;
    white-space: nowrap;
}

:deep(.v-theme--GPIOViewerThemeDark) .value,
:deep(.v-theme--GPIOViewerThemeDark) .value_right,
:deep(.v-theme--GPIOViewerThemeDark) .value_vertical {
    --value-track-color: #64748b;
    --value-fill-color: #2563eb;
    color: #f8fafc;
    border-color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
    box-shadow:
        0 3px 10px color-mix(in srgb, rgb(var(--v-theme-on-background)) 18%, transparent),
        inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-background)) 32%, transparent);
}

.value,
.value_right {
    justify-content: flex-start;
    /* Align text to the left by default */
    min-width: var(--min-width);
    /* Dynamically adjust based on settings */
    height: var(--pin-height);
    /* Dynamically adjust based on settings */
    padding: 0 0.42em;
}

.value_right {
    justify-content: flex-end;
    /* Align text to the right */
}

.value__label {
    position: relative;
    z-index: 1;
}

.value--activating {
    animation: value-activation-pulse 700ms ease-out;
}

.value--activating .value-bar {
    animation: value-bar-activation-horizontal 700ms ease-out;
}

.value_vertical.value--activating .value-bar {
    animation-name: value-bar-activation-vertical;
}

.value .value-bar,
.value_right .value-bar {
    position: absolute;
    bottom: 0;
    height: 100%;
    background: var(--value-fill-color);
    border-radius: inherit;
    transition: width 0.5s ease;
    /* Smooth transition for width changes */
}

.value--fill-from-left .value-bar {
    left: 0;
    transform-origin: left center;
}

.value--fill-from-right .value-bar {
    right: 0;
    transform-origin: right center;
}

.value--high {
    color: #ffffff;
    background: #dc2626;
    border-color: #991b1b;
}

.value--high .value-bar {
    background: #b91c1c;
}

.value--low {
    color: #052e16;
    background: #86efac;
    border-color: #16a34a;
}

.value--low .value-bar {
    background: #22c55e;
}

:deep(.v-theme--GPIOViewerThemeDark) .value--high {
    color: #fef2f2;
    background: #991b1b;
    border-color: #f87171;
}

:deep(.v-theme--GPIOViewerThemeDark) .value--high .value-bar {
    background: #dc2626;
}

:deep(.v-theme--GPIOViewerThemeDark) .value--low {
    color: #ecfdf5;
    background: #047857;
    border-color: #34d399;
}

:deep(.v-theme--GPIOViewerThemeDark) .value--low .value-bar {
    background: #059669;
}

.value--active .value-bar,
.value_vertical.value--active .value-bar {
    background: var(--value-fill-color);
}

.value--idle {
    opacity: 0.38;
}

.value_vertical {
    flex-direction: column;
    /* Stack children vertically */
    justify-content: flex-end;
    padding: 0.2em 0.12em;
}

.value_vertical .value-bar {
    width: 100%;
    /* Full width of the container */
    height: var(--bar-height);
    /* Controlled by JavaScript */
    transition: height 0.5s ease;
    background: var(--value-fill-color);
    border-radius: inherit;
    position: absolute;
    left: 0;
    bottom: 0;
    transform-origin: center bottom;

    /* Smooth transition for height changes */
}

.value_vertical {
    height: var(--vertical-bar-height, 10%);
    width: var(--vertical-bar-width, 10%);
    /* Default height if not set by Vue */
}

@keyframes pin-activation-pulse {
    0% {
        transform: translate(-50%, -50%) scale(0.82);
        box-shadow:
            0 0 0 0 rgba(96, 165, 250, 0.64),
            0 2px 6px rgba(15, 23, 42, 0.38),
            inset 0 0 0 1px rgba(255, 255, 255, 0.42);
    }

    45% {
        transform: translate(-50%, -50%) scale(1.2);
        box-shadow:
            0 0 0 8px rgba(96, 165, 250, 0.2),
            0 4px 12px rgba(15, 23, 42, 0.34),
            inset 0 0 0 1px rgba(255, 255, 255, 0.42);
    }

    100% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow:
            0 0 0 14px rgba(96, 165, 250, 0),
            0 2px 6px rgba(15, 23, 42, 0.38),
            inset 0 0 0 1px rgba(255, 255, 255, 0.42);
    }
}

@keyframes pin-identification-activation {
    0%,
    100% {
        opacity: 1;
    }

    35% {
        opacity: 0.62;
    }
}

@keyframes value-activation-pulse {
    0% {
        filter: brightness(1.18);
        outline: 0 solid rgba(96, 165, 250, 0.52);
    }

    45% {
        filter: brightness(1.08);
        outline: 4px solid rgba(96, 165, 250, 0.22);
    }

    100% {
        filter: brightness(1);
        outline: 0 solid rgba(96, 165, 250, 0);
    }
}

@keyframes value-bar-activation-horizontal {
    0% {
        transform: scaleX(0);
    }

    70% {
        transform: scaleX(1.04);
    }

    100% {
        transform: scaleX(1);
    }
}

@keyframes value-bar-activation-vertical {
    0% {
        transform: scaleY(0);
    }

    70% {
        transform: scaleY(1.04);
    }

    100% {
        transform: scaleY(1);
    }
}
</style>
