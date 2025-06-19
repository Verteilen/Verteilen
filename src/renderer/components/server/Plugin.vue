<script setup lang="ts">
import { PluginPageData } from '../../interface';

interface PROP {
    plugin: PluginPageData
}

const props = defineProps<PROP>()

const importPlugin = () => {

}

const importTemplate = () => {
    
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
    </div>
</template>