<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/lib/util/colors.mjs';
import { AppConfig, BusType, ConditionResult, ExecuteRecord, ExecuteState, ExecutionLog, FeedBack, Job, JobCategory, Log, Parameter, Preference, Project, Record, Task } from '../../interface';
import { ExecuteManager } from '../../script/execute_manager';
import ParameterPage from './console/Parameter.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    execute: ExecuteManager | undefined
    preference: Preference
    config: AppConfig
}

const tag = ref(0)
const data = defineModel<ExecuteRecord>()
const props = defineProps<PROPS>()
const logs:Ref<Log> = ref({logs: []})
const task_index = ref(0)
const leftSize = ref(3)
const rightSize = ref(9)
const totalLength = ref(4)
const current:Ref<number> = ref(-1)
const selection:Ref<number> = ref(0)
const panelValue:Ref<Array<number>> = ref([])

const getselect = computed(() => logs.value.logs.length == 0 ? undefined : logs.value.logs[selection.value])
const getselectTask = computed(() => getselect.value == undefined || current.value == -1 ? undefined : getselect.value.logs[current.value])

const getEnable = (r:number):Array<number> => {
    if(getselect.value == undefined || current.value == -1) return []
    const k = current.value % totalLength.value
    const min = (r - 1) * totalLength.value
    const max = Math.min(getselect.value.logs.length, min + totalLength.value)
    return (min <= current.value && max > current.value) ? [k] : []
}

const getnewname = async (name:string) => {
    if(!props.config.isElectron) return name
    const root = "data/log"
    let count = 0
    let filename = name
    let p = `${root}/${filename}`
    while(await window.electronAPI.invoke('exist', p + ".json")){
        count = count + 1
        filename = `${name} ${count}`
        p = `${root}/${filename}`
    }
    return filename
}

const setEnable = (index:number) => {
    current.value = index
    panelValue.value = []
}

const slowUpdateHandle = () => {
    if(!props.config.isElectron) return
    logs.value.logs.filter(x => x.dirty && x.output).forEach(x => {
        x.dirty = false
        x.output = undefined
        window.electronAPI.send('save_log', x.filename, JSON.stringify(x))
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
    if(!props.config.isElectron) return
    window.electronAPI.send('delete_all_log')
    logs.value.logs = []
}

const recover = () => {
    if(getselect.value == undefined) return
    const p:Project = JSON.parse(JSON.stringify(getselect.value.project))
    p.uuid = uuidv6()
    p.title = p.title + " (恢復)"
    p.parameter = getselect.value.parameter
    p.task.forEach(x => {
        x.uuid = uuidv6()
        x.jobs.forEach(y => {
            y.uuid = uuidv6()
        })
    })
    emitter?.emit('recoverProject', p)
}

const receivedPack = async (record:Record) => {
    task_index.value = 0
    const target = data.value!.projects[data.value!.project_index]
    const title = await getnewname(target.title)
    const newlog:ExecutionLog = {
        filename: title,
        dirty: true,
        output: props.preference.log,
        project: target,
        parameter: target.parameter,
        state: ExecuteState.NONE,
        start_timer: Date.now(),
        end_timer: 0,
        logs: target.task.map(x => {
            return {
                start_timer: 0,
                end_timer: 0,
                task_state: {
                    uuid: x.uuid,
                    state: ExecuteState.NONE
                },
                task_detail: []
            }
        })
    }
    logs.value.logs = [newlog].concat(logs.value.logs)
}

const feedback_message = (d:FeedBack) => {
    if(!props.preference.log) return
    if(d.index == undefined || d.index == -1) return
    if(!props.preference.log) return
    if(logs.value.logs[0].logs[task_index.value].task_detail.length > d.index){
        logs.value.logs[0].logs[task_index.value].task_detail[d.index].message.push(d.message)
        logs.value.logs[0].dirty = true
    }else{
        console.warn("Try access message by index but failed: ", d)
    }
}

const execute_project_start = async (d:Project) => {
    if(!props.preference.log) return
    const target = data.value!.projects[data.value!.project_index]
    const title = await getnewname(target.title)
    const newlog:ExecutionLog = {
        filename: title,
        dirty: true,
        output: props.preference.log,
        project: target,
        state: ExecuteState.RUNNING,
        start_timer: Date.now(),
        parameter: d.parameter,
        end_timer: 0,
        logs: target.task.map(x => {
            return {
                start_timer: 0,
                end_timer: 0,
                task_state: {
                    uuid: x.uuid,
                    state: ExecuteState.NONE
                },
                task_detail: []
            }
        })
    }

    if(!props.preference.log) return
    logs.value.logs = [newlog].concat(logs.value.logs)
}

const execute_project_finish = (d:Project) => {
    if(!props.preference.log) return
    logs.value.logs[0].state = ExecuteState.FINISH
    logs.value.logs[0].end_timer = Date.now()
    logs.value.logs[0].dirty = true
}

const execute_task_start = (d:[Task, number]) => {
    if(!props.preference.log) return
    const index = logs.value.logs[0].project.task.findIndex(x => x.uuid == d[0].uuid)
    if(index == -1) return
    task_index.value = index
    logs.value.logs[0].logs[task_index.value].task_detail = []

    const p = data.value!.projects[data.value!.project_index]
    const t = p.task[task_index.value]
    const count = props.execute!.get_task_state_count(p, t)
    
    for(let i = 0; i < count; i++){
        logs.value.logs[0].logs[task_index.value].task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
    }

    if(!props.preference.log) return
    if(logs.value.logs[0].logs.length > task_index.value){
        logs.value.logs[0].logs[task_index.value].task_state.state = ExecuteState.RUNNING
        logs.value.logs[0].logs[task_index.value].start_timer = Date.now()
        logs.value.logs[0].dirty = true
    }
}

const execute_task_finish = (d:Task) => {
    if(!props.preference.log) return
    if(logs.value.logs[0].logs.length > task_index.value){
        logs.value.logs[0].logs[task_index.value].task_state.state = ExecuteState.FINISH
        logs.value.logs[0].logs[task_index.value].end_timer = Date.now()
        logs.value.logs[0].dirty = true
    }
}

const execute_subtask_start = (d:[Task, number, string]) => {
    if(!props.preference.log) return
    if(logs.value.logs[0].logs[task_index.value].task_detail.length > d[1]){
        logs.value.logs[0].logs[task_index.value].task_detail[d[1]].state = ExecuteState.RUNNING
        logs.value.logs[0].dirty = true
    }
}

const execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
    if(!props.preference.log) return
    if(logs.value.logs[0].logs[task_index.value].task_detail.length > d[1]){
        logs.value.logs[0].logs[task_index.value].task_detail[d[1]].state = d[3]
        logs.value.logs[0].dirty = true
    }
}

const execute_subtask_end = (d:[Task, number, string]) => {
    if(!props.preference.log) return
    if(logs.value.logs[0].logs[task_index.value].task_detail.length > d[1]){
        logs.value.logs[0].logs[task_index.value].task_detail[d[1]].state = ExecuteState.FINISH
        logs.value.logs[0].dirty = true
    }
}

const execute_job_start = (d:[Job, number, string]) => {

}

const execute_job_finish = (d:[Job, number, string, number]) => {
    if(!props.preference.log) return
    if (d[3] == 1){
        const currentLog = logs.value.logs[0]
        const task = currentLog.project.task[task_index.value]
        const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
        if(index != -1 && task.jobs[index].category == JobCategory.Condition){
            const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
            if(cr == ConditionResult.None) return
            const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
            currentLog.logs[task_index.value].task_detail[d[1]].state = state
            currentLog.logs[task_index.value].task_state.state = state
            if (cr == ConditionResult.Pause) return
            if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                currentLog.state = state
            }
        }
    }
}

const update_runtime_parameter = (d:Parameter) => {
    if(logs.value.logs.length > 0) {
        logs.value.logs[0].parameter = d
        logs.value.logs[0].dirty = true
    }
}

onMounted(() => {
    emitter?.on('slowUpdateHandle', slowUpdateHandle)
    emitter?.on('execute', receivedPack)
    emitter?.on('feedbackMessage', feedback_message)
    emitter?.on('executeProjectStart', execute_project_start)
    emitter?.on('executeProjectFinish', execute_project_finish)
    emitter?.on('executeTaskStart', execute_task_start)
    emitter?.on('executeTaskFinish', execute_task_finish)
    emitter?.on('executeSubtaskStart', execute_subtask_start)
    emitter?.on('executeSubtaskUpdate', execute_subtask_update)
    emitter?.on('executeSubtaskFinish', execute_subtask_end)
    emitter?.on('executeJobStart', execute_job_start)
    emitter?.on('executeJobFinish', execute_job_finish)
    emitter?.on('updateRuntimeParameter', update_runtime_parameter)

    if(props.config.isElectron){
        window.electronAPI.invoke('load_all_log').then(x => {
            const stringlist:Array<string> = JSON.parse(x)
            logs.value.logs = stringlist.map(x => JSON.parse(x))
        })
    }
})

onUnmounted(() => {
    emitter?.off('slowUpdateHandle', slowUpdateHandle)
    emitter?.off('execute', receivedPack)
    emitter?.off('feedbackMessage', feedback_message)
    emitter?.off('executeProjectStart', execute_project_start)
    emitter?.off('executeProjectFinish', execute_project_finish)
    emitter?.off('executeTaskStart', execute_task_start)
    emitter?.off('executeTaskFinish', execute_task_finish)
    emitter?.off('executeSubtaskStart', execute_subtask_start)
    emitter?.off('executeSubtaskUpdate', execute_subtask_update)
    emitter?.off('executeSubtaskFinish', execute_subtask_end)
    emitter?.off('executeJobStart', execute_job_start)
    emitter?.off('executeJobFinish', execute_job_finish)
    emitter?.off('updateRuntimeParameter', update_runtime_parameter)
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
                    <v-list-item v-for="(item, i) in logs.logs" :key="i" :value="i" :active="selection == i" @click="selection = i">
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
                <ParameterPage v-model="getselect.parameter" />
            </v-col>
        </v-row>
    </v-container>
</template>

<style scoped>

</style>
