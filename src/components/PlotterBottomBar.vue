<script setup lang="ts">
import logo from '@/assets/images/GPIOViewerLogo.png';
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

</script>

<template>
    <v-btn @click="store.freeze = !store.freeze">
        <v-icon :color="store.freeze ? 'blue' : ''">mdi-snowflake</v-icon>
        <span>Freeze</span>
    </v-btn>
    <v-btn icon="mdi-home-automation" @click="$router.push({ name: 'gpioview' })">
        <v-img width="30" :src="logo"></v-img>
        <span>GPIOViewer</span>
    </v-btn>
</template>
