<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { ESPInfo, ESPPartition } from "@/types/types";
import { getAPIUrl, formatBytes } from "@/functions";

const espInfo = ref<ESPInfo>();
const espPartition = ref<ESPPartition[]>();

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
            return data;

      } catch (error) {
            console.error("Error fetching esp partition", error);
            return null
      }
}
function calculatePourc(info: ESPInfo, partitions: ESPPartition[]) {
      const partitionSize:number = partitions.reduce((sum, partition) => sum + Number(partition.size), 0);
      const totalMemory:number = Number(partitionSize) +Number(info.flash_chip_size) + Number(info.heap_size);
      console.log(totalMemory);
      console.log(partitionSize);
      for (let i = 0; i < partitions.length; i++) {
            partitions[i].calcPour = Math.round((partitions[i].size / totalMemory) * 100);
            console.log(partitions[i].calcPour)
      }

}

const sketchSizePourc = computed(() => {
      return Math.round(((espInfo?.value?.sketch_size ?? 0) / (espInfo?.value?.flash_chip_size ?? 0)) * 100);
});
const heapSizePourc = computed(() => {
      return Math.round((((espInfo?.value?.heap_size ?? 0) - (espInfo?.value?.free_heap ?? 0)) / (espInfo?.value?.heap_size ?? 0)) * 100);
});


onMounted(async () => {
      try {
            const [espInfoData, espPartitionData] = await Promise.all([fetchESPInformation(), fetchESPPartition()]);

            if (espInfoData && espPartitionData) {
                  calculatePourc(espInfoData, espPartitionData)
                  espInfo.value = espInfoData;
                  espPartition.value = espPartitionData;
            }
      } catch (error) {
            console.error("Error getting partition and ESP Information data", error);
      }
});

</script>

<template>
      <div v-if="espInfo && espPartition" class="memory-maps-container">
            <div v-for="partition in espPartition" :key="partition.address">
                  <div class="memory-map" :style="{ height: partition.calcPour + '%' }">
                        <div class="memory-section">
                              <div class="description">{{ partition.label }} {{ formatBytes(partition.size) }}</div>
                        </div>
                  </div>
            </div>
            <!-- <div class="memory-map"
                  :style="{ height: calculatePartitionPourc(espInfo.sketch_size + espInfo.free_sketch) + '%' }">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: sketchSizePourc.toString() + '%' }">
                              {{ sketchSizePourc.toString() }}% (Sketch)
                        </div>
                        <div class="description">Flash Memory {{ formatBytes(espInfo?.flash_chip_size) }}</div>
                  </div>
            </div>
            <div class="memory-map">
                  <div class="memory-section">
                        <div class="used-memory" :style="{ height: heapSizePourc.toString() + '%' }">{{
                              heapSizePourc.toString() }} % Used</div>
                        <div class="description">Heap {{ formatBytes(espInfo?.heap_size) }}</div>
                  </div>
            </div> -->
      </div>
      <div v-else>
            <v-container>
                  <v-progress-circular :size="100" :width="10" color="green" indeterminate></v-progress-circular>
            </v-container>
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
      /* Adjust each map's height as needed */
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      margin-bottom: 5px;
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
      margin-bottom: 5px;
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