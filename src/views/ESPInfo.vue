<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes, formatHz, formatMacAddress, formatTime } from "@/functions";
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

function flashMode(mode: number): string {
      switch (mode) {
            case 0x00:
                  return "QIO"
            case 0x01:
                  return "QOUT"
            case 0x02:
                  return "DIO"
            case 0x03:
                  return "DOUT"
            case 0x04:
                  return "FAST_READ"
            case 0x05:
                  return "SLOW_READ"
            default:
                  return "unknown"
      }
}
onMounted(() => {
      fetchESPInformation();
});
</script>

<template>
      <v-container v-if="espInfo">
            <v-card elevation="6" color="primary">
                  <v-card-title>
                        <div class="text-body-1 text-wrap">This is the information from the ESP32 where GPIOViewer is running
                        </div>
                  </v-card-title>
            </v-card>
            <v-table class="mt-5" density="compact">
                  <tbody>
                        <tr>
                              <td>Chip Model</td>
                              <td>{{ espInfo?.chip_model }}</td>
                        </tr>
                        <tr>
                              <td>Chip Revision</td>
                              <td>{{ espInfo?.chip_revision }}</td>
                        </tr>
                        <tr>
                              <td>Number of Cores</td>
                              <td>{{ espInfo?.cores_count }}</td>
                        </tr>
                        <tr>
                              <td>CPU Frequency</td>
                              <td>{{ espInfo?.cpu_frequency }} Mhz</td>
                        </tr>
                        <tr>
                              <td>Up Time</td>
                              <td>{{ formatTime(espInfo?.up_time) }}</td>
                        </tr>
                        <tr>
                              <td>Current Cycle Count</td>
                              <td>{{ espInfo?.cycle_count }}</td>
                        </tr>
                        <tr>
                              <td>Flash Chip Speed</td>
                              <td>{{ formatHz(espInfo?.flash_chip_speed) }}</td>
                        </tr>
                        <tr>
                              <td>Flash Chip Size</td>
                              <td>{{ formatBytes(espInfo?.flash_chip_size) }}</td>
                        </tr>
                        <tr>
                              <td>Sketch Size</td>
                              <td>{{ formatBytes(espInfo?.sketch_size) }}</td>
                        </tr>
                        <tr>
                              <td>Free Sketch remaining</td>
                              <td>{{ formatBytes(espInfo?.free_sketch) }}</td>
                        </tr>
                        <tr>
                              <td>Heap Size</td>
                              <td>{{ formatBytes(espInfo?.heap_size) }}</td>
                        </tr>
                        <tr>
                              <td>Free Heap</td>
                              <td>{{ formatBytes(espInfo?.free_heap) }}</td>
                        </tr>
                        <tr>
                              <td>Heap Maximum Allocatable block</td>
                              <td>{{ formatBytes(espInfo?.heap_max_alloc) }}</td>
                        </tr>
                        <tr>
                              <td>PSRAM Size</td>
                              <td>{{ formatBytes(espInfo?.psram_size) }}</td>
                        </tr>
                        <tr>
                              <td>Free PSRAM</td>
                              <td>{{ formatBytes(espInfo?.free_psram) }}</td>
                        </tr>
                        <tr>
                              <td>PSRAM Maximum Allocatable block</td>
                              <td>{{ formatBytes(espInfo?.psram_max_alloc) }}</td>
                        </tr>
                        <tr>
                              <td>Flash Chip Mode</td>
                              <td>{{ flashMode(espInfo?.flash_mode) }}</td>
                        </tr>
                        <tr>
                              <td>eFuse Mac Address</td>
                              <td>{{ formatMacAddress(espInfo?.mac) }}</td>
                        </tr>
                  </tbody>
            </v-table>
      </v-container>
      <div v-else>
            <v-container>
                  <v-progress-circular :size="100" :width="10" color="green" indeterminate></v-progress-circular>
            </v-container>
      </div>
</template>
