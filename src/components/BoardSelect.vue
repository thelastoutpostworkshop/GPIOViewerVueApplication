
<script setup lang="ts">
import { ref,watch } from 'vue';
import { VSelect } from 'vuetify/components';

import type { BoardData } from "../types/types";


const props = defineProps({
    boards: {
        type: Array as () => BoardData[],
        default: () => []
    }
});

const selectedBoard = ref<BoardData | null>(null);

const emit = defineEmits(['update:selectedBoard']);
// Watch for changes to selectedBoard and emit an event
watch(selectedBoard, (newBoard) => {
    emit('update:selectedBoard', newBoard);
});
// Expose selectedBoard to parent components
defineExpose({ selectedBoard });
</script>
<template>
    <v-select :items="$props.boards" item-title="name" v-model="selectedBoard" return-object></v-select>
</template>
  