<script setup lang="ts">
import { computed, ref } from 'vue';
import { libraries } from '../../interface';
import { isElectron } from '../../main';
import { i18n } from '../../plugins/i18n';

const data = defineModel<libraries>()
const leftSize = ref(3)
const rightSize = ref(9)
const select = ref([])
const renameData = ref({ oldname: '', name: '' })
const selection = computed(() => data.value!.libs.find(x => select.value.length > 0 && x.name == select.value[0]))
const dirty = ref(false)
const titleError = ref(false)
const renameModal = ref(false)
const errorMessage = ref('')

const newname = () => {
    let r = "New Script"
    let count = 0
    while(data.value!.libs.find(x => x.name == r) != undefined){
        count = count + 1
        r = `New Script ${count}`
    }
    return r
}

const setdirty = () => {
    dirty.value = true
}

const remove = () => {
    if(selection.value == undefined) return
    data.value!.libs = data.value!.libs.filter(x => x.name != selection.value!.name)
    dirty.value = true
}

const rename = () => {
    renameData.value = { oldname: selection.value!.name, name: selection.value!.name }
    renameModal.value = true
    errorMessage.value = ''
    titleError.value = false
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

</script>

<template>
    <b-container fluid v-if="data != undefined">
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <div class="py-3">
                    <b-button-group class="w-100">
                        <b-button variant='primary' @click="createScript">{{ $t('create') }}</b-button>
                        <b-button variant='success' @click="save" :disabled="!dirty">{{ $t('save') }}</b-button>
                    </b-button-group>
                </div>
                <v-list :items="data.libs" item-title="name" item-value="name" v-model:selected="select">
                    
                </v-list>
            </b-col>
            <b-col :cols="rightSize" v-if="selection != undefined">
                <div class="py-3">
                    <b-button-group>
                        <b-button variant='primary' @click="rename">{{ $t('rename') }}</b-button>
                        <b-button variant='danger' @click="remove">{{ $t('delete') }}</b-button>
                    </b-button-group>
                </div>
                <b-card no-body bg-variant="dark" border-variant="success" class="text-white mb-3 py-1 px-2 mx-6">
                    <codemirror v-model="selection.content" 
                        style="text-align:left;"
                        :style="{ height: 'calc(100vh - 100px)' }"
                        :autofocus="true"
                        :indent-with-tab="true"
                        :tab-size="2" 
                        :hintOptions="{ completeSingle: false }"
                        mode="text/x-lua"
                        @change="setdirty"/>
                </b-card>
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

</style>