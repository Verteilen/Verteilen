<script setup lang="ts">
import { Emitter } from 'mitt';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { BusType, ExecuteRecord, ExecuteState, Log } from '../../interface';
import { isElectron } from '../../main';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    logs: Log
}

const data = defineModel<ExecuteRecord>()
const props = defineProps<PROPS>()
const leftSize = ref(3)
const rightSize = ref(9)
const totalLength = ref(4)
const current:Ref<number> = ref(-1)
const selection:Ref<Array<number>> = ref([])
const getselect = computed(() => selection.value.length == 0 ? undefined : props.logs.logs[selection.value[0]])
const getselectTask = computed(() => getselect.value == undefined || current.value == -1 ? undefined : getselect.value.logs[current.value])
const panelValue:Ref<Array<number>> = ref([])

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

const updateLog = (log:Log) => {
    if(!isElectron) return
    window.electronAPI.send('save_log', JSON.stringify(log, null, 4))
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
    props.logs.logs = props.logs.logs.filter(x => {
        const c1 = data.value!.projects.length > 0 && data.value!.project_index >= 0 && x.project.uuid == data.value?.projects[data.value?.project_index].uuid
        const c2 = x.start_timer != 0
        const c3 = x.end_timer == 0
        return c1 && c2 && c3
    })
    updateLog(props.logs)
}

onMounted(() => {
    emitter?.on('updateLog', updateLog)
})

onUnmounted(() => {
    emitter?.off('updateLog', updateLog)
})

</script>

<template>
    <b-container fluid>
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <b-button-group class="my-3 w-100">
                    <b-button @click="clean" variant="success">{{ $t('clear') }}</b-button>
                </b-button-group>
                <v-list v-model:selected="selection" @update:selected="current = -1">
                    <v-list-item v-for="(item, i) in props.logs.logs" :key="i" :value="i">
                        <v-list-item-title>
                            {{ $t('project') }}: {{ item.project.title }}    
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ new Date(item.start_timer).toUTCString() }}    
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </b-col>
            <b-col :cols="rightSize" v-if="getselect != undefined">
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
            </b-col>
        </b-row>
    </b-container>
</template>

<style scoped>

</style>
