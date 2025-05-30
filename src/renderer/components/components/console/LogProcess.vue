<script setup lang="ts">
import { computed, Ref, ref, watch } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { AppConfig, ExecuteState, Log, Preference, SCROLL_LIMIT } from '../../../interface';

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
const myDiv:Ref<HTMLDivElement | null> = ref(null);
const start = ref(0)
const end = ref(0)
const gap = ref(0)

const items = computed(() => props.logs.logs.filter(x => x.output))
const getselect = computed(() => items.value.length == 0 ? undefined : items.value[props.selection])
const getselectTask = computed(() => getselect.value == undefined || props.current == -1 ? undefined : getselect.value.logs[props.current])

const current_range = computed(() => {
    if(props.logs.logs?.[1] == undefined) return
    return props.logs.logs[1].logs[props.current].task_detail.slice(start.value, end.value)
})
watch(() => props.current, () => {
    start.value = 0
    end.value = 0
    gap.value = 0
})
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

const load = async (o:any) => {
    if(getselectTask.value == undefined) return
    if(o.side == "start"){
        if(start.value == 0){
            o.done('ok')
        }else{
            start.value -= SCROLL_LIMIT
            gap.value += 1

            if(gap.value >= 3) {
                end.value -= SCROLL_LIMIT
                gap.value -= 1
            }
            if(start.value < 0) start.value = 0;
            myDiv.value?.scrollTo(0, myDiv.value?.scrollTop + SCROLL_LIMIT * 10);
            o.done('ok')
        }
    }
    else if (o.side == "end"){
        const size = getselectTask.value.task_detail.length
        if(end.value == size){
            o.done('ok')
        }else{
            end.value += SCROLL_LIMIT
            gap.value += 1

            if(gap.value >= 3) {
                start.value += SCROLL_LIMIT
                gap.value -= 1
            }
            if(end.value > size) end.value = size;
            myDiv.value?.scrollTo(0, myDiv.value?.scrollTop - SCROLL_LIMIT * 10);
            o.done('ok')
        }
    }
    else{
        o.done('error')
    }
}

</script>

<template>
    <v-container v-if="getselect" class="pt-4" style="max-height: calc(100vh - 150px);">
        <div ref="myDiv" style="max-height: calc(100vh - 150px); overflow-y: auto;">
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
            <v-infinite-scroll v-if="getselectTask" :key="getselect.uuid + current" :items="current_range" style="overflow-y: hidden;" @load="load" class="w-100 h-100" side="both">
                <template v-slot:empty></template>
                <template v-slot:load-more></template>
                <template v-slot:loading></template>
                <template v-for="(item, index) in current_range" :key="index">
                    <details
                        style="background-color: transparent;"
                        class="w-100 text-white mb-3 px-4 text-left">
                        <summary :style="{ 'color': getStateColor(item.state), 'fontSize': props.preference.font + 'px' }" style="background-color: transparent">
                            Index: {{ item.index }}
                        </summary>
                        <div class="py-3" style="min-height: 50px;" :style="{ 'fontSize': props.preference.font + 'px', 'line-height': props.preference.font + 'px' }">
                            <p style="margin: 3px; text-align: left;" v-for="(text, j) in item.message" :key="j"> {{ text }} </p>    
                        </div>
                    </details>
                </template>
            </v-infinite-scroll>
            <br /> <br />
        </div>
    </v-container>
</template>