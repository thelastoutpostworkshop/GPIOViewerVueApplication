<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';

const store = gpioStore();

</script>

<template>
    <BoardSelect v-if="store.boards" :boards="store.boards" />
    <v-spacer></v-spacer>
    <v-switch v-model="store.freeze" label="Freeze" color="secondary" hide-details></v-switch>
</template>
