
<script setup lang="ts">
import { watch, onMounted } from 'vue';
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
    const firstBoard = props.boards[0];
    if (firstBoard && !store.currentBoard) {
        store.currentBoard = firstBoard;
    }
};

// Watch for changes in boards and update currentBoard if necessary
watch(() => store.currentBoard, (newBoard) => {
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
    <v-autocomplete class="board-select" bg-color="secondary" auto-select-first density="compact" hide-details clearable :items="$props.boards"
        item-title="name" v-model="store.currentBoard" return-object></v-autocomplete>
</template>

<style scoped>
.board-select {
    width: 100%;
    min-width: 0;
}
</style>
  
