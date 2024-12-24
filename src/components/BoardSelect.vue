
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { VSelect } from 'vuetify/components';
import { gpioStore } from '@/stores/gpiostore'

import type { BoardData } from "../types/types";
import { getCookie, setCookie } from '@/functions';

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
watch(() => store.currentBoard, (newBoard, oldBoard) => {
    if (newBoard) {
        setCookie('selectedBoard', newBoard.name, 7); // Save for 7 days
    }
});

// Also check when the component is mounted
onMounted(() => {
    const savedBoardName = getCookie('selectedBoard');
    if (savedBoardName) {
        const savedBoard = props.boards.find(board => board.name === savedBoardName);
        if (savedBoard) {
            store.currentBoard = savedBoard;
        }
    } else {
        selectFirstBoardIfNoneSelected();
    }
});


</script>
<template>
    <v-autocomplete bg-color="secondary" auto-select-first density="compact" hide-details  clearable :items="$props.boards"
        item-title="name" v-model="store.currentBoard" return-object></v-autocomplete>
</template>
  