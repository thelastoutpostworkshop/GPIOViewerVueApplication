<script setup lang="ts">
import { gpioStore } from '@/stores/gpiostore'
import BoardSelect from '@/components/BoardSelect.vue';

const store = gpioStore();
</script>

<template>
    <div class="board-image-bar">
        <BoardSelect v-if="store.boards" class="board-image-bar__select" :boards="store.boards" />

        <div class="board-image-bar__actions">
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
            <div class="board-image-bar__sampling">@{{ store.SamplingInterval }}ms</div>
        </div>
    </div>
</template>

<style scoped>
.board-image-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-width: 0;
}

.board-image-bar__select {
    flex: 1 1 420px;
    max-width: 520px;
    min-width: 180px;
}

.board-image-bar__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    white-space: nowrap;
}

.board-image-bar__sampling {
    padding-right: 4px;
    font-weight: 600;
}

@media (max-width: 600px) {
    .board-image-bar {
        gap: 6px;
    }

    .board-image-bar__select {
        flex-basis: auto;
        max-width: none;
        min-width: 0;
    }

    .board-image-bar__actions {
        gap: 2px;
    }

    .board-image-bar__sampling {
        font-size: 0.85rem;
    }
}
</style>
