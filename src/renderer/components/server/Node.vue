<script setup lang="ts">
import { IpcRendererEvent } from 'electron'
import { onMounted, onUnmounted, Ref, ref } from 'vue'
import { NodeTable } from '../../interface'

let updateHandle:any = undefined

const connectionModal = ref(false)
const connectionData = ref({url: ''})
const nodes:Ref<Array<NodeTable>> = ref([])
const fields:Ref<Array<string>> = ref([])
const hasSelect = ref(false)

const serverUpdate = () => {
    window.electronAPI.send('server_update')
}

const createNode = () => {
    connectionModal.value = true
}

const deleteNode = () => {
    nodes.value.filter(x => x.s).map(x => x.ID).map(x => {
        window.electronAPI.send('server_stop', x)
    })
}

const datachange = (uuid:any, v:boolean) => {
    const index = nodes.value.findIndex(x => x.ID == uuid)
    if(index != -1) nodes.value[index].s = v
    hasSelect.value = nodes.value.filter(x => x.s).length > 0;
}

const confirmConnection = () => {
    connectionModal.value = false
    window.electronAPI.invoke('server_start', connectionData.value.url).catch(err => console.error(err))
    connectionData.value = { url: '' }
}

const server_clients_update = (e:IpcRendererEvent, v:Array<NodeTable>) => {
    nodes.value = v
}

onMounted(() => {
    window.electronAPI.eventOn('server_clients_update', server_clients_update)
    fields.value = ['s', 'ID', 'url']
    updateHandle = setInterval(serverUpdate, 1000);
})

onUnmounted(() => {
    window.electronAPI.eventOff('server_clients_update', server_clients_update)
    if(updateHandle != undefined) clearInterval(updateHandle)
})

</script>

<template>
    <div>
        <div class="mt-3">
            <b-button-group>
                <b-button variant='primary' @click="createNode">新增</b-button>
                <b-button variant='danger' @click="deleteNode" :disabled="!hasSelect">斷線</b-button>
            </b-button-group>
        </div>
        <b-table striped hover :items="nodes" :fields="fields">
            <template #cell(s)="data">
                <b-form-checkbox style="float:right;" size="lg" v-model="data.s" @change="v => datachange(data.item.ID, v)"></b-form-checkbox>
            </template>
        </b-table>
        <b-modal title="新增節點" v-model="connectionModal" hide-footer>
            <b-form-input v-model="connectionData.url" required placeholder="輸入節點位址"></b-form-input>
            <b-button class="mt-3" variant="primary" @click="confirmConnection">新增</b-button>
        </b-modal>
    </div>
</template>

<style scoped>

</style>
