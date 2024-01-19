<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import { ref } from 'vue';

const store = gpioStore();


</script>

<template>
  <v-btn @click="store.freeze = !store.freeze" value="recent">
    <v-icon>mdi-history</v-icon>

    <span>Freeze</span>
  </v-btn>
</template>
