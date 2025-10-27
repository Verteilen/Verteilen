<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt';
import { v6 as uuid6 } from 'uuid';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, ConnectionText, Execute_SocketManager, Header, NodeTable, Plugin, PluginPageData, PluginWithToken, Preference } from '../../interface';
import { i18n } from '../../plugins/i18n';
import NodeInfoDialog from '../dialog/NodeInfoDialog.vue';
import NodeShellDialog from '../dialog/NodeShellDialog.vue';
import NodePluginDialog from '../dialog/NodePluginDialog.vue';
import { BackendProxy } from '../../proxy';
import DialogBase from '../dialog/DialogBase.vue';
import { DATA } from './Node';
//#endregion

//#region Data
interface PROPS {
    nodes: Array<NodeTable>
    manager: Execute_SocketManager.WebsocketManager | undefined
    plugin: PluginPageData
}
const emitter:Emitter<BusType> = inject('emitter')!
const backend:BackendProxy = inject("backend")!
const preference:Preference = inject("preference")!
const $t = i18n.global.t
const props = defineProps<PROPS>()
const data:Ref<DATA> = ref({
    deleteModal: false,
    deleteData: [],
    pluginModal: false,
    pluginUUID: "",
    infoModal: false,
    infoUUID: "",
    consoleModal: false,
    consoleUUID: "",
    connectionModal: false,
    connectionData: { url: "" },
    search: "",
    isquery: false,
    selection: [],
})
const fields:Ref<Array<any>> = ref([
    { title: 'ID', align: 'center', key: 'ID' },
    { title: 'URL', align: 'center', key: 'url' },
    { title: 'State', align: 'center', key: 'state' },
    { title: 'Delay', align: 'center', key: 'delay' },
    { title: 'Detail', align: 'center', key: 'detail' }
])
//#endregion

//#region Computed
const items_final = computed(() => {
    return data.value.search == null || data.value.search.length == 0 ? props.nodes : props.nodes.filter(x => x.url.includes(data.value.search) || x.uuid.includes(data.value.search))
})
const hasSelect = computed(() => data.value.selection.length > 0)
const selected_node_ids = computed(() => props.nodes.filter(x => data.value.selection.includes(x.uuid)).map(x => x.uuid))
const infoTarget = computed(() => props.nodes.find(x => x.uuid == data.value.infoUUID))
const consoleTarget = computed(() => props.nodes.find(x => x.uuid == data.value.consoleUUID))
const pluginTarget = computed(() => props.nodes.find(x => x.uuid == data.value.pluginUUID))
//#endregion

//#region Watch
watch(() => data.value.infoModal, () => {
    if(data.value.infoModal){
        if(backend.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.infoUUID)
            backend.send('resource_start', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.infoUUID)
            const d:Header = { name: 'resource_start', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }else{
        if(backend.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.infoUUID)
            backend.send('resource_end', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.infoUUID)
            const d:Header = { name: 'resource_end', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }
})
watch(() => data.value.pluginModal, () => {
    if(data.value.pluginModal){
        if(backend.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.pluginUUID)
            backend.send('resource_start', p?.uuid)
            backend.send('plugin_info', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.pluginUUID)
            const d:Header = { name: 'resource_start', data: 0 }
            const d2:Header = { name: 'plugin_info', data: 0 }
            p?.websocket.send(JSON.stringify(d))
            p?.websocket.send(JSON.stringify(d2))
        }
    }else{
        if(backend.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.pluginUUID)
            backend.send('resource_end', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.pluginUUID)
            const d:Header = { name: 'resource_end', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }
})
//#endregion

//#region Methods
const serverUpdate = () => {
    if(backend.config.haveBackend){
        if(data.value.isquery) return
        data.value.isquery = true
        backend.invoke("node_update").then(p => {
            if(p != undefined) emitter.emit('updateNode', p)
            data.value.selection = data.value.selection.filter(x => props.nodes.map(y => y.uuid).includes(x))
            data.value.isquery = false
        })
    }else{
        const p = props.manager?.server_update()
        if(p != undefined) emitter.emit('updateNode', p)
        data.value.selection = data.value.selection.filter(x => props.nodes.map(y => y.uuid).includes(x))
    }
}
const createNode = () => {
    data.value.connectionData = {url: '127.0.0.1:12080'}
    data.value.connectionModal = true
}
const deleteConfirm = () => {
    data.value.deleteModal = false
    data.value.deleteData.forEach(x => {
        if(backend.config.haveBackend){
            backend.send('node_delete', x)
            backend.send('server_stop', x, 'Manually disconnect')
            backend.send('delete_node', x)
        }else{
            props.manager?.server_stop(x, 'Manually disconnect')
        }
    })
}
const deleteNode = () => {
    data.value.deleteModal = true
    data.value.deleteData = selected_node_ids.value
}
const selectall = () => {
    data.value.selection = props.nodes.map(x => x.uuid)
}
const confirmConnection = () => {
    data.value.connectionModal = false
    if(backend.config.haveBackend){
        backend.send("node_add", `wss://${data.value.connectionData.url}`, uuid6())
    }else{
        props.manager?.server_start(`wss://${data.value.connectionData.url}`, uuid6())
    }
    data.value.connectionData = { url: '' }
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
const showplugin = (uuid:string) => {
    data.value.pluginModal = true
    data.value.pluginUUID = uuid
}
const showinfo = (uuid:string) => {
    data.value.infoModal = true
    data.value.infoUUID = uuid
}
const showconsole = (uuid:string) => {
    data.value.consoleModal = true
    data.value.consoleUUID = uuid
    if(backend.config.haveBackend){
        backend.send('shell_open', uuid)
        backend.send('shell_folder', uuid, '')
    }else{
        props.manager?.shell_open(uuid)
        props.manager?.shell_folder(uuid, '')
    }
}
const plugin_download = (plugin:Plugin) => {
    if(pluginTarget.value == undefined) return
    if(backend.config.haveBackend){
        backend.send("plugin_download", pluginTarget.value.uuid, JSON.stringify(plugin), preference.plugin_token.map(x => x.token).join(' '))
    }else{
        const p = props.manager?.targets.find(x => x.uuid == pluginTarget.value?.uuid)
        const p2:PluginWithToken = {...plugin, token: preference.plugin_token.map(x => x.token)}
        const h:Header = { name: 'plugin_download', data: plugin }
        p?.websocket.send(JSON.stringify(h))
    }
}
const plugin_remove = (plugin:Plugin) => {
    if(pluginTarget.value == undefined) return
    if(backend.config.haveBackend){
        backend.send("plugin_remove", pluginTarget.value.uuid, JSON.stringify(plugin))
    }else{
        const p = props.manager?.targets.find(x => x.uuid == pluginTarget.value?.uuid)
        const h:Header = { name: 'plugin_remove', data: plugin }
        p?.websocket.send(JSON.stringify(h))
    }
}
const onHotkey = (value:string) => {
    if(value == 'create_node'){
        createNode()
    }
}
//#endregion

onMounted(() => {
    console.log("Node Mounted")
    emitter.on('hotkey', onHotkey)
    emitter.on('updateHandle', serverUpdate)
})

onUnmounted(() => {
    emitter.off('hotkey', onHotkey)
    emitter.off('updateHandle', serverUpdate)
})
</script>

<template>
    <div>
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
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
        <v-data-table :style="{ 'fontSize': preference.font + 'px' }" style="background: transparent" :headers="fields" :items="items_final" show-select v-model="data.selection" item-value="ID">
            <template v-slot:item.state="{ item }">
                <v-chip :color="translate_state_color(item.state)">{{ translate_state(item.state) }}</v-chip>
            </template>
            <template v-slot:item.delay="{ item }">
                {{ item.connection_rate }}
            </template>
            <template v-slot:item.detail="{ item }">
                <v-btn variant="text" icon @click="showplugin(item.uuid)">
                    <v-icon>mdi-puzzle</v-icon>
                </v-btn>
                <v-btn variant="text" icon @click="showinfo(item.uuid)">
                    <v-icon>mdi-information-outline</v-icon>
                </v-btn>
                <v-btn variant="text" icon @click="showconsole(item.uuid)" :disabled="item.state != 1">
                    <v-icon>mdi-console</v-icon>
                </v-btn>
            </template>
        </v-data-table>
        <NodeInfoDialog v-model="data.infoModal" :item="infoTarget" :preference="preference" />
        <NodeShellDialog v-model="data.consoleModal" :backend="backend" :item="consoleTarget" :manager="props.manager" :preference="preference" />
        <NodePluginDialog v-model="data.pluginModal" :backend="backend" :item="pluginTarget" :plugin="props.plugin" :preference="preference"
            @download="plugin_download" @remove="plugin_remove" />
        <DialogBase width="500" v-model="data.connectionModal" class="text-white" :preference="preference">
            <template #title>
                <v-icon>mdi-web</v-icon>
                {{ $t('modal.new-node') }}
            </template>
            <template #text>
                <v-text-field v-model="data.connectionData.url" :autofocus="true" required :label="$t('modal.enter-node-address')"></v-text-field>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" @click="confirmConnection">{{ $t('create') }}</v-btn>
            </template>
        </DialogBase>
        <DialogBase width="500" v-model="data.deleteModal" class="text-white" :preference="preference">
            <template #title>
                <v-icon>mdi-pencil</v-icon>
                {{ $t('modal.delete-node') }}
            </template>
            <template #text>
                <p>{{ $t('modal.delete-node-confirm') }}</p>
                <br />
                <p v-for="(p, i) in data.deleteData">
                    {{ i }}. {{ p }}
                </p>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" @click="data.deleteModal = false">{{ $t('cancel') }}</v-btn>
                <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
            </template>
        </DialogBase>
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
