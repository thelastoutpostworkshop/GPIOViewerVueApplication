<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Pins } from '@/types/types';
import logo from '@/assets/images/pinlogo.png';
import pwm from '@/assets/images/pwmlogo.png';
import digital from '@/assets/images/digitallogo.png';
import analog from '@/assets/images/analoglogo.png';
import { getPinModeDescription } from '@/functions'
import { PinModeValue } from '@/const';
import { gpioStore } from '@/stores/gpiostore'
const store = gpioStore();
const emit = defineEmits<{
    (event: 'update:modelValue', value: boolean): void
}>();

// Define a prop for controlling dialog visibility
const props = defineProps({
    showPinInfo: Boolean,
    pin: Object as () => Pins | null
});

// Create a reactive variable for internal dialog state
const dialogOpen = ref(props.showPinInfo);

// Watch for changes in the prop and update the internal state
watch(() => props.showPinInfo, (newVal) => {
    dialogOpen.value = newVal;
});

watch(dialogOpen, (newVal) => {
    emit('update:modelValue', newVal);
});

const pinModeDescription = computed(() => {
    if (props.pin) {
        return getPinModeDescription(pinMode.value);
    }
    return -1; // Default or error value
});
const pinMode = computed(() => {
    if (props.pin) {
        if (props.pin.displayType === 'P') {
            return PinModeValue.OUTPUT
        }
        return store.getPinModeValue(props.pin.gpioid);
    }
    return PinModeValue.UNAVAILABLE; // Default or error value
});
function functionsOfThePin(pin: number | undefined) {
    if (pin !== undefined) {
        return store.getPinFunction(pin);
    }
    return [];
};

function pinType(pin: Pins | null | undefined): string {
    switch (pin?.displayType) {
        case 'P':
            return "PWM"
            break;
        case 'A':
            return "Analog"
            break;
        case 'D':
            return "Digital"
            break;

        default:
            return "Inactive"
            break;
    }
}
function pinIcon(pin: Pins | null | undefined): string {
    switch (pin?.displayType) {
        case 'P':
            return pwm;
        case 'A':
            return analog;
        case 'D':
            return digital

        default:
            return ""
    }
}

const pinFunctions = computed(() => functionsOfThePin(props.pin?.gpioid));
const pinValuePercent = computed(() => Math.max(0, Math.min(props.pin?.displayBarValue ?? 0, 100)));
const pinDisplayValue = computed(() => props.pin?.displayValue || "No activity");

</script>

<template>
    <v-dialog v-model="dialogOpen" max-width="460">
        <v-card class="pin-detail" elevation="10">
            <header class="pin-detail__header">
                <v-avatar class="pin-detail__logo" rounded="lg" size="44">
                    <v-img :src="logo"></v-img>
                </v-avatar>

                <div class="pin-detail__title">
                    <div class="pin-detail__eyebrow">GPIO Pin</div>
                    <div class="pin-detail__name">Pin {{ pin?.gpioid ?? "-" }}</div>
                </div>

                <div class="pin-detail__pin" :style="{ backgroundColor: pin?.color }">{{ pin?.gpioid }}</div>

                <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    aria-label="Close pin details"
                    @click="dialogOpen = false"
                ></v-btn>
            </header>

            <v-card-text class="pin-detail__body">
                <section class="pin-detail__summary">
                    <div class="pin-type-visual">
                        <v-img v-if="pinIcon(pin)" class="pin-type-visual__image" :src="pinIcon(pin)"></v-img>
                        <v-icon v-else icon="mdi-pin-off" size="44"></v-icon>
                    </div>

                    <div class="pin-detail__facts">
                        <div class="fact-row">
                            <span class="fact-row__label">Type</span>
                            <span class="fact-row__value">{{ pinType(pin) }} pin</span>
                        </div>
                        <div class="fact-row">
                            <span class="fact-row__label">Mode</span>
                            <span class="fact-row__value">
                                {{ pinMode !== PinModeValue.UNAVAILABLE ? pinModeDescription : "Unavailable" }}
                            </span>
                        </div>
                    </div>
                </section>

                <section class="pin-detail__section">
                    <div class="section-label">Pin functions</div>
                    <div v-if="pinFunctions.length" class="function-list">
                        <v-chip
                            v-for="(description, index) in pinFunctions"
                            :key="`${description.function}-${index}`"
                            size="small"
                            variant="tonal"
                        >
                            {{ description.function }}
                        </v-chip>
                    </div>
                    <div v-else class="empty-copy">None detected</div>
                </section>

                <section class="pin-detail__section">
                    <div class="section-label">Current value</div>
                    <div class="value-meter">
                        <div class="value-meter__header">
                            <span>{{ pinDisplayValue }}</span>
                            <span>{{ Math.round(pinValuePercent) }}%</span>
                        </div>
                        <v-progress-linear
                            :model-value="pinValuePercent"
                            height="12"
                            rounded
                            color="info"
                            bg-color="secondary"
                        ></v-progress-linear>
                    </div>
                </section>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pin-detail {
    border-radius: 12px;
    background: rgb(var(--v-theme-surface));
    color: rgb(var(--v-theme-on-surface));
    overflow: hidden;
}

.pin-detail__header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    gap: 0.85rem;
    align-items: center;
    padding: 1rem 1rem 0.85rem;
    border-bottom: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent);
}

.pin-detail__logo {
    background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, rgb(var(--v-theme-surface)));
}

.pin-detail__title {
    min-width: 0;
}

.pin-detail__eyebrow,
.section-label,
.fact-row__label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent);
}

.pin-detail__name {
    font-size: 1.15rem;
    font-weight: 700;
}

.pin-detail__pin {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    color: #111827;
    font-weight: 800;
    box-shadow: 0 2px 8px color-mix(in srgb, rgb(var(--v-theme-on-background)) 24%, transparent);
}

.pin-detail__body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
}

.pin-detail__summary {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 1rem;
    align-items: center;
}

.pin-type-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    border-radius: 10px;
    background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 7%, rgb(var(--v-theme-surface)));
}

.pin-type-visual__image {
    max-width: 72px;
}

.pin-detail__facts {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.fact-row {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 0.75rem;
    align-items: baseline;
}

.fact-row__value {
    font-weight: 600;
}

.pin-detail__section {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.function-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
}

.empty-copy {
    color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent);
}

.value-meter {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.value-meter__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-weight: 700;
}

@media (max-width: 460px) {
    .pin-detail__summary {
        grid-template-columns: 1fr;
    }
}
</style>
