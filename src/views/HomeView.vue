<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BoardImage from '../views/BoardImage.vue';
import type { BoardData } from "../types/types";

const props = defineProps({
  ipaddress: String,
  port: String
});


const gpioStates = ref<Record<string, State>>({});
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

const newBoardImage = ref<BoardData | null>(null);

</script>

<template>
  <main>

  </main>
</template>
