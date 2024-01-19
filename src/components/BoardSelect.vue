
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
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

function setCookie(name: string, value: string, days?: number): void {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

</script>
<template>
    <v-autocomplete bg-color="secondary" auto-select-first density="compact" hide-details  clearable :items="$props.boards"
        item-title="name" v-model="store.currentBoard" return-object></v-autocomplete>
</template>
  