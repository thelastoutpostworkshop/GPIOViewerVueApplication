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
    <v-btn icon :disabled="store.pinTypeDisplay === 0">
        <v-icon>mdi-tooltip</v-icon>
        <v-menu activator="parent" location="bottom end" transition="fade-transition">
            <v-list density="compact" rounded="lg" slim>
                <v-list-item v-if="store.pinTypeDisplay === 1" prepend-icon="mdi-pin" title="Pin Types"
                    link></v-list-item>
                <v-list-item v-if="store.pinTypeDisplay === 2" prepend-icon="mdi-pin" title="Pin Modes"
                    link></v-list-item>

                <v-divider class="my-2"></v-divider>

                <div v-if="store.pinTypeDisplay === 1">
                    <v-list-item min-height="24">
                        D = Digital
                    </v-list-item>
                    <v-list-item min-height="24">
                        A = Analog
                    </v-list-item>
                    <v-list-item min-height="24">
                        P = PWM
                    </v-list-item>
                </div>
                <div v-if="store.pinTypeDisplay === 2">
                    <v-list-item min-height="24">
                        O = Output
                    </v-list-item>
                    <v-list-item min-height="24">
                        I = Input
                    </v-list-item>
                    <v-list-item min-height="24">
                        - = Not Set
                    </v-list-item>
                </div>
            </v-list>
        </v-menu>
    </v-btn>
    <div class="pr-2">@{{ store.SamplingInterval }}ms</div>
</template>
