<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import { ref } from 'vue';

const store = gpioStore();

</script>

<template>
    <v-app-bar-title>Pin Data Graph</v-app-bar-title>
</template>
