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
        <v-switch
              label="primary"
              color="primary"
              value="primary"
              hide-details
            ></v-switch>
    </v-app-bar>
</template>
  