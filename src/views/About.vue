<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  showDialog: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:showDialog']);

const closeDialog = () => {
  emit('update:showDialog', false);
};
</script>

<template>
  <v-dialog v-model="showDialog" width="auto">
    <v-card>
      <v-card-text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" block @click="closeDialog">Close Dialog</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

