<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch } from 'vue'
import { BusType, NodeTable, Preference, ShellFolder, Single, Execute_SocketManager } from '../../interface'
import { BackendProxy } from '../../proxy'
import { i18n } from 'verteilen-core/src/plugins/i18n'
//#region 

//#region Views
import DialogBase from './DialogBase.vue'
//#endregion

//#region Data
interface PROPS {
    item: NodeTable | undefined
    manager: Execute_SocketManager.WebsocketManager | undefined
}
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject('backend')!
const preference:Ref<Preference> = inject('preference')!
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const props = defineProps<PROPS>()
const modal = defineModel<boolean>({ required: true })
const consoleCommand = ref('')
const consoleMessages:Ref<Array<string>> = ref([])
const path = ref('')
const folders:Ref<ShellFolder | undefined> = ref(undefined)
const histroy:Ref<Array<string>> = ref([])
const cursor = ref(0)
//#endregion

//#region Computed
const folderContent = computed(() => {
    if(folders.value == undefined) return []
    return [
        ...folders.value.folders.map(x => ({ value: x, icon: 'mdi-folder', type: 0 })), 
        ...folders.value.files.map(x => ({ value: x, icon: 'mdi-file', type: 1 }))
    ]
})
//#endregion

//#region Watch
watch(() => modal.value, () => {
    consoleCommand.value = ''
    consoleMessages.value = []
})
//#endregion

//#region Methods
const splitS = () => {
    const w = path.value.includes('\\')
    return w ? "\\" : "/"
}
const closeConsole = () => {
    if(props.item == undefined) return
    modal.value = false
    if(backend.value.config.haveBackend){
        backend.value.send("shell_close", props.item.uuid)
    }else{
        props.manager?.shell_close(props.item.uuid)
    }
}
const cleanConsole = () => {
    consoleMessages.value = []
}
const sendCommand = () => {
    if(consoleCommand.value.length == 0 || props.item == undefined) return
    if(consoleCommand.value == "cls" || consoleCommand.value == "clear"){
        cleanConsole()
        consoleCommand.value = ""
        return
    }
    if(backend.value.config.haveBackend){
        backend.value.send("shell_enter", props.item.uuid, consoleCommand.value)
    }else{
        props.manager?.shell_enter(props.item.uuid, consoleCommand.value)
    }
    histroy.value.push(consoleCommand.value)
    cursor.value = histroy.value.length - 1
    consoleCommand.value = ""
}
const check_up = () => {
    cursor.value -= 1
    if(cursor.value < 0) cursor.value = 0
    consoleCommand.value = histroy.value[cursor.value]
}
const check_down = () => {
    cursor.value += 1
    if(cursor.value >= histroy.value.length) cursor.value = histroy.value.length - 1
    consoleCommand.value = histroy.value[cursor.value]
}
const shellReply = (data:Single) => {
    consoleMessages.value.push(data.data.toString())
    setTimeout(() => {
        myDiv.value?.scrollTo(0, myDiv.value?.scrollHeight);
    }, 10);
}
const folderReply = (data:ShellFolder) => {
    folders.value = data
    path.value = data.path
}
const enterPath = () => {
    if(props.item == undefined) return
    if(backend.value.config.haveBackend){
        backend.value.send("shell_folder", props.item.uuid, path.value)
    }else{
        props.manager?.shell_folder(props.item.uuid, path.value)
    }
}
const lastFolder = () => {
    const p = path.value.split(splitS()).reverse()
    p.shift()
    path.value = p.reverse().join(splitS())
    enterPath()
}
const enterFolder = (v:string) => {
    path.value = path.value + splitS() + v
    enterPath()
}
//#endregion

onMounted(() => {
    emitter.on('shellReply', shellReply)
    emitter.on('folderReply', folderReply)
})

onUnmounted(() => {
    emitter.off('shellReply', shellReply)
    emitter.off('folderReply', folderReply)
})

</script>

<template>
    <DialogBase persistent width="90vw" v-model="modal" class="text-white" :preference="preference">
        <template #title>
            <v-icon>mdi-console</v-icon>
            {{ item?.uuid }}
        </template>
        <template #text>
            <v-row>
                <v-col cols="5">
                    <v-row>
                        <v-col cols="1">
                            <v-btn class="w-100" variant="text" icon="mdi-arrow-left" @click="lastFolder">
                            </v-btn>
                        </v-col>
                        <v-col cols="11">
                            <v-text-field class="mb-2" hide-details density="compact" v-model="path" @keydown.enter="enterPath"></v-text-field>        
                        </v-col>
                    </v-row>
                    <v-list style="height: 50vh; overflow-y: scroll;" :items="folderContent">
                        <v-list-item
                            v-for="(item, i) in folderContent"
                            density="compact"
                            :key="i"
                            :title="item.value"
                        >
                            <template v-slot:prepend>
                                <v-icon>{{ item.icon }}</v-icon>
                            </template>
                            <template v-slot:append>
                                <v-btn variant="text" icon="mdi-arrow-right" hide-details size="sm" rounded v-if="item.type == 0" @click="enterFolder(item.value)">
                                </v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-col>
                <v-col cols="7" style="background-color: black; color:#00FF00">
                    <div style="height: 50vh; overflow-y: scroll; font-size: 12px;" class="mb-1" ref="myDiv">
                        <p v-for="(c, i) in consoleMessages" :key="i">{{ c }}</p>
                    </div>
                    <v-row>
                        <v-col cols="10">
                            <v-text-field @keydown.up="check_up" @keydown.down="check_down" hide-details density="compact" v-model="consoleCommand" @keydown.enter="sendCommand"></v-text-field>        
                        </v-col>
                        <v-col cols="2">
                            <v-btn class="mt-2 w-100" @click="cleanConsole">{{ $t('clean') }}</v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>
        </template>
        <template #action>
            <v-btn color="error" @click="closeConsole">
                {{ $t('close') }}
            </v-btn>
        </template>
    </DialogBase>
</template>