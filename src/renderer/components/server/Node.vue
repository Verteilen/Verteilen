<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, ConnectionText, NodeTable } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { WebsocketManager } from '../../script/socket_manager';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    nodes: Array<NodeTable>
    manager: WebsocketManager | undefined
    config: AppConfig
}

const props = defineProps<PROPS>()
const connectionModal = ref(false)
const connectionData = ref({url: ''})
const fields:Ref<Array<any>> = ref([
    { title: 'ID', align: 'center', key: 'ID' },
    { title: 'URL', align: 'center', key: 'url' },
    { title: 'State', align: 'center', key: 'state' }
])
const search = ref('')
const selection:Ref<Array<string>> = ref([])

const items_final = computed(() => {
    return search.value == null || search.value.length == 0 ? props.nodes : props.nodes.filter(x => x.url.includes(search.value) || x.ID.includes(search.value))
})
const hasSelect = computed(() => selection.value.length > 0)
const selected_node_ids = computed(() => props.nodes.filter(x => selection.value.includes(x.ID)).map(x => x.ID))


const serverUpdate = () => {
    const p = props.manager?.server_update()
    if(p != undefined) emitter?.emit('updateNode', p)
    selection.value = selection.value.filter(x => props.nodes.map(y => y.ID).includes(x))
}

const createNode = () => {
    connectionData.value = {url: '127.0.0.1:12080'}
    connectionModal.value = true
}

const deleteNode = () => {
    selected_node_ids.value.forEach(x => {
        props.manager?.server_stop(x, '伺服器手動斷線')
        if(!props.config.isElectron) return
        window.electronAPI.send('server_stop', x, '伺服器手動斷線')
    })
}

const selectall = () => {
    selection.value = props.nodes.map(x => x.ID)
}

const confirmConnection = () => {
    connectionModal.value = false
    props.manager?.server_start(`ws://${connectionData.value.url}`)
    connectionData.value = { url: '' }
}

const translate_state = (state:number):string => {
    return i18n.global.t(ConnectionText[state])
}

const translate_state_color = (state:number):string => {
    switch(state){
        case 0: return 'white'
        case 1: return 'success'
        case 2: return 'warning'
        case 3: return 'danger'
    }
    return 'white'
}

onMounted(() => {
    emitter?.on('updateHandle', serverUpdate)
})

onUnmounted(() => {
    emitter?.off('updateHandle', serverUpdate)
})

</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search"></v-text-field>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createNode">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="selectall">
                            <v-icon>mdi-check-all</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('selectall') }}
                </v-tooltip>             
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color='error' v-bind="props" @click="deleteNode" :disabled="!hasSelect">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip> 
            </v-toolbar>
        </div>
        <v-data-table :headers="fields" :items="items_final" show-select v-model="selection" item-value="ID">
            <template v-slot:item.state="{ item }">
                <v-chip :color="translate_state_color(item.state)">{{ translate_state(item.state) }}</v-chip>
            </template>
        </v-data-table>
        <v-dialog width="500" v-model="connectionModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-web</v-icon>
                    {{ $t('modal.new-node') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field v-model="connectionData.url" required :label="$t('modal.enter-node-address')"></v-text-field>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="confirmConnection">{{ $t('create') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>

</style>
