<script setup lang="ts">
import { computed, watch } from 'vue';
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

const fallbackPinShowState = { id: 0, name: "Pin Numbers" };

const pinShowStates = computed(() => [
    fallbackPinShowState,
    { id: 1, name: "Pin Types" },
    { id: 2, name: "Pin Modes" },
    ...(store.hasPinLabels ? [{ id: 3, name: "Pin Labels" }] : [])
]);

watch(() => store.hasPinLabels, (hasLabels) => {
    if (!hasLabels && store.pinTypeDisplay === 3) {
        store.pinTypeDisplay = 0;
    }
}, { immediate: true });

function nextState() {
    store.pinTypeDisplay = (store.pinTypeDisplay + 1) % pinShowStates.value.length;
}

const currentPinShowState = computed((): { id: number; name: string } => {
    return pinShowStates.value.find((state) => state.id === store.pinTypeDisplay) ?? fallbackPinShowState;
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
        <div>{{ currentPinShowState.name }}</div>
    </v-btn>
    <v-btn @click="decreaseSize">
        <v-icon>mdi-magnify-minus</v-icon>
    </v-btn>
    <v-btn @click="increaseSize">
        <v-icon>mdi-magnify-plus</v-icon>
    </v-btn>
</template>
