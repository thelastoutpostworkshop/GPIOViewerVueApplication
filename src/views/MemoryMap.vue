<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ESPInfo, ESPPartition } from "@/types/types";
import { getAPIUrl, formatBytes } from "@/functions";

const spiffs = "spiffs";
const espInfo = ref<ESPInfo>();
const espPartition = ref<ESPPartition[]>();
const heapSizePourc = ref(0);
const heapUsedPourc = ref(0);
const heapUsedPourcDisplay = ref(0);
const sketchUsedPourc = ref(0);
const sketchUsedPourcDisplay = ref(0);
const flashPourc = ref(0);
const spiffsPourc = ref(0);
const spiffsSize = ref(0);
const psramPourc = ref(0);
const psramUsedPourc = ref(0);

async function fetchESPInformation(): Promise<ESPInfo | null> {
      try {
            const response = await fetch(getAPIUrl("espinfo"));
            const data: ESPInfo = await response.json();
            return data;

      } catch (error) {
            console.error("Error fetching esp information", error);
            return null;
      }
}
async function fetchESPPartition(): Promise<ESPPartition[] | null> {
      try {
            const response = await fetch(getAPIUrl("partition"));
            const data: ESPPartition[] = await response.json();
            data.sort((a, b) => parseInt(a.address, 16) - parseInt(b.address, 16));
            return data;

      } catch (error) {
            console.error("Error fetching esp partition", error);
            return null
      }
}
function calculatePourc(info: ESPInfo, partitions: ESPPartition[]) {
      const partitionSize: number = partitions.reduce((sum, partition) => sum + Number(partition.size), 0);
      let totalMemory: number = Number(partitionSize) + Number(info.flash_chip_size) + Number(info.heap_size);
      for (let i = 0; i < partitions.length; i++) {
            if (partitions[i].label === spiffs) {
                  spiffsSize.value = partitions[i].size;
            } else {
                  partitions[i].calcPour = Math.round((partitions[i].size / totalMemory) * 100);
            }
      }
      totalMemory -= spiffsSize.value;
      totalMemory += Number(info.psram_size);
      heapSizePourc.value = Math.round((info.heap_size / totalMemory) * 100);
      heapUsedPourc.value = Math.round(((info.heap_size - info.free_heap) / info.heap_size) * 100);
      heapUsedPourcDisplay.value = Math.round(heapSizePourc.value * (heapUsedPourc.value / 100));
      sketchUsedPourc.value = Math.round((info.sketch_size / info.flash_chip_size) * 100);
      flashPourc.value = Math.round((info.flash_chip_size / totalMemory) * 100);
      sketchUsedPourcDisplay.value = Math.round(sketchUsedPourc.value * (flashPourc.value / 100));
      spiffsPourc.value = Math.round((spiffsSize.value / info.flash_chip_size) * flashPourc.value);
      psramPourc.value = Math.round((info.psram_size / totalMemory) * 100);
      psramUsedPourc.value = Math.round(((info.psram_size - info.free_psram) / totalMemory) * 100);
}

onMounted(async () => {
      try {
            const [espInfoData, espPartitionData] = await Promise.all([fetchESPInformation(), fetchESPPartition()]);

            if (espInfoData && espPartitionData) {
                  calculatePourc(espInfoData, espPartitionData)
                  espInfo.value = espInfoData;
                  espPartition.value = espPartitionData.filter(partition => partition.label !== spiffs);;
            }
      } catch (error) {
            console.error("Error getting partition and ESP Information data", error);
      }
});

</script>

<template>
      <div v-if="espInfo && espPartition" class="memory-maps-container">
            <div v-for="partition in espPartition" :key="partition.address" class="memory-map"
                  :style="{ height: partition.calcPour <= 1 ? '2%' : partition.calcPour + '%' }">
                  <div class="memory-section">
                        <div class="description">{{ partition.label }} {{ formatBytes(partition.size) }}</div>
                  </div>
            </div>

            <div class="memory-map" :style="{ height: flashPourc + '%' }">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: sketchUsedPourcDisplay.toString() + '%' }">
                              {{ sketchUsedPourc.toString() }}% Sketch {{ formatBytes(espInfo.sketch_size) }}
                        </div>
                        <div v-if="spiffsSize !== 0" class="spiffs" :style="{ height: spiffsPourc.toString() + '%' }">
                              {{ spiffsPourc.toString() }}% Spiffs {{ formatBytes(spiffsSize) }}
                        </div>
                        <div class="description">Flash {{ formatBytes(espInfo?.flash_chip_size) }}</div>
                  </div>
            </div>
            <div v-if="psramPourc > 0" class="memory-map"
                  :style="{ height: psramPourc <= 1 ? '2%' : psramPourc.toString() + '%' }">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: psramUsedPourc.toString() + '%' }">{{
                              psramUsedPourc.toString() }} % Used {{ formatBytes(espInfo?.psram_size - espInfo?.free_psram) }}
                        </div>
                        <div class="description">PSRAM {{ formatBytes(espInfo?.psram_size) }}</div>
                  </div>
            </div>
            <div class="memory-map" :style="{ height: heapSizePourc <= 1 ? '2%' : heapSizePourc.toString() + '%' }">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: heapUsedPourcDisplay.toString() + '%' }">{{
                              heapUsedPourc.toString() }} % Used {{ formatBytes(espInfo?.heap_size - espInfo?.free_heap) }}
                        </div>
                        <div class="description">Heap {{ formatBytes(espInfo?.heap_size) }}</div>
                  </div>
            </div>
      </div>
      <div v-else>
            <v-container>
                  <v-progress-circular :size="100" :width="10" color="green" indeterminate></v-progress-circular>
            </v-container>
      </div>
</template>

<style scoped>
.memory-maps-container {
      margin-top: 2%;
      width: 80%;
      height: 78dvh;
}

.memory-map {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
}


.memory-section {
      width: 70%;
      height: 100%;
      position: relative;
      border: 1px solid #000;
      background-color: lightblue;
      box-sizing: border-box;
      display: flex;
      align-items: flex-end;
      margin-bottom: 5px;
}

.used-memory {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      bottom: 0;
      background-color: rgb(157, 157, 196);
      color: black;
      text-align: center;
      box-sizing: border-box;
}

.spiffs {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      /* Added absolute positioning */
      top: 0;
      /* Position at the top of the memory-section */
      background-color: rgb(157, 157, 196);
      color: black;
      text-align: center;
      box-sizing: border-box;
}


.description {
      width: 100%;
      padding-left: 10px;
      box-sizing: border-box;
      text-align: left;
      position: absolute;
      right: -100%;
      top: 0;
      bottom: 0;
      display: flex;
      align-items: center;
}
</style>