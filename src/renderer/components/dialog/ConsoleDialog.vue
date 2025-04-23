<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, Node, Parameter, Preference, Project, Record } from '../../interface';
import DialogBase from './DialogBase.vue';

interface PROP {
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
    
const modal = defineModel<boolean>({ required: true })
const props = defineProps<PROP>()
const emits = defineEmits<{
    (e: 'confirm', name:string, record:Record):void
}>()

const name:Ref<string> = ref('')
const tabs:Ref<Array<[string, string, number]>> = ref([])
const page = ref(0)
const buffer:Ref<Record> = ref({projects: [], nodes: []})

const updateTab = () => {
    tabs.value = [
        ["mdi-cube", "toolbar.project", 0],
        ["mdi-network", "toolbar.node", 1],
    ]
}

const updateLocate = () => {
    updateTab()
}

watch(() => modal.value, () => {
    name.value = ''
    buffer.value = {projects: [], nodes: []}
})

const confirm = () => {
    emits('confirm', name.value, buffer.value)
}

onMounted(() => {
    emitter?.on('updateLocate', updateLocate)
})

onUnmounted(() => {
    emitter?.on('updateLocate', updateLocate)
})
</script>

<template>
    <DialogBase v-model="modal" width="800">
        <template #title>
            <v-icon>mdi-console</v-icon>
            {{ $t('modal.console-create') }}
        </template>
        <template #text>
            <v-text-field v-model="name" :label="$t('modal.console-name')" hide-detail></v-text-field>
            <v-tabs v-model="page" tabs show-arrows class="bg-grey-darken-4">
                <v-tab v-for="(tab, index) in tabs" :style="{ 'fontSize': (props.preference.font - 2) + 'px' }" :value="tab[2]" :key="index">
                    <v-icon>{{ tab[0] }}</v-icon>
                    <span>{{ $t(tab[1]) }}</span>
                </v-tab>
            </v-tabs>
            <v-tabs-window v-model="page">
                <v-tabs-window-item :value="0">
                    <v-toolbar density="compact" class="pr-3">

                    </v-toolbar>
                </v-tabs-window-item>
                <v-tabs-window-item :value="1">
                    <v-toolbar density="compact" class="pr-3">

                    </v-toolbar>
                </v-tabs-window-item>
            </v-tabs-window>
        </template>
        <template #action>
            <v-btn class="mt-3" color="primary" @click="confirm">{{ $t('create') }}</v-btn>
        </template>
    </DialogBase>
</template>