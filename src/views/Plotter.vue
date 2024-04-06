<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes, formatHz, formatMacAddress, formatTime } from "@/functions";
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title);

onMounted(() => {
});
</script>

<template>

</template>
