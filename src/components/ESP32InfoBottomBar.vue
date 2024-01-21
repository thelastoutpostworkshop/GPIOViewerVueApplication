<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import logo from '@/assets/images/GPIOViewerLogo.png';


</script>

<template>
    <v-btn icon="mdi-home-automation"  @click="$router.push({name:'gpioview'})">
        <v-icon>mdi-home-automation</v-icon>

        <span>GPIOViewer</span>
    </v-btn>
</template>
