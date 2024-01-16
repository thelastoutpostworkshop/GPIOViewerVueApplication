<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import BoardImage from '../views/BoardImage.vue';
import { gpioStore } from '@/stores/gpiostore'

const store = gpioStore();

</script>

<template>
      <BoardImage :board="store.currentBoard"></BoardImage>
</template>
