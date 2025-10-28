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
import { DATA, Util_Node, PROPS } from './Node';
//#endregion

//#region Data
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
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
const util = new Util_Node(props, data, preference, backend, pluginTarget, selected_node_ids)
//#endregion

//#region Watch
watch(() => data.value.infoModal, () => {
    if(data.value.infoModal){
        if(backend.value.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.infoUUID)
            backend.value.send('resource_start', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.infoUUID)
            const d:Header = { name: 'resource_start', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }else{
        if(backend.value.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.infoUUID)
            backend.value.send('resource_end', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.infoUUID)
            const d:Header = { name: 'resource_end', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }
})
watch(() => data.value.pluginModal, () => {
    if(data.value.pluginModal){
        if(backend.value.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.pluginUUID)
            backend.value.send('resource_start', p?.uuid)
            backend.value.send('plugin_info', p?.uuid)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == data.value.pluginUUID)
            const d:Header = { name: 'resource_start', data: 0 }
            const d2:Header = { name: 'plugin_info', data: 0 }
            p?.websocket.send(JSON.stringify(d))
            p?.websocket.send(JSON.stringify(d2))
        }
    }else{
        if(backend.value.config.haveBackend){
            const p = props.nodes.find(x => x.uuid == data.value.pluginUUID)
            backend.value.send('resource_end', p?.uuid)
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
    if(backend.value.config.haveBackend){
        if(data.value.isquery) return
        data.value.isquery = true
        backend.value.invoke("node_update").then(p => {
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
const selectall = () => {
    data.value.selection = props.nodes.map(x => x.uuid)
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
const onHotkey = (value:string) => {
    if(value == 'create_node'){
        util.createNode()
    }
}
//#endregion

onMounted(() => {
    console.log("Node Mounted")
    emitter.on('updateHandle', serverUpdate)
    emitter.on('hotkey', onHotkey)
})

onUnmounted(() => {
    emitter.off('updateHandle', serverUpdate)
    emitter.off('hotkey', onHotkey)
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
                        <v-btn icon v-bind="props" @click="util.createNode">
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
                        <v-btn icon color='error' v-bind="props" @click="util.deleteNode" :disabled="!hasSelect">
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
                <v-btn variant="text" icon @click="util.showplugin(item.uuid)">
                    <v-icon>mdi-puzzle</v-icon>
                </v-btn>
                <v-btn variant="text" icon @click="util.showinfo(item.uuid)">
                    <v-icon>mdi-information-outline</v-icon>
                </v-btn>
                <v-btn variant="text" icon @click="util.showconsole(item.uuid)" :disabled="item.state != 1">
                    <v-icon>mdi-console</v-icon>
                </v-btn>
            </template>
        </v-data-table>
        <NodeInfoDialog v-model="data.infoModal" :item="infoTarget" :preference="preference" />
        <NodeShellDialog v-model="data.consoleModal" :backend="backend" :item="consoleTarget" :manager="props.manager" :preference="preference" />
        <NodePluginDialog v-model="data.pluginModal" :backend="backend" :item="pluginTarget" :plugin="props.plugin" :preference="preference"
            @download="util.plugin_download" @remove="util.plugin_remove" />
        <DialogBase width="500" v-model="data.connectionModal" class="text-white" :preference="preference">
            <template #title>
                <v-icon>mdi-web</v-icon>
                {{ $t('modal.new-node') }}
            </template>
            <template #text>
                <v-text-field v-model="data.connectionData.url" :autofocus="true" required :label="$t('modal.enter-node-address')"></v-text-field>
            </template>
            <template #action>
                <v-btn class="mt-3" color="primary" @click="util.confirmConnection">{{ $t('create') }}</v-btn>
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
                <v-btn class="mt-3" color="error" @click="util.deleteConfirm">{{ $t('delete') }}</v-btn>
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
