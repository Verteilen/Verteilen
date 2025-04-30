<script setup lang="ts">
import { ref } from 'vue';

const modal = defineModel<boolean>({ required: true })
const pages = ref([
    "workflow",
    "core",
    "ui",
    "project",
    "task",
    "job",
    "parameter",
    "console",
])
const text = ref('# PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n # PP \n')

</script>

<template>
    <v-dialog width="800" v-model="modal" class="text-white">
        <v-card>
            <v-card-title>
                <v-icon>mdi-book</v-icon>
                <span>{{ $t('guide') }}</span>
            </v-card-title>
            <v-card-text>
                <v-row style="min-height: 200px; max-height: 80vh; overflow-y:auto">
                    <v-col cols="3" class="border-e-lg">

                    </v-col>
                    <v-col cols="9">
                        <vue-markdown :source="text" />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>