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

const sketchSizePourc = computed(() => {
      return Math.round(((espInfo?.value?.sketch_size ?? 0) / (espInfo?.value?.flash_chip_size ?? 0)) * 100);
});
const heapSizePourc = computed(() => {
      return Math.round((((espInfo?.value?.heap_size ?? 0) - (espInfo?.value?.free_heap ?? 0)) / (espInfo?.value?.heap_size ?? 0)) * 100);
});


onMounted(() => {
      fetchESPInformation();
});

</script>

<template>
      <div class="memory-maps-container">

            <div class="memory-map">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: sketchSizePourc.toString() + '%' }">
                              {{ sketchSizePourc.toString() }}% (Sketch)
                        </div>
                        <div class="description">Flash Memory {{ formatBytes(espInfo?.flash_chip_size) }}</div>
                  </div>
                  <!-- Add more sections as needed -->
            </div>
            <div class="memory-map">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: heapSizePourc.toString() + '%' }">{{
                              heapSizePourc.toString() }} % Used</div>
                        <div class="description">Heap {{ formatBytes(espInfo?.heap_size) }}</div>
                  </div>
                  <!-- Add more sections as needed -->
            </div>
      </div>
</template>

<style scoped>
.memory-maps-container {
      width: 50%;
      /* Adjust as needed */
      height: 75dvh;
      /* Adjust based on content */
}

.memory-map {
      width: 100%;
      height: 50%;
      /* Adjust each map's height as needed */
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      margin-bottom: 20px;
      /* Spacing between each memory map */
}


.memory-section {
      width: 70%;
      height: 100%;
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
      display: flex;
      align-items: center;
      justify-content: center;
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