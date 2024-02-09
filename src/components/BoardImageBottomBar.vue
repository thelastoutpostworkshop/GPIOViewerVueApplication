<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();


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
    <v-btn @click="store.pintype = !store.pintype">
        <v-icon :color="store.pintype ? 'blue' : ''">mdi-pin</v-icon>
        <span v-if="store.pintype">Pin Types</span>
        <span v-else="store.pintype">Pin Numbers</span>
    </v-btn>
    <v-btn @click="decreaseSize">
        <v-icon>mdi-magnify-minus</v-icon>
    </v-btn>
    <v-btn @click="increaseSize">
        <v-icon>mdi-magnify-plus</v-icon>
    </v-btn>
</template>
