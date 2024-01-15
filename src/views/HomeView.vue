<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BoardImage from '../views/BoardImage.vue';
import type { BoardData, GPIOStates } from "../types/types";
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

const gpioStates = ref<Record<string, GPIOStates>>({});


</script>

<template>
      <BoardImage :board="store.currentBoard"></BoardImage>
</template>
