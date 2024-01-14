<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BoardImage from '../views/BoardImage.vue';
import type { BoardData, GPIOStates } from "../types/types";
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

const gpioStates = ref<Record<string, GPIOStates>>({});
const colors: string[] = ["#00ff00",
  "#1fff00",
  "#3eff00",
  "#5dff00",
  "#7cff00",
  "#9bff00",
  "#baff00",
  "#d9ff00",
  "#f8ff00",
  "#ffff00", // Yellow
  "#ffef00",
  "#ffdf00",
  "#ffcf00",
  "#ffbf00",
  "#ffaf00",
  "#ff9f00",
  "#ff8f00",
  "#ff7f00",
  "#FE5454",
  "#ff0000", // Red
];

</script>

<template>
      <BoardImage :board="store.currentBoard"></BoardImage>
</template>
