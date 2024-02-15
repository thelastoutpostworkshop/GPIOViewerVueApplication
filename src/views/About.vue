<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
const store = gpioStore();

function goToGithubDiscussion() {
    window.open('https://github.com/thelastoutpostworkshop/gpio_viewer/discussions', '_blank');
}
function goToGithubIssues() {
    window.open('https://github.com/thelastoutpostworkshop/gpio_viewer/issues', '_blank');
}
function goToBuyMeACoffee() {
    window.open('https://www.buymeacoffee.com/thelastoutpostworkshop', '_blank');
}
</script>
<template>
    <v-card class="w-75 mt-5" subtitle="Transforms the way you troubleshoot your microcontroller projects" elevation="16">
        <template v-slot:title>
            <div class="text-wrap">An open source Arduino Library to see live GPIO Pins on ESP32 boards</div>
        </template>
        <v-card-text>
            <v-divider></v-divider>
            <p class="text-body-2 pt-4 d-none d-sm-flex">
                <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
                <span class="ml-2 mr-2">Share Your Story: Join the Discussion</span>
                <v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-flex d-sm-none">
                <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
                <span class="ml-2 mr-2">Share Your Story</span>
                <v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-none d-sm-flex">
                <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
                <span class="ml-2 mr-2">Report, Track Issues & Request new board</span>
                <v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-flex d-sm-none">
                <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
                <span class="ml-2 mr-2">Report Issues</span>
                <v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
            </p>
            <p class="pt-6">Please support this project : <v-btn color="yellow" @click="goToBuyMeACoffee">
                    ☕ Buymeacoffee
                </v-btn></p>
        </v-card-text>
        <div class="pr-10">
            GPIOViewer v{{ store.GPIOViewerRelease }}
        </div>
        <div>
            Web Application v{{ store.WebApplicationRelease }}
        </div>
    </v-card>
</template>