<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue';
import BoardSelect from '../components/BoardSelect.vue';
import type { BoardData } from "../types/types";
const boardsData = ref<BoardData[] | undefined>();
onMounted(async () => {
    boardsData.value = await loadBoardsData();
});

async function loadBoardsData(): Promise<BoardData[] | undefined> {
    try {
        const response = await fetch("/boards.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json() as BoardData[];
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}
const boardSelectRef = ref();
const selectedBoard = ref<BoardData | null>(null);
const emit = defineEmits(['update:newBoardImage']);

watch(selectedBoard, (newBoard) => {
    console.log(newBoard);
    emit('update:newBoardImage', newBoard);
});
// Expo
</script>
<template>
    <v-app-bar>
        <BoardSelect ref="boardSelectRef" v-if="boardsData" :boards="boardsData"
            @update:selectedBoard="selectedBoard = $event" />

    </v-app-bar>
</template>
  