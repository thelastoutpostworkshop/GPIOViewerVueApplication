<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';
import { ref } from 'vue';

const store = gpioStore();
const menu = ref(false);
const settings = ref(false);

</script>

<template>
    <BoardSelect v-if="store.boards" :boards="store.boards" />
    <v-spacer></v-spacer>
    <!-- <v-btn icon >
        <v-icon>mdi-cog</v-icon>
        <v-menu activator="parent" location="bottom end" :close-on-content-click="false" >
            <v-card min-width="300">
                <v-list>
                    <v-list-item>
                        <v-switch v-model="settings" color="blue-darken-3" label="Hide Activity on analog pins"
                            hint="Hide analog values (can be floating if ADC not used on pins)" persistent-hint inline></v-switch>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-menu>
    </v-btn> -->

    <v-btn icon :disabled="store.pinTypeDisplay === 0">
        <v-icon>mdi-tooltip</v-icon>
        <v-menu activator="parent" location="bottom end" transition="fade-transition" width="175">
            <v-list density="compact" rounded="lg" slim>
                <v-list-item v-if="store.pinTypeDisplay === 1" prepend-icon="mdi-pin" title="Pin Types"
                    link></v-list-item>
                <v-list-item v-if="store.pinTypeDisplay === 2" prepend-icon="mdi-pin" title="Pin Modes"
                    link></v-list-item>

                <v-divider class="my-2"></v-divider>

                <div v-if="store.pinTypeDisplay === 1">
                    <v-list-item min-height="24">
                        D
                        <template v-slot:append>
                            Digital
                        </template>
                    </v-list-item>
                    <v-list-item min-height="24">
                        A
                        <template v-slot:append>
                            Analog (ADC)
                        </template>
                    </v-list-item>
                    <v-list-item min-height="24">
                        P
                        <template v-slot:append>
                            PWM
                        </template>
                    </v-list-item>
                </div>
                <div v-if="store.pinTypeDisplay === 2">
                    <v-list-item min-height="24">
                        O
                        <template v-slot:append>
                            Output
                        </template>
                    </v-list-item>
                    <v-list-item min-height="24">
                        I
                        <template v-slot:append>
                            Input
                        </template>
                    </v-list-item>
                    <v-list-item min-height="24">
                        -
                        <template v-slot:append>
                            Not Set
                        </template>
                    </v-list-item>
                </div>
            </v-list>
        </v-menu>
    </v-btn>
    <div class="pr-2">@{{ store.SamplingInterval }}ms</div>
</template>
