<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, Libraries } from '../../interface';
import { isElectron } from '../../main';
import { i18n } from '../../plugins/i18n';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const data = defineModel<Libraries>()
const emits = defineEmits<{
    (e: 'rename', oldname:string, newname:string): void
    (e: 'delete', uuids:string): void
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
    if(!isElectron || selection.value == undefined) return
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
    if(!isElectron) return
    window.electronAPI.send('save_lib', JSON.stringify(data.value!, null, 4))
}

onMounted(() => {
    if(!isElectron) return
    window.electronAPI.eventOn('lua-feedback', luaFeedback)
})

onUnmounted(() => {
    if(!isElectron) return
    window.electronAPI.eventOff('lua-feedback', luaFeedback)
})

</script>

<template>
    <b-container fluid v-if="data != undefined">
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <div class="py-3">
                    <b-button-group class="w-100">
                        <b-button variant='primary' @click="createScript">{{ $t('create') }}</b-button>
                    </b-button-group>
                </div>
                <v-list :items="data.libs" item-title="name" item-value="name" v-model:selected="select">
                    
                </v-list>
            </b-col>
            <b-col :cols="rightSize">
                <div class="py-3">
                    <b-button-group>
                        <b-button v-if="isElectron" :disabled="selection == undefined" variant='primary' @click="execute">{{ $t('execute') }}</b-button>
                        <b-button variant='success' :disabled="!dirty" @click="save">{{ $t('save') }}</b-button>
                        <b-button variant='primary' :disabled="selection == undefined" @click="rename">{{ $t('rename') }}</b-button>
                        <b-button variant='danger' :disabled="selection == undefined" @click="remove">{{ $t('delete') }}</b-button>
                    </b-button-group>
                </div>
                <b-card v-if="selection != undefined" no-body bg-variant="dark" border-variant="success" class="text-white mb-3 py-1 px-2 mx-6">
                    <codemirror v-model="selection.content" 
                        style="text-align:left;"
                        :style="{ height: openBottom ? 'calc(50vh)' : 'calc(100vh - 150px)' }"
                        :autofocus="true"
                        :indent-with-tab="true"
                        :tab-size="2" 
                        :hintOptions="{ completeSingle: false }"
                        mode="text/x-lua"
                        @change="setdirty"/>
                </b-card>
                <div class="text-white text-left px-6" v-if="openBottom" style="height: calc(40vh - 100px); overflow-y: scroll; line-height: 15px;">
                    <div class="float_button text-white" style="z-index: 5;">
                        <b-button-group>
                            <b-button variant="primary" @click="clean">{{ $t('clear') }}</b-button>
                        </b-button-group>
                    </div>
                    <p v-for="(item, i) in messages" :key="i">{{ item }}</p>
                </div>
            </b-col>
        </b-row>
        <b-modal :title="$t('modal.rename-parameter')" v-model="renameModal" hide-footer class="text-white" header-bg-variant="dark" header-text-variant="light" body-bg-variant="dark" body-text-variant="light" footer-text-variant="dark" footer-body-variant="light">
            <v-text-field :error="titleError" v-model="renameData.name" required :label="$t('modal.enter-parameter-name')" hide-details></v-text-field>
            <b-button class="mt-3" variant="primary" @click="confirmRename">{{ $t('rename') }}</b-button>
            <p v-if="errorMessage.length > 0" class="mt-3 text-red">{{ errorMessage }}</p>
        </b-modal>
    </b-container>
</template>

<style scoped>
.float_button{
    position: fixed;
    top: 70vh;
    right: 80px;
}
</style>