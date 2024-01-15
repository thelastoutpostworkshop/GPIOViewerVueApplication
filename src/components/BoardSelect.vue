
<script setup lang="ts">
import { ref,watch,onMounted } from 'vue';
import { VSelect } from 'vuetify/components';
import { gpioStore } from '@/stores/gpiostore'

import type { BoardData } from "../types/types";

const store = gpioStore();
const props = defineProps({
    boards: {
        type: Array as () => BoardData[],
        default: () => []
    }
});
// Function to set the first board as current if currentBoard is not set
const selectFirstBoardIfNoneSelected = () => {
  if (props.boards.length > 0 && !store.currentBoard) {
    store.currentBoard = props.boards[0];
  }
};

// Watch for changes in boards and update currentBoard if necessary
watch(() => props.boards, (newBoards, oldBoards) => {
  selectFirstBoardIfNoneSelected();
}, { immediate: true });

// Also check when the component is mounted
onMounted(() => {
  selectFirstBoardIfNoneSelected();
});

</script>
<template>
    <v-select :items="$props.boards" item-title="name" v-model="store.currentBoard" return-object></v-select>
</template>
  