<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ESPInfo } from "@/types/types";
import { getAPIUrl, formatBytes } from "@/functions";

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

// const totalMemory = computed(() => {
//       return (espInfo.value?.heap_size ?? 0) + (espInfo.value?.psram_size ?? 0);
// });


onMounted(() => {
      fetchESPInformation();
});

</script>

<template>
      <div class="memory-map">
            <div class="memory-section" style="height: 30%;">
                  <div class="used-memory" style="height: 50%;">15% Used</div>
                  <div class="description">Section 1 Description</div>
            </div>
            <div class="memory-section" style="height: 20%;">
                  <div class="used-memory" style="height: 75%;">15% Used</div>
                  <div class="description">Section 2 Description</div>
            </div>
            <div class="memory-section" style="height: 50%;">
                  <div class="used-memory" style="height: 60%;">30% Used</div>
                  <div class="description">Section 3 Description</div>
            </div>
            <!-- Add more sections as needed -->
      </div>
</template>

<style scoped>
.memory-map {
      width: 50%;
      height: 75dvh;
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      /* Align sections at the bottom */
}

.memory-section {
      width: 70%;
      height: auto;
      /* Adjust height based on content */
      position: relative;
      border: 1px solid #000;
      background-color: lightblue;
      box-sizing: border-box;
      display: flex;
      /* Flex container */
      align-items: flex-end;
      /* Align used-memory to the bottom */
      margin-bottom: 10px;
      /* Optional spacing between sections */
}

.used-memory {
      width: 100%;
      position: absolute;
      bottom: 0;
      /* Position at the bottom of the memory-section */
      background-color: darkblue;
      color: white;
      text-align: center;
      box-sizing: border-box;
}

.description {
      width: 30%;
      /* Width of the description */
      padding-left: 10px;
      /* Spacing */
      box-sizing: border-box;
      text-align: left;
      position: absolute;
      /* Positioned absolutely */
      right: -35%;
      /* Adjust as necessary to position outside the memory section */
      top: 0;
      /* Align to the top of the parent */
      bottom: 0;
      /* Align to the bottom of the parent */
      display: flex;
      align-items: center;
      /* Center text vertically */
}
</style>