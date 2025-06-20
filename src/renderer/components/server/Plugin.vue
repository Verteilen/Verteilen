<script setup lang="ts">
import { ref } from 'vue';
import { PluginPageData } from '../../interface';
import DialogBase from '../dialog/DialogBase.vue';

interface PROP {
    plugin: PluginPageData
}

const props = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'added-template', url:string, token?:string): void
    (e: 'added-plugin', name:string, url:string, token?:string): void
}>()
const data = ref({
    pluginModal: false,
    templateModal: false
})

const importPlugin = () => {
    data.value.pluginModal = true
}

const importTemplate = () => {
    data.value.templateModal = true
}

const importPluginConfirm = () => {
    data.value.pluginModal = false
}

const importTemplateConfirm = () => {
    data.value.templateModal = false
}

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importPlugin">
                            <v-icon>mdi-puzzle-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-plugin') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="importTemplate">
                            <v-icon>mdi-tag-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('import-template') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <div class="pt-3 px-5">
            <v-row style="height: calc(100vh - 130px)">
                <v-col cols="6">
                    <h2>{{ $t('plugin') }}</h2>
                    <br />
                    <v-list style="overflow-y: auto;" class="h-100">

                    </v-list>
                </v-col>
                <v-col cols="6">
                    <h2>{{ $t('template') }}</h2>
                    <br />
                    <v-list style="overflow-y: auto;" class="h-100">
                        
                    </v-list>
                </v-col>
            </v-row>
        </div>
        <DialogBase v-model="data.pluginModal">
            <template #title>
                {{ $t('import-plugin') }}
            </template>
            <v-card-text>
                
            </v-card-text>
            <template #actions>
                <v-btn color="primary" @click="importPluginConfirm">{{ $t('confirm') }}</v-btn>
            </template>
        </DialogBase>
        <DialogBase v-model="data.templateModal">
            <template #title>
                <v-icon>mdi-import</v-icon>
                {{ $t('import-template') }}
            </template>
            <v-card-text>
                
            </v-card-text>
            <template #actions>
                <v-btn color="primary" @click="importTemplateConfirm">{{ $t('confirm') }}</v-btn>
            </template>
        </DialogBase>
    </div>
</template>