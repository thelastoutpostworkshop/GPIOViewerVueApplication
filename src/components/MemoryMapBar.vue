<script setup lang="ts">
import { ref } from 'vue';

function goToYoutube() {
    window.open('https://youtu.be/EuHxodrye6E', '_blank');
}
</script>

<template>
    <v-app-bar-title>Memory Map</v-app-bar-title>
    <div class="text-caption">
        How to create partitions
    </div>
    <v-btn @click="goToYoutube" color="yellow" icon="mdi-open-in-new" variant="text"></v-btn>
</template>
