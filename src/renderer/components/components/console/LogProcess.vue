<script setup lang="ts">
import { computed } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { AppConfig, ExecuteState, Log, Preference } from '../../../interface';

interface PROPS {
    preference: Preference
    config: AppConfig
    logs: Log
    selection: number
    current: number
    totalLength: number
    panelValue: Array<number>
}

const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'setEnable', index:number):void
    (e: 'update:panelValue', value:Array<number>):void
}>()

const items = computed(() => props.logs.logs.filter(x => x.output))
const getselect = computed(() => items.value.length == 0 ? undefined : items.value[props.selection])
const getselectTask = computed(() => getselect.value == undefined || props.current == -1 ? undefined : getselect.value.logs[props.current])

const getEnable = (r:number):Array<number> => {
    if(getselect.value == undefined || props.current == -1) return []
    const k = props.current % props.totalLength
    const min = (r - 1) * props.totalLength
    const max = Math.min(getselect.value.logs.length, min + props.totalLength)
    return (min <= props.current && max > props.current) ? [k] : []
}

const setEnable = (index:number) => {
    emits('setEnable', index)
}

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.darken3
    else if (state == ExecuteState.FINISH) return colors.green.darken3
    else return colors.red.darken4
}

const page = (r:number):number => {
    if(getselect.value == undefined) return -1
    const length = Math.ceil(getselect.value.project.task.length / props.totalLength)
    if(r != length) return props.totalLength
    else return getselect.value.project.task.length % props.totalLength
}

const getindex = (r:number, i:number):number => {
    return (r - 1) * props.totalLength + (i - 1)
}

const updatePanel = (v:unknown) => {
    emits('update:panelValue', v as Array<number>)
}

</script>

<template>
    <v-container v-if="getselect" class="pt-4" style="max-height: calc(100vh - 150px); overflow-y: auto;">
        <v-card style="background-color: transparent" class="mb-2 pb-2">
            <v-card-title @click="console.log(props.logs, getselect)">
                {{ getselect.project.title }}
            </v-card-title>
            <v-card-subtitle>
                {{ getselect.project.uuid }}
            </v-card-subtitle>
        </v-card>
        <v-stepper style="background-color: transparent" class="my-1"
            :model-value="getEnable(r)" editable v-for="r in Math.ceil(getselect.project.task.length / totalLength)" :key="r" :mandatory="false" multiple>
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
        <v-expansion-panels v-if="getselectTask != undefined" model-value="panelValue" @update:model-value="updatePanel" multiple>
            <v-expansion-panel v-for="(task, i) in getselectTask.task_detail" :key="i" style="background-color: transparent"
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
    </v-container>
</template>