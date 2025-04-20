<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, Libraries } from '../../interface';
import { i18n } from '../../plugins/i18n';

interface PROPS {
    config: AppConfig
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const props = defineProps<PROPS>()
const data = defineModel<Libraries>()
const emits = defineEmits<{
    (e: 'rename', oldname:string, newname:string): void
    (e: 'save', file:string): void
    (e: 'load', file:string): void
    (e: 'delete', file:string): void
    (e: 'delete-all'): void
}>()
const leftSize = ref(3)
const rightSize = ref(9)
const select = ref([])
const renameData = ref({ oldname: '', name: '' })
const selection = computed(() => data.value!.libs.find(x => select.value.length > 0 && x.name == select.value[0]))
const dirty = ref(false)
const titleError = ref(false)
const renameModal = ref(false)
const errorMessage = ref('')
const openBottom = computed(() => messages.value.length > 0)
const messages:Ref<Array<string>> = ref([])
const search = ref('')

const newname = () => {
    let r = "New Script"
    let count = 0
    while(data.value!.libs.find(x => x.name == r) != undefined){
        count = count + 1
        r = `New Script ${count}`
    }
    return r
}

const execute = () => {
    if(!props.config.isElectron || selection.value == undefined) return
    window.electronAPI.send('lua', selection.value.content)
}

const clean = () => {
    messages.value = []
}

const setdirty = () => {
    dirty.value = true
}

const remove = () => {
    if(selection.value == undefined) return
    emitter?.emit('deleteScript', selection.value!.name)
    data.value!.libs = data.value!.libs.filter(x => x.name != selection.value!.name)
    dirty.value = true
    clean()
}

const rename = () => {
    renameData.value = { oldname: selection.value!.name, name: selection.value!.name }
    renameModal.value = true
    errorMessage.value = ''
    titleError.value = false
}

const luaFeedback = (e:IpcRendererEvent, str:string) => {
    messages.value.push(str)
}

const confirmRename = () => {
    if(renameData.value.name.length == 0){
        errorMessage.value = i18n.global.t('error.title-needed')
        titleError.value = true
        return
    }
    const index = data.value!.libs.findIndex(x => x.name == renameData.value.oldname)
    const newIndex = data.value!.libs.findIndex(x => x.name == renameData.value.name)
    if(index != -1 && newIndex == -1){
        data.value!.libs[index].name = renameData.value.name
        dirty.value = true
        renameModal.value = false
        emitter?.emit('renameScript', { oldname: renameData.value.oldname, newname: renameData.value.name })
    }else{
        errorMessage.value = i18n.global.t('error.title-repeat')
        titleError.value = true
        return
    }
}

const createScript = () => {
    data.value!.libs.push({
        name: newname(),
        content: ""
    })
    dirty.value = true
}

const save = () => {
    dirty.value = false
    if(!props.config.isElectron) return
    data.value?.libs.forEach(x => {
        window.electronAPI.send('save_lib', x.name, JSON.stringify(x, null, 4))
    })
    
}

onMounted(() => {
    if(!props.config.isElectron) return
    window.electronAPI.eventOn('lua-feedback', luaFeedback)
})

onUnmounted(() => {
    if(!props.config.isElectron) return
    window.electronAPI.eventOff('lua-feedback', luaFeedback)
})

</script>

<template>
    <v-container fluid class="ma-0 pa-0" v-if="data != undefined">
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="search"></v-text-field>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createScript" :disabled="select == undefined">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" color="success" @click="execute" v-if="props.config.isElectron" :disabled="selection == undefined">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" color="success" :disabled="!dirty" @click="save">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('save') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" :disabled="selection == undefined" @click="rename">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('rename') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" color="error" :disabled="selection == undefined" @click="remove">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('delete') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <v-row style="height: calc(100vh - 120px)" class="w-100">
            <v-col :cols="leftSize" style="border-right: brown 1px solid;">
                <v-list :items="data.libs" item-title="name" item-value="name" v-model:selected="select"></v-list>
            </v-col>
            <v-col :cols="rightSize">
                <v-card v-if="selection != undefined" no-body bg-variant="dark" border-variant="success" class="text-white mb-3 py-1 px-2 mx-6">
                    <codemirror v-model="selection.content" 
                        style="text-align:left;"
                        :style="{ height: openBottom ? 'calc(50vh - 10px)' : 'calc(100vh - 160px)' }"
                        :autofocus="true"
                        :indent-with-tab="true"
                        :tab-size="2" 
                        :hintOptions="{ completeSingle: false }"
                        mode="text/x-lua"
                        @change="setdirty"/>
                </v-card>
                <div class="text-white text-left px-6" v-if="openBottom" style="height: calc(40vh - 100px); overflow-y: scroll; line-height: 15px;">
                    <div class="float_button text-white" style="z-index: 5;">
                        <v-btn-group>
                            <v-btn color="primary" @click="clean">{{ $t('clear') }}</v-btn>
                        </v-btn-group>
                    </div>
                    <p v-for="(item, i) in messages" :key="i">{{ item }}</p>
                </div>
            </v-col>
        </v-row>
        <v-dialog v-model="renameModal" class="text-white">
            <v-card>
                <v-card-title>
                    {{ $t('modal.rename-parameter') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field :error="titleError" v-model="renameData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
                    <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn color="primary" @click="confirmRename">{{ $t('rename') }}</v-btn>
                </template>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 68vh;
    right: 80px;
}
</style>