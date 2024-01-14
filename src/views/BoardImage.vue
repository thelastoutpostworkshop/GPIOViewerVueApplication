  
<script setup lang="ts">
import type { BoardData } from '@/types/types';

const props = defineProps({
    board: Object as () => BoardData | null
});
console.log(props.board);
</script>
  
<template>
    <div v-if="board">
            <v-img  :src="board.image" cover></v-img>

    </div>
</template>
<style scoped>
/* Your styles here */
</style>
  