<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
const store = gpioStore();


</script>

<template>
    <v-card color="secondary">
        <v-card-title v-if="store.pinTypeDisplay === 1">Legend Pin Types</v-card-title>
        <v-card-title v-if="store.pinTypeDisplay === 2">Legend Pin Modes</v-card-title>
        <v-card-text v-if="store.pinTypeDisplay === 1">
            <div>
                D = Digital
            </div>
            <div>
                A = Analog
            </div>
            <div>
                P = PWM
            </div>
        </v-card-text>
        <v-card-text v-if="store.pinTypeDisplay === 2">
            <div>
                O = Output
            </div>
            <div>
                I = Input
            </div>
        </v-card-text>
    </v-card>

</template>