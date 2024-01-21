<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Pins } from '@/types/types';
import logo from '@/assets/images/pinlogo.png';

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

</script>

<template>
    <v-dialog v-model="dialogOpen" width="300">
        <v-card color="secondary">
            <template v-slot:title>
                <div class="pin" :style="{ backgroundColor: pin?.color }">{{ pin?.gpioid }}</div>
            </template>
            <template v-slot:prepend>
                <v-avatar>
                    <v-img :src="logo">

                    </v-img>
                </v-avatar>
            </template>
            <v-card-text>
                <p>{{ pinType(pin) }}</p>
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