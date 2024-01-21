<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';
import { ref } from 'vue';

const store = gpioStore();
const menu = ref(false);

</script>

<template>
    <BoardSelect v-if="store.boards" :boards="store.boards" />
    <v-spacer></v-spacer>
    <div class="pa-5">@{{ store.SamplingInterval }}ms</div>
</template>
