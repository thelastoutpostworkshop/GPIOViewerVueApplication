<script setup lang="ts">
import logo from '@/assets/images/GPIOViewerLogo.png';

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
    <v-card class="" subtitle="'Transforms the way you troubleshoot your microcontroller projects" elevation="16">
        <template v-slot:title>
            GPIOViewer
        </template>
        <template v-slot:prepend>
            <v-avatar>
                <v-img :src="logo">

                </v-img>
            </v-avatar>
        </template>
        <v-card-text>
            <p class="text-body-1">
                An open source Arduino Library to see live GPIO Pins on ESP32 boards </p>
            <v-divider></v-divider>
            <p class="text-body-2 pt-4 d-none d-sm-flex">
                <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
                Share Your Story: Join the Discussion<v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-flex d-sm-none">
                <v-icon color="blue-darken-4 ">mdi-forum-outline</v-icon>
                Share Your Story <v-icon @click="goToGithubDiscussion">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-none d-sm-flex">
                <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
                Report, Track Issues & Request new board<v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
            </p>
            <p class="text-body-2 pt-4 d-flex d-sm-none">
                <v-icon color="red-darken-4">mdi-alert-circle-outline</v-icon>
                Report Issues <v-icon @click="goToGithubIssues">mdi-open-in-new</v-icon>
            </p>
            <p class="pt-6">Please support this project : <v-btn color="yellow" @click="goToBuyMeACoffee">
                    ☕ Buymeacoffee
                </v-btn></p>
        </v-card-text>
    </v-card>
</template>