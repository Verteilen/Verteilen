<script setup lang="ts">
import byteSize from 'byte-size';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { AppConfig, BusType, ConnectionText, Header, NodeTable, Single } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { WebsocketManager } from '../../script/socket_manager';

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
const consoleCommand = ref('')
const consoleMessages:Ref<Array<string>> = ref([])
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
    consoleMessages.value = []
    consoleUUID.value = uuid
    props.manager?.shell_open(uuid)
}

const closeConsole = () => {
    consoleModal.value = false
    props.manager?.shell_close(consoleUUID.value)
}

const sendCommand = () => {
    if(consoleCommand.value.length == 0) return
    props.manager?.shell_enter(consoleUUID.value, consoleCommand.value)
    consoleCommand.value = ""
}

const shellReply = (data:Single) => {
    consoleMessages.value.push(data.data.toString())
}

onMounted(() => {
    emitter?.on('updateHandle', serverUpdate)
    emitter?.on('shellReply', shellReply)
})

onUnmounted(() => {
    emitter?.off('updateHandle', serverUpdate)
    emitter?.off('shellReply', shellReply)
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
        <v-dialog width="500" v-model="infoModal" class="text-white">
            <v-card>
                <v-card-title v-if="infoTarget != undefined && infoTarget.system != undefined">
                    <v-icon>mdi-information</v-icon>
                    {{ infoTarget.ID }}
                </v-card-title>
                <v-card-text v-if="infoTarget != undefined && infoTarget.system != undefined">
                    <details>
                        <summary>SYSTEM</summary>
                        <div>
                            <p>NAME: {{ infoTarget.system.system_name }}</p>
                            <p>PLATFORM: {{ infoTarget.system.platform }}</p>
                            <p>ARCH: {{ infoTarget.system.arch }}</p>
                        </div>
                    </details>
                    <details>
                        <summary>CPU</summary>
                        <div>
                            <p>CPU: {{ infoTarget.system.cpu_name }}, Core: {{ infoTarget.system.cpu_core }}</p>
                            <p>CPU Usage: {{ Math.round(infoTarget.system.cpu_usage * 100) / 100 }} %</p>
                        </div>
                    </details>
                    <details>
                        <summary>RAM</summary>
                        <div>
                            <p>RAM: {{ byteSize(infoTarget.system.ram_usage).value }} {{ byteSize(infoTarget.system.ram_usage).unit }} / {{ byteSize(infoTarget.system.ram_total).value }} {{ byteSize(infoTarget.system.ram_total).unit }}</p>
                            <p>RAM Usage: {{ Math.round((infoTarget.system.ram_usage / infoTarget.system.ram_total) * 10000) / 100 }} %</p>
                        </div>
                    </details>
                    <details>
                        <summary>DISK</summary>
                        <details v-for="(item, i) in infoTarget.system.disk" :key="i">
                            <summary>{{ item.disk_name }}  {{ item.disk_type }}</summary>
                            <div>
                                <p>DISK: {{ byteSize(item.disk_usage).value }} {{ byteSize(item.disk_usage).unit }} / {{ byteSize(item.disk_total).value }} {{ byteSize(item.disk_total).unit }}</p>
                                <p>DISK Usage: {{ Math.round(item.disk_percentage * 100) / 100 }} %</p>
                            </div>
                        </details>
                    </details>
                    <details>
                        <summary>NETWORK</summary>
                        <details v-for="(item, i) in infoTarget.system.net" :key="i">
                            <summary>{{ item.net_name }}</summary>
                            <div>
                                <p>Update: {{ item.upload }}</p>
                                <p>Download: {{ item.download }}</p>
                            </div>
                        </details>
                    </details>
                    <details>
                        <summary>GPU</summary>
                        <details v-for="(item, i) in infoTarget.system.gpu" :key="i">
                            <summary>{{ item.gpu_name }}</summary>
                            <div> </div>
                        </details>
                    </details>
                </v-card-text>
            </v-card>
        </v-dialog>
        <v-dialog persistent width="90vw" v-model="consoleModal" class="text-white">
            <v-card>
                <v-card-title>
                    <v-icon>mdi-console</v-icon>
                    {{ consoleUUID }}
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="4">

                        </v-col>
                        <v-col cols="8">
                            <div style="height: 50vh; overflow-y: scroll; font-size: 12px;" class="mb-1">
                                <p v-for="(c, i) in consoleMessages" :key="i">{{ c }}</p>
                            </div>
                            <v-text-field hide-details density="compact" v-model="consoleCommand" @keydown.enter="sendCommand"></v-text-field>        
                        </v-col>
                    </v-row>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn color="danger" @click="closeConsole">
                        {{ $t('close') }}
                    </v-btn>
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
