
<script setup lang="ts">
import { ref,watch } from 'vue';
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

</script>
<template>
    <v-select :items="$props.boards" item-title="name" v-model="store.currentBoard" return-object></v-select>
</template>
  