<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { BusType, ExecuteRecord, ExecuteState, Preference, Task } from '../../../interface';
import { WebsocketManager } from '../../../script/socket_manager';

interface PROPS {
    preference: Preference
    socket: WebsocketManager | undefined
}

const emitter:Emitter<BusType> | undefined = inject('emitter');

const data = defineModel<ExecuteRecord>()
const props = defineProps<PROPS>()
const totalLength = ref(4)
const panelValue:Ref<Array<number>> = ref([])

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.lighten1
    else if (state == ExecuteState.RUNNING) return colors.blue.lighten1
    else if (state == ExecuteState.FINISH) return colors.green.lighten2
    else return colors.red.lighten2
}

const getURL = (id: string) => {
    if(props.socket == undefined) return `unknowned id: ${id}`
    const t = props.socket.targets.find(x => x.uuid == id)
    if(t == undefined) return `unknowned id: ${id}`
    return t.websocket.url
}

const page = (r:number):number => {
    const length = Math.ceil(data.value!.task_state.length / totalLength.value)
    if(r != length) return totalLength.value
    else return data.value!.task_state.length % totalLength.value
}

const getindex = (r:number, i:number):number => {
    return (r - 1) * totalLength.value + (i - 1)
}

const getselect = (r:number):Array<number> => {
    const select = data.value!.task_index
    if (r - 1 >= select && (r - 1) * totalLength.value - 1 <= select) return [select % data.value!.task_state.length]
    else return []
}

const ExecuteSubtaskStart = (d:[Task, number, string]) => {
    nextTick(() => {
        const v = !panelValue.value.includes(d[1])
        if(v) panelValue.value.push(d[1])
    })
}

const ExecuteSubtaskFinish = (d:[Task, number, string]) => {
    nextTick(() => {
        const v = panelValue.value.findIndex(x => x == d[1])
        if(v != -1) panelValue.value.splice(v, 1)
    })
}

const ExecuteTaskStart = (d:[Task, number]) => {
    nextTick(() => {
        panelValue.value = []
    })
}

onMounted(() => {
    emitter?.on('executeSubtaskStart', ExecuteSubtaskStart)
    emitter?.on('executeSubtaskFinish', ExecuteSubtaskFinish)
    emitter?.on('executeTaskStart', ExecuteTaskStart)
})

onUnmounted(() => {
    emitter?.off('executeSubtaskStart', ExecuteSubtaskStart)
    emitter?.off('executeSubtaskFinish', ExecuteSubtaskFinish)
    emitter?.off('executeTaskStart', ExecuteTaskStart)
})

</script>

<template>
    <v-container v-if="data != undefined" class="pt-4" style="max-height: calc(100vh - 150px); overflow-y: auto;">
        <v-card v-if="data.project_index >= 0">
            <v-card-title :style="{ 'fontSize': (props.preference.font + 6) + 'px' }">
                {{ $t('project') }}: {{ data.projects[data.project_index]?.title }}
            </v-card-title>
            <v-card-text>
                <p :style="{ 'fontSize': props.preference.font + 'px' }">{{ $t('is-running') }}: 
                    <v-icon v-if="data.running" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                    <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                </p>
                <p :style="{ 'fontSize': props.preference.font + 'px' }">{{ $t('is-stop') }}:
                    <v-icon v-if="data.stop" color="success" icon="mdi-checkbox-marked-circle" end ></v-icon>
                    <v-icon v-else color="danger" icon="mdi-cancel" end ></v-icon>
                </p>
            </v-card-text>
        </v-card>
        <v-stepper v-if="data.project_index >= 0" :value="getselect(r)" v-for="r in Math.ceil(data.task_state.length / totalLength)" :key="r" :mandatory="false" multiple>
            <v-stepper-header>
                <template v-for="i in page(r - 1)" :key="i">
                    <v-divider v-if="i - 1" />
                    <v-stepper-item 
                        class="px-4 py-3 my-1"
                        :disabled="true"
                        style="background-color: transparent"
                        :style="{ 'color': getStateColor(data.task_state[getindex(r, i)]?.state ?? 0), 'fontSize': props.preference.font + 'px' }"
                        :value="getindex(r, i)"
                        :title="data.projects[data.project_index]?.task[getindex(r, i)]?.title ?? ''"
                        :complete="data.task_state[getindex(r, i)]?.state == 2">
                    </v-stepper-item>
                </template>
            </v-stepper-header>
        </v-stepper>
        <br /> 
        <v-expansion-panels v-if="data.project_index >= 0" v-model="panelValue" multiple>
            <v-expansion-panel v-for="(task, i) in data.task_detail" :key="i"
                class="w-100 text-white mb-3 px-4">
                <v-expansion-panel-title :style="{ 'color': getStateColor(task.state), 'fontSize': props.preference.font + 'px' }" style="background-color: transparent;">
                    Index: {{ task.index }}, node: {{ getURL(task.node) }}
                </v-expansion-panel-title>
                <v-expansion-panel-text class="py-3" style="min-height: 50px;" :style="{ 'fontSize': props.preference.font + 'px' }">
                    <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>    
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
        <br /> <br />
    </v-container>
</template>

<style scoped>

</style>
