<script setup lang="ts">
import { onMounted, onUnmounted, Ref, ref } from 'vue';
import { ConnectionText, ExecutePair, ExecuteStateText, NodeTable, Preference } from '../../../interface';
import { i18n } from '../../../plugins/i18n';

interface PROPS {
    preference: Preference
    nodes: Array<NodeTable>
}

const data = defineModel<ExecutePair>()
const props = defineProps<PROPS>()
const fields:Ref<Array<any>> = ref([
    { title: 'Title', align: 'center', key: 'title' },
    { title: 'Description', align: 'center', key: 'description' },
    { title: 'State', align: 'center', key: 'state' },
])
const fields2:Ref<Array<any>> = ref([
    { title: 'ID', align: 'center', key: 'ID' },
    { title: 'URL', align: 'center', key: 'url' },
    { title: 'State', align: 'center', key: 'state' },
])

const translate_state = (ID:string):string => {
    const state = props.nodes.find(x => x.ID == ID)?.state ?? 0
    return i18n.global.t(ConnectionText[state])
}

const translate_state_color = (ID:string):string => {
    const state = props.nodes.find(x => x.ID == ID)?.state ?? 0
    switch(state){
        case 0: return 'white'
        case 1: return 'success'
        case 2: return 'warning'
        case 3: return 'danger'
    }
    return 'white'
}

onMounted(() => {
    
})

onUnmounted(() => {
    
})

</script>

<template>
    <v-container v-if="data != undefined" class="pt-4" style="max-height: 90vh; overflow-y: auto;">
        <h2>{{ $t('project') }}</h2>
        <v-data-table hide-default-footer style="background: transparent" :items="data.record!.projects" :headers="fields" :style="{ 'fontSize': props.preference.font + 'px' }">
            <template v-slot:item.title="{ index, item }">
                <span v-if="data.record!.project_index == index" class="mr-2"><v-icon icon="mdi-arrow-right"></v-icon></span>
                <span>{{ item.title }}</span>
            </template>
            <template v-slot:item.state="{ index }">
                <v-chip>
                    {{ $t(ExecuteStateText[data.record!.project_state[index].state]) }}
                </v-chip>
            </template>
        </v-data-table>
        <br /> <br /> <br />
        <h2>{{ $t('node') }}</h2>
        <v-data-table hide-default-footer style="background: transparent" :items="data.record!.nodes" :headers="fields2" :style="{ 'fontSize': props.preference.font + 'px' }">
            <template v-slot:item.title="{ index, item }">
                <span v-if="data.record!.project_index == index" class="mr-2"><v-icon icon="mdi-arrow-right"></v-icon></span>
                <span>{{ item.url }}</span>
            </template>
            <template v-slot:item.state="{ item }">
                <v-chip :color="translate_state_color(item.ID)">{{ translate_state(item.ID) }}</v-chip>
            </template>
        </v-data-table>
    </v-container>
</template>

<style scoped>

</style>
