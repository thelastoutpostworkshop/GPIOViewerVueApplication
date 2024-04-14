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
            return "Not used"
            break;
    }
}
function pinIcon(pin: Pins | null | undefined): string {
    switch (pin?.displayType) {
        case 'P':
            return pwm;
            break;
        case 'A':
            return analog;
            break;
        case 'D':
            return digital
            break;

        default:
            return "Not used"
            break;
    }
}

</script>

<template>
    <v-dialog v-model="dialogOpen" width="300">
        <v-card color="secondary">
            <template v-slot:title>
                <div class="pin" :style="{ backgroundColor: pin?.color }">{{ pin?.gpioid }} </div>
            </template>
            <template v-slot:prepend>
                <v-avatar>
                    <v-img :src="logo">

                    </v-img>
                </v-avatar>
            </template>
            <template v-slot:append>
                <div v-if="pinMode != PinModeValue.UNAVAILABLE">
                    Pin Mode: {{ pinModeDescription }}
                </div>
            </template>
            <v-card-text>
                <v-container>
                    <v-row>
                        <v-col><v-img :width="100" :src="pinIcon(pin)"></v-img></v-col>
                        <v-col align-self="center">{{ pinType(pin) }} pin</v-col>
                    </v-row>
                </v-container>

                <div class="value-bar" :style="{ width: pin?.displayBarValue + '%' }">{{ pin?.displayValue }}</div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.pin {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    color: black;
}

.value-bar {
    position: absolute;
    bottom: 2%;
    height: 25%;
    left: 2%;
    background-color: rgb(97, 157, 235);
    transition: width 0.5s ease;
    display: flex;
    justify-content: left;
    align-items: center;
    padding-left: 1%;
}
</style>