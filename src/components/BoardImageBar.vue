<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';
import { ref } from 'vue';

const store = gpioStore();
const menu = ref(false);

</script>

<template>
    <BoardSelect v-if="store.boards" :boards="store.boards" />
    <v-spacer></v-spacer>
    <v-menu color="primary" v-model="menu" :close-on-content-click="false">
        <template v-slot:activator="{ props }">
            <v-btn color="secondary" v-bind="props">
                <v-icon icon="mdi-checkbox-marked-circle"></v-icon> </v-btn>
        </template>

        <v-card min-width="100" v-click-outside="{
            handler: null,
        }">
            <v-list>
                <v-list-item>
                    Options
                </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list>
                <v-list-item>
                    <v-switch v-model="store.freeze" label="Freeze" color="secondary" hide-details></v-switch>
                </v-list-item>
            </v-list>

        </v-card>
    </v-menu>
</template>
