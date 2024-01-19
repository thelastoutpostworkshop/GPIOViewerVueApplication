<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import { ref } from 'vue';

const store = gpioStore();


</script>

<template>
  <v-btn @click="store.freeze = !store.freeze">
    <v-icon :color="store.freeze ? 'blue' : ''">mdi-snowflake</v-icon>
    <span>Freeze</span>
  </v-btn>
</template>
