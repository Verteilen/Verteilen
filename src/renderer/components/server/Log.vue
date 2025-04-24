<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { AppConfig, BusType, ExecuteRecord, ExecuteState, Log, Parameter, Preference, Project } from '../../interface';
import { i18n } from '../../plugins/i18n';
import { ExecuteManager } from '../../script/execute_manager';
import LogMenuDialog from './../dialog/LogMenuDialog.vue';
import ParameterPage from './console/Parameter.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    execute: Array<[ExecuteManager, ExecuteRecord]>
    preference: Preference
    config: AppConfig
    logs: Log
}

const data = defineModel<[ExecuteManager, ExecuteRecord]>()
const emits = defineEmits<{
    (e: 'clean', index:number):void
}>()
const props = defineProps<PROPS>()
const tag = ref(0)
const recoverDialog = ref(false)
const exportDialog = ref(false)
const leftSize = ref(3)
const rightSize = ref(9)
const totalLength = ref(4)
const holder:Ref<Array<string>> = ref([])
const current:Ref<number> = ref(-1)
const selection:Ref<number> = ref(0)
const panelValue:Ref<Array<number>> = ref([])

const items = computed(() => props.logs.logs.filter(x => x.output))
const getselect = computed(() => items.value.length == 0 ? undefined : items.value[selection.value])
const getselectTask = computed(() => getselect.value == undefined || current.value == -1 ? undefined : getselect.value.logs[current.value])

const getEnable = (r:number):Array<number> => {
    if(getselect.value == undefined || current.value == -1) return []
    const k = current.value % totalLength.value
    const min = (r - 1) * totalLength.value
    const max = Math.min(getselect.value.logs.length, min + totalLength.value)
    return (min <= current.value && max > current.value) ? [k] : []
}

const setEnable = (index:number) => {
    current.value = index
    panelValue.value = []
}

const slowUpdateHandle = () => {
    if(!props.config.isElectron) return
    items.value.filter(x => x.dirty).forEach(x => {
        x.dirty = false
        x.output = undefined
        window.electronAPI.send('save_log', x.uuid, JSON.stringify(x))
        x.output = true
    })
}

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.darken3
    else if (state == ExecuteState.FINISH) return colors.green.darken3
    else return colors.red.darken4
}

const page = (r:number):number => {
    if(getselect.value == undefined) return -1
    const length = Math.ceil(getselect.value.project.task.length / totalLength.value)
    if(r != length) return totalLength.value
    else return getselect.value.project.task.length % totalLength.value
}

const getindex = (r:number, i:number):number => {
    return (r - 1) * totalLength.value + (i - 1)
}

const clean = () => {
    emits('clean', selection.value)
}

const recover = () => {
    if(getselect.value == undefined) return
    const p = getselect.value.project.parameter!.title == undefined ? `${getselect.value.project.title} ${i18n.global.t('parameter')}` : getselect.value.project.parameter!.title
    holder.value = [
        `${getselect.value.project.title} ${i18n.global.t('recover')}`,
        `${p} ${i18n.global.t('recover')}`
    ]
    nextTick(() => recoverDialog.value = true)
}

const exporter = () => {
    exportDialog.value = true
}

const recoverConfirm = (mode:number, _names?:Array<string>) => {
    if(getselect.value == undefined) return
    const names:Array<string> = _names!
    if(mode == 0){
        const p:Project = JSON.parse(JSON.stringify(getselect.value.project))
        p.uuid = uuidv6()
        p.title = names[0]
        p.parameter = getselect.value.parameter
        p.task.forEach(x => {
            x.uuid = uuidv6()
            x.jobs.forEach(y => {
                y.uuid = uuidv6()
            })
        })
        emitter?.emit('recoverProject', p)
    }else{
        const p:Parameter = JSON.parse(JSON.stringify(getselect.value.project.parameter))
        p.uuid = uuidv6()
        p.title = names[1]
        emitter?.emit('recoverParameter', p)
    }
}

const exportConfirm = (mode:number) => {
    if(getselect.value == undefined) return
    const p:Project = JSON.parse(JSON.stringify(getselect.value.project))
    if(!props.config.isElectron) return
    window.electronAPI.send("export_parameter", mode == 0 ? JSON.stringify(p) : JSON.stringify(p.parameter))
    exportDialog.value = false
}

onMounted(() => {
    emitter?.on('slowUpdateHandle', slowUpdateHandle)
})

onUnmounted(() => {
    emitter?.off('slowUpdateHandle', slowUpdateHandle)
})

</script>

<template>
    <v-container fluid class="ma-0 pa-0">
        <div class="py-3">
            <v-toolbar density="compact" class="px-3">
                <p>{{ $t('action') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon color="success" v-bind="pro.props" :disabled="getselect == undefined" @click="recover">
                            <v-icon>mdi-recycle</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('recover') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon v-bind="pro.props" :disabled="getselect == undefined" @click="exporter">
                            <v-icon>mdi-export</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('export') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="pro">
                        <v-btn icon color="error" v-bind="pro.props" @click="clean">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clean') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <v-row style="height: calc(100vh - 120px)" class="w-100">
            <v-col :cols="leftSize" style="border-right: brown 1px solid;">
                <v-list v-model.number="tag" mandatory color="success" style="filter:brightness(1.2)">
                    <v-list-item @click="tag = 0" :value="0" :active="tag == 0">
                        {{ $t('console.dashboard') }}
                    </v-list-item>
                    <v-list-item @click="tag = 1" :value="1" :active="tag == 1">
                        {{ $t('console.parameter') }}
                    </v-list-item>
                </v-list>
                <v-list>
                    <v-list-item v-for="(item, i) in items" :key="i" :value="i" :active="selection == i" @click="selection = i">
                        <template v-slot:prepend>
                            <v-icon color="primary">mdi-book</v-icon>
                        </template>
                        <v-list-item-title>
                            {{ $t('project') }}: {{ item.filename }}    
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ new Date(item.start_timer).toUTCString() }}    
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col :cols="rightSize" style="overflow-y: scroll;height: calc(100vh - 120px)" v-if="tag == 0 && getselect != undefined">
                <v-stepper :model-value="getEnable(r)" editable v-for="r in Math.ceil(getselect.project.task.length / totalLength)" :key="r" :mandatory="false" multiple>
                    <v-stepper-header>
                        <template v-for="i in page(r - 1)" :key="i">
                            <v-divider v-if="i - 1" />
                            <v-stepper-item 
                                @click="setEnable(getindex(r, i))"
                                class="px-4 py-3 my-1"
                                style="background-color: transparent;"
                                :style="{ 'color': getStateColor(getselect.logs[getindex(r, i)]?.task_state.state ?? 0) }"
                                :value="getindex(r, i)"
                                :title="getselect.project.task[getindex(r, i)]?.title ?? ''"
                                :complete="(getselect.logs[getindex(r, i)]?.task_state.state ?? 0) == 2">
                            </v-stepper-item>
                        </template>
                    </v-stepper-header>
                </v-stepper>
                <br /> 
                <v-expansion-panels v-if="getselectTask != undefined" v-model="panelValue" multiple>
                    <v-expansion-panel v-for="(task, i) in getselectTask.task_detail" :key="i"
                        class="w-100 text-white mb-3 px-4">
                        <v-expansion-panel-title :style="{ 'color': getStateColor(task.state) }" style="background-color: transparent;">
                            Index: {{ task.index }}
                        </v-expansion-panel-title>
                        <v-expansion-panel-text class="py-3" style="min-height: 50px;">
                            <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>    
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
                <br /> <br />
            </v-col>
            <v-col :cols="rightSize" style="overflow-y: scroll;height: calc(100vh - 120px)" v-if="tag == 1 && getselect != undefined">
                <ParameterPage v-model="getselect.parameter" :preference="props.preference" />
            </v-col>
        </v-row>
        <LogMenuDialog 
            v-model="recoverDialog" 
            icon="mdi-recycle"
            :label="$t('recover')"
            :preference="props.preference"
            :recover="true"
            :holder="holder"
            @project="e => recoverConfirm(0, e)"
            @parameter="e => recoverConfirm(1, e)" />
        <LogMenuDialog 
            v-model="exportDialog" 
            icon="mdi-export"
            :label="$t('export')"
            :preference="props.preference"
            :recover="false"
            :holder="holder"
            @project="exportConfirm(0)"
            @parameter="exportConfirm(1)" />
    </v-container>
</template>

<style scoped>

</style>
