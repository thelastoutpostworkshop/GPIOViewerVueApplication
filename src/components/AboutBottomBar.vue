<script setup lang="ts">
import logo from '@/assets/images/GPIOViewerLogo.png';
import { RouterLink, RouterView, useRouter } from 'vue-router'
const router = useRouter()

</script>

<template>
    <v-btn icon="mdi-home-automation" @click="router.push({ name: 'gpioview' })">
        <v-img width="30" :src="logo"></v-img>
        <span>GPIOViewer</span>
    </v-btn>
</template>
