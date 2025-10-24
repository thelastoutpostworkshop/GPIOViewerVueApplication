<script setup lang="ts">
import { ref, computed } from 'vue';
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

const fallbackPinShowState = { id: 0, name: "Pin Numbers" };

const pinShowStates: Array<{ id: number; name: string }> = [
    fallbackPinShowState,
    { id: 1, name: "Pin Type" },
    { id: 2, name: "Pin Mode" }
];

function nextState() {
    store.pinTypeDisplay = (store.pinTypeDisplay + 1) % pinShowStates.length;
}

const currentPinShowState = computed((): { id: number; name: string } => {
    if (pinShowStates.length === 0) {
        return fallbackPinShowState;
    }
    const resolved = pinShowStates[store.pinTypeDisplay % pinShowStates.length];
    if (resolved) {
        return resolved;
    }
    return fallbackPinShowState;
});

function increaseSize() {
    store.magnifyImage += 2;
}
function decreaseSize() {
    store.magnifyImage -= 2;

}
</script>

<template>
    <v-btn @click="store.freeze = !store.freeze">
        <v-icon :color="store.freeze ? 'blue' : ''">mdi-snowflake</v-icon>
        <span>Freeze</span>
    </v-btn>
    <v-btn @click="nextState">
        <v-icon>mdi-pin</v-icon>
        <div v-if="currentPinShowState.id === 0">
            Pin Numbers
        </div>
        <div v-if="currentPinShowState.id === 1">
            Pin Types
        </div>
        <div v-if="currentPinShowState.id === 2">
            Pin Modes
        </div>
    </v-btn>
    <v-btn @click="decreaseSize">
        <v-icon>mdi-magnify-minus</v-icon>
    </v-btn>
    <v-btn @click="increaseSize">
        <v-icon>mdi-magnify-plus</v-icon>
    </v-btn>
</template>
