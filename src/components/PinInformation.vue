<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Pins } from '@/types/types';

// Define a prop for controlling dialog visibility
const props = defineProps({
    showPinInfo: Boolean,
    pin: Object as () => Pins | null
});

// Create a reactive variable for internal dialog state
const dialogOpen = ref(props.showPinInfo);

// Watch for changes in the prop and update the internal state
watch(() => props.showPinInfo, (newVal) => {
    dialogOpen.value = newVal;
});

</script>

<template>
    <v-dialog v-model="dialogOpen" class="w-50">
        <v-card>
            <v-card-title>
                Pin Information
            </v-card-title>
            <v-card-text>
                {{pin?.gpioid}}
                {{pin?.displayType}}
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>