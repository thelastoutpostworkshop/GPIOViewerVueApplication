<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import AppBar from '../src/views/AppBar.vue';
import ParamsError from '../src/components/ParamsError.vue';

declare var window: any;

onMounted(() => {
  if (window.gpio_settings) {
    console.log(window.gpio_settings); // Access gpio settings
  }
});
const isDataAvailable = computed(() => window.gpio_settings.ip && window.gpio_settings.port);

</script>

<template>
  <v-layout>
    <div v-if="isDataAvailable">
      <AppBar />


      <v-main>
        <RouterView />
      </v-main>
    </div>
    <ParamsError v-else />

  </v-layout>


  <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
</template>

<style scoped></style>
