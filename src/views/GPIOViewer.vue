<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BoardImage from '@/components/BoardImage.vue';
import { gpioStore } from '@/stores/gpiostore'
import PinLegend from '@/components/PinLegend.vue';

const store = gpioStore();

</script>

<template>
      <div>
            <BoardImage :board="store.currentBoard"></BoardImage>
            <PinLegend></PinLegend>
      </div>
</template>
