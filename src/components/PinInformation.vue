<script setup lang="ts">
import { ref, watch } from 'vue';

// Define a prop for controlling dialog visibility
const props = defineProps({
    showPinInfo: Boolean
});

// Create a reactive variable for internal dialog state
const dialogOpen = ref(props.showPinInfo);

// Watch for changes in the prop and update the internal state
watch(() => props.showPinInfo, (newVal) => {
    dialogOpen.value = newVal;
});

</script>

<template>
    <v-dialog v-model="dialogOpen">
        <v-card>
            <v-card-title>
                Dialog Title
            </v-card-title>
            <v-card-text>
                This is an example dialog.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>