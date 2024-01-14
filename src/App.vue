<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref, computed, onMounted } from 'vue';
import AppBar from '../src/views/AppBar.vue';

declare var window: any; 

onMounted(() => {
  if (window.gpio_settings) {
    console.log(window.gpio_settings); // Access gpio settings
  }
});
</script>

<template>
  <v-layout class="rounded rounded-md">
    <AppBar />

    <v-navigation-drawer>
      <v-list>
        <v-list-item title="Navigation drawer"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="d-inline-flex">
      <RouterView />
    </v-main>
  </v-layout>

  <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
</template>

<style scoped></style>
