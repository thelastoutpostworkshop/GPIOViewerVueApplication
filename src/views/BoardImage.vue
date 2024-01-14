  
<script setup lang="ts">
import type { BoardData } from '@/types/types';

const props = defineProps({
    board: Object as () => BoardData | null
});
</script>
  
<template>
    <div v-if="board">
        <img :src="board.image" :alt="board.name" />
    </div>
</template>
<style scoped>
/* Your styles here */
</style>
  