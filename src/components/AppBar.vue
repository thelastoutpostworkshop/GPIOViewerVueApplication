<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue';
import BoardSelect from '../components/BoardSelect.vue';
import type { BoardData } from "../types/types";
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();
const boardsData = ref<BoardData[] | undefined>();
onMounted(async () => {
    boardsData.value = await loadBoardsData();
});

async function loadBoardsData(): Promise<BoardData[] | undefined> {
    try {
        const response = await fetch("boards.json");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json() as BoardData[];
    } catch (error) {
        console.error("Could not load boards data:", error);
    }
}

// Expo
</script>
<template>
    <v-app-bar>
        <BoardSelect v-if="boardsData" :boards="boardsData" />
        <v-btn class="ma-2" color="purple" icon="mdi-wrench"></v-btn>
        <v-icon icon="mdi-home" />

        <v-switch v-model="store.freeze" label="Freeze" color="primary" value="primary" hide-details></v-switch>
    </v-app-bar>
</template>
  