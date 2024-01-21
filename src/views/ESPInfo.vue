<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getAPIUrl, formatBytes ,formatHz,formatMacAddress} from "@/functions";
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
      <v-table class="mt-10">
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
                        <td>Current Cycle Count</td>
                        <td>{{ espInfo?.cycle_count }}</td>
                  </tr>
                  <tr>
                        <td>Flash Chip Size</td>
                        <td>{{ formatBytes(espInfo?.flash_chip_size) }}</td>
                  </tr>
                  <tr>
                        <td>Flash Chip Speed</td>
                        <td>{{ formatHz(espInfo?.flash_chip_speed) }}</td>
                  </tr>
                  <tr>
                        <td>Heap Size</td>
                        <td>{{ formatBytes(espInfo?.heap_size) }}</td>
                  </tr>
                  <tr>
                        <td>Flash Chip Mode</td>
                        <td>{{ espInfo?.flash_mode }}</td>
                  </tr>
                  <tr>
                        <td>eFuse Mac Address</td>
                        <td>{{ formatMacAddress(espInfo?.mac) }}</td>
                  </tr>
            </tbody>
      </v-table>
</template>
