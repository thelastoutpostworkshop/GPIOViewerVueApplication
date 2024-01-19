<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();


</script>

<template>
    <v-btn @click="store.freeze = !store.freeze">
        <v-icon :color="store.freeze ? 'blue' : ''">mdi-snowflake</v-icon>
        <span>Freeze</span>
    </v-btn>
    <v-btn @click="">
        <v-icon :color="store.freeze ? 'blue' : ''">mdi-pin</v-icon>
        <span>Pins</span>
    </v-btn>

</template>
