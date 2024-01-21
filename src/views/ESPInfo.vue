<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl } from "@/functions";
import type { ESPInfo } from "@/types/types";

const espInfo = ref<ESPInfo>();

async function fetchESPInformation() {
      try {
            const response = await fetch(getAPIUrl("espinfo"));
            const data: ESPInfo = await response.json();
            espInfo.value = data;

      } catch (error) {
            console.error("Error fetching esp information", error);
      }
}
onMounted(() => {
      fetchESPInformation();
});
</script>

<template>
      {{ espInfo?.chip_model }}
</template>
