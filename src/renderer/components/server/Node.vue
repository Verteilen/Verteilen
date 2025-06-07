<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuid6 } from 'uuid';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { BusType, ConnectionText, Header, NodeTable, Preference } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { WebsocketManager } from '../../script/socket_manager';
import NodeInfoDialog from '../dialog/NodeInfoDialog.vue';
import NodeShellDialog from '../dialog/NodeShellDialog.vue';
import { BackendProxy } from '../../proxy';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    nodes: Array<NodeTable>
    manager: WebsocketManager | undefined
    backend: BackendProxy
    preference: Preference
}
const props = defineProps<PROPS>()
const deleteModal = ref(false)
const deleteData:Ref<Array<string>> = ref([])
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
const isquery = ref(false)
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
        if(props.backend.config.haveBackend){
            const p = props.nodes.find(x => x.ID == infoUUID.value)
            props.backend.send('resource_start', p?.ID)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == infoUUID.value)
            const d:Header = { name: 'resource_start', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }else{
        if(props.backend.config.haveBackend){
            const p = props.nodes.find(x => x.ID == infoUUID.value)
            props.backend.send('resource_end', p?.ID)
        }else{
            const p = props.manager?.targets.find(x => x.uuid == infoUUID.value)
            const d:Header = { name: 'resource_end', data: 0 }
            p?.websocket.send(JSON.stringify(d))
        }
    }
})

const serverUpdate = () => {
    if(props.backend.config.haveBackend){
        if(isquery.value) return
        isquery.value = true
        props.backend.invoke("node_update").then(p => {
            if(p != undefined) emitter?.emit('updateNode', p)
            selection.value = selection.value.filter(x => props.nodes.map(y => y.ID).includes(x))
            isquery.value = false
        })
    }else{
        const p = props.manager?.server_update()
        if(p != undefined) emitter?.emit('updateNode', p)
        selection.value = selection.value.filter(x => props.nodes.map(y => y.ID).includes(x))
    }
}

const createNode = () => {
    connectionData.value = {url: '127.0.0.1:12080'}
    connectionModal.value = true
}

const deleteConfirm = () => {
    deleteModal.value = false
    deleteData.value.forEach(x => {
        if(props.backend.config.haveBackend){
            props.backend.send('node_delete', x)
            props.backend.send('server_stop', x, 'Manually disconnect')
            props.backend.send('delete_node', x)
        }else{
            props.manager?.server_stop(x, 'Manually disconnect')
        }
    })
}

const deleteNode = () => {
    deleteModal.value = true
    deleteData.value = selected_node_ids.value
}

const selectall = () => {
    selection.value = props.nodes.map(x => x.ID)
}

const confirmConnection = () => {
    connectionModal.value = false
    if(props.backend.config.haveBackend){
        props.backend.send("node_add", `ws://${connectionData.value.url}`, uuid6())
    }else{
        props.manager?.server_start(`ws://${connectionData.value.url}`, uuid6())
    }
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
    if(props.backend.config.haveBackend){
        props.backend.send('shell_open', uuid)
        props.backend.send('shell_folder', uuid, '')
    }else{
        props.manager?.shell_open(uuid)
        props.manager?.shell_folder(uuid, '')
    }
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
        <v-data-table :style="{ 'fontSize': props.preference.font + 'px' }" style="background: transparent" :headers="fields" :items="items_final" show-select v-model="selection" item-value="ID">
            <template v-slot:item.state="{ item }">
                <v-chip :color="translate_state_color(item.state)">{{ translate_state(item.state) }}</v-chip>
            </template>
            <template v-slot:item.delay="{ item }">
                {{ item.connection_rate }}
            </template>
            <template v-slot:item.detail="{ item }">
                <v-btn variant="text" icon @click="showinfo(item.ID)">
                    <v-icon>mdi-information-outline</v-icon>
                </v-btn>
                <v-btn variant="text" icon @click="showconsole(item.ID)" :disabled="item.state != 1">
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
        <NodeShellDialog v-model="consoleModal" :backend="props.backend" :item="consoleTarget" :manager="props.manager" />
        <v-dialog width="500" v-model="deleteModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-pencil</v-icon>
                    {{ $t('modal.delete-node') }}
                </v-card-title>
                <v-card-text>
                    <p>{{ $t('modal.delete-node-confirm') }}</p>
                    <br />
                    <p v-for="(p, i) in deleteData">
                        {{ i }}. {{ p }}
                    </p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn class="mt-3" color="primary" @click="deleteModal = false">{{ $t('cancel') }}</v-btn>
                    <v-btn class="mt-3" color="error" @click="deleteConfirm">{{ $t('delete') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
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
