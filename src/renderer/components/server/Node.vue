<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { AppConfig, BusType, ConnectionText, Header, NodeTable } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { WebsocketManager } from '../../script/socket_manager';
import NodeInfoDialog from '../dialog/NodeInfoDialog.vue';
import NodeShellDialog from '../dialog/NodeShellDialog.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    nodes: Array<NodeTable>
    manager: WebsocketManager | undefined
    config: AppConfig
}

const props = defineProps<PROPS>()
const infoModal = ref(false)
const infoUUID = ref('')
const consoleModal = ref(false)
const consoleUUID = ref('')
const connectionModal = ref(false)
const connectionData = ref({url: ''})
const fields:Ref<Array<any>> = ref([
    { title: 'ID', align: 'center', key: 'ID' },
    { title: 'URL', align: 'center', key: 'url' },
    { title: 'State', align: 'center', key: 'state' },
    { title: 'Delay', align: 'center', key: 'delay' },
    { title: 'Detail', align: 'center', key: 'detail' }
])
const search = ref('')
const selection:Ref<Array<string>> = ref([])

const items_final = computed(() => {
    return search.value == null || search.value.length == 0 ? props.nodes : props.nodes.filter(x => x.url.includes(search.value) || x.ID.includes(search.value))
})
const hasSelect = computed(() => selection.value.length > 0)
const selected_node_ids = computed(() => props.nodes.filter(x => selection.value.includes(x.ID)).map(x => x.ID))
const infoTarget = computed(() => props.nodes.find(x => x.ID == infoUUID.value))
const consoleTarget = computed(() => props.nodes.find(x => x.ID == consoleUUID.value))

watch(() => infoModal.value, () => {
    if(infoModal.value){
        const p = props.manager?.targets.find(x => x.uuid == infoUUID.value)
        const d:Header = { name: 'resource_start', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }else{
        const p = props.manager?.targets.find(x => x.uuid == infoUUID.value)
        const d:Header = { name: 'resource_end', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }
})

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
        props.manager?.server_stop(x, 'Manually disconnect')
        if(!props.config.isElectron) return
        window.electronAPI.send('server_stop', x, 'Manually disconnect')
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

const showinfo = (uuid:string) => {
    infoModal.value = true
    infoUUID.value = uuid
}

const showconsole = (uuid:string) => {
    consoleModal.value = true
    consoleUUID.value = uuid
    props.manager?.shell_open(uuid)
    props.manager?.shell_folder(uuid, '')
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
            <template v-slot:item.delay="{ item }">
                {{ item.connection_rate }}
            </template>
            <template v-slot:item.detail="{ item }">
                <v-btn flat icon @click="showinfo(item.ID)">
                    <v-icon>mdi-information</v-icon>
                </v-btn>
                <v-btn flat icon @click="showconsole(item.ID)" :disabled="item.state != 1">
                    <v-icon>mdi-console</v-icon>
                </v-btn>
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
        <NodeInfoDialog v-model="infoModal" :item="infoTarget" />
        <NodeShellDialog v-model="consoleModal" :item="consoleTarget" :manager="props.manager" />
    </div>
</template>

<style scoped>
details details{
    margin-left: 12px;
}
details div{
    margin-left: 12px;
}
</style>
