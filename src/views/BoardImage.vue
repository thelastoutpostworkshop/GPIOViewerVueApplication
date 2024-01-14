  
<script setup lang="ts">
import type { BoardData } from '@/types/types';

const props = defineProps({
    board: Object as () => BoardData | null
});
</script>
  
<template>
        <div v-if="board">
            <img v-if="board.image" :src="board.image" class="image" />
        </div>
</template>
<style scoped>
.image {
    max-width: 100%;
    max-height: 80vh;
}

</style>
  