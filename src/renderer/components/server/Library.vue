<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref, watch, watchEffect } from 'vue';
import { BusType, Libraries, Preference } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { DATA, Util_Lib } from '../../util/lib';
import { BackendProxy } from '../../proxy';

interface PROPS {
    backend: BackendProxy
    preference: Preference
}

const emitter:Emitter<BusType> | undefined = inject('emitter');
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'edit', oldname:string, newname:string): void
    (e: 'save', file:string, data:string, fresh:boolean): void
    (e: 'load', file:string): void
    (e: 'delete', file:string): void
    (e: 'execute-js', content:string):void
}>()
const model = defineModel<Libraries>()
const data:Ref<DATA> = ref({
    leftSize: 3,
    rightSize: 9,
    select: -1,
    createModel: false,
    isEdit: false,
    editData: { name: "" },
    dirty: false,
    types: [],
    titleError: false,
    renameModal: false,
    errorMessage: '',
    messages: [],
    search: '',
})

const openBottom = computed(() => data.value.messages.length > 0)
const selection = computed(() => data.value.select < 0 ? undefined : model.value?.libs[data.value.select])

watch(() => data.value.select, (newv:any, oldv:any) => {
    if(model.value == undefined || oldv == newv) return
    if(oldv && oldv[0] >= 0){
        model.value.libs[oldv].load = false
        model.value.libs[oldv].content = ""
    }
    if(newv && newv[0] >= 0){
        const target = model.value?.libs[data.value.select];
        emits('load', target.name + '.js')
    }
})

const util:Util_Lib = new Util_Lib(data, () => selection.value)

const execute = () => {
    if(selection.value == undefined) return
    emits('execute-js', selection.value.content)
}

const clean = () => {
    data.value.messages = []
}

const setdirty = () => {
    data.value.dirty = true
}

const remove = () => {
    if(selection.value == undefined) return
    model.value?.libs.forEach(x => {
        x.load = false
        x.content = ""
    })
    emits('delete', selection.value!.name + '.js')
    model.value!.libs = model.value!.libs.filter(x => x.name != selection.value!.name)
    data.value.dirty = false
    clean()
    const target = model.value?.libs[data.value.select];
    if(target) emits('load', target.name + '.js')
}

const submit = () => {
    if (data.value.isEdit) confirmEdit()
    else confirmCreate()
}

const javascriptFeedback = (str:string) => {
    data.value.messages.push(str)
}

const confirmCreate = () => {
    if(data.value.editData.name.length == 0){
        data.value.errorMessage = i18n.global.t('error.title-needed')
        data.value.titleError = true
        return
    }
    data.value.createModel = false
    emits('save', data.value.editData.name + '.js' , "", true)
}

const confirmEdit = () => {
    if(selection.value == undefined) return
    if(data.value.editData.name.length == 0){
        data.value.errorMessage = i18n.global.t('error.title-needed')
        data.value.titleError = true
        return
    }
    data.value.createModel = false
    emits('edit', selection.value.name + '.js', 
        data.value.editData.name + '.js')
}

const save = () => {
    if(selection.value == undefined) return
    data.value.dirty = false
    emits('save', selection.value.name + '.js', selection.value.content, false)
}

onMounted(() => {
    props.backend.eventOn('javascript-feedback', javascriptFeedback)
})

onUnmounted(() => {
    props.backend.eventOff('javascript-feedback', javascriptFeedback)
})

</script>

<template>
    <v-container fluid class="ma-0 pa-0" v-if="model != undefined">
        <div class="py-3">
            <v-toolbar density="compact" class="pr-3">
                <v-text-field max-width="400px" class="pl-5" :placeholder="$t('search')" clearable density="compact" prepend-icon="mdi-magnify" hide-details single-line v-model="data.search"></v-text-field>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="util.createScript">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" color="success" v-if="props.backend.config.haveBackend" :disabled="selection == undefined" @click="execute">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" color="success" :disabled="!data.dirty" @click="save">
                            <v-icon>mdi-content-save</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('save') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" :disabled="selection == undefined" @click="util.editScript">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('edit') }}
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
            <v-col :cols="data.leftSize" class="border border-e-lg">
                <v-list :style="{ 'fontSize': props.preference.font + 'px' }" :items="model.libs" v-model:selected="data.select">
                    <v-list-item v-for="(lib, i) in model.libs" :key="i" :value="i">  
                        {{ lib.name }}.js
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col :cols="data.rightSize">
                <v-card v-if="selection" no-body bg-variant="dark" border-variant="success" class="text-white mb-3 py-1 px-2 mx-6">
                    <p>Javascript</p>
                    <codemirror-js v-model="selection.content" 
                        style="text-align:left;"
                        :style="{ height: openBottom ? 'calc(50vh - 10px)' : 'calc(100vh - 160px)' }"
                        :hintOptions="{ completeSingle: false }"
                        @change="setdirty"/>
                </v-card>
                <div class="text-white text-left px-6" v-if="openBottom" style="height: calc(40vh - 100px); overflow-y: scroll; line-height: 15px;">
                    <div class="float_button text-white" style="z-index: 5;">
                        <v-btn-group>
                            <v-btn color="primary" @click="clean">{{ $t('clear') }}</v-btn>
                        </v-btn-group>
                    </div>
                    <p v-for="(item, i) in data.messages" :key="i">{{ item }}</p>
                </div>
            </v-col>
        </v-row>
        <v-dialog v-model="data.createModel" width="500" class="text-white">
            <v-card>
                <v-card-title>
                    {{ $t('modal.create-library') }}
                </v-card-title>
                <v-card-text>
                    <v-text-field class="mb-2" :error="data.titleError" v-model="data.editData.name" required :label="$t('modal.enter-library-name')" hide-details></v-text-field>
                    <p v-if="data.errorMessage.length > 0" class="mt-3 text-red">{{ data.errorMessage }}</p>
                </v-card-text>
                <template v-slot:actions>
                    <v-btn color="primary" @click="submit">{{ $t('confirm') }}</v-btn>
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