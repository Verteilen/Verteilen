<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, ConditionResult, ExecuteRecord, ExecuteState, ExecutionLog, Job, JobCategory, Libraries, Log, MESSAGE_LIMIT, Parameter, Project, Record, Setter, Task } from '../../interface';
import { ExecuteManager } from '../../script/execute_manager';
import { WebsocketManager } from '../../script/socket_manager';

import DebugLog from './console/DebugLog.vue';
import List from './console/List.vue';
import ParameterPage from './console/Parameter.vue';
import Process from './console/Process.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    socket: WebsocketManager | undefined
    execute: ExecuteManager | undefined
    logs: Log
    libs: Libraries
}
const data = defineModel<ExecuteRecord>()
const props = defineProps<PROPS>()
const leftSize = ref(3)
const rightSize = ref(9)
const tag = ref(1)
const para:Ref<Parameter | undefined> = ref(undefined)
/**
 * 0: All\
 * 1: Project\
 * 2: Task
 */
const process_type = ref(-1)
let hasNewLog = false

const receivedPack = (record:Record) => {
    const pass = props.execute!.Register(record.projects)
    if(pass == -1){
        data.value!.running = false
        data.value!.stop = true
        emitter?.emit('makeToast', {
            title: '執行失敗',
            message: '專案執行失敗 !\n你可以在 控制台/DebugLog 找到詳細訊息',
            type: 'warning'
        })
        return
    }
    
    data.value!.projects = record.projects
    data.value!.nodes = record.nodes
    data.value!.project_state = data.value!.projects.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })
    data.value!.project_index = pass
    data.value!.project = record.projects[pass].uuid
    data.value!.task_index = 0
    data.value!.task_state = data.value!.projects[0].task.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })
    data.value!.task_state[0].state = ExecuteState.RUNNING
    data.value!.task_detail = []
    const count = data.value?.projects[data.value!.project_index]?.task[data.value!.task_index]?.jobs.length ?? 0
    for(let i = 0; i < count; i++){
        data.value!.task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
    }
    
    const target = data.value!.projects[data.value!.project_index]
    const newlog:ExecutionLog = {
        project: target,
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
    props.logs.logs = [newlog].concat(props.logs.logs)
    hasNewLog = true
}

const feedback_message = (d:Setter) => {
    const cronjob = props.execute?.current_t?.cronjob ?? false
    const index = cronjob ? data.value!.task_detail.findIndex(x => x.node == d.key) : 0
    if(index == -1) return
    const container = data.value!.task_detail[index]
    if(container != undefined){
        container.message.push(d.value)
        if(container.message.length > MESSAGE_LIMIT){
            container.message.shift()
        }
    }
    props.logs.logs[0].logs[data.value!.task_index].task_detail[index].message.push(d.value)
    hasNewLog = true
}

const execute_project_start = (d:Project) => {
    const index = data.value!.projects.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    data.value!.project = d.uuid
    data.value!.project_index = index
    data.value!.project_state[index].state = ExecuteState.RUNNING
    data.value!.task_state = data.value!.projects[index].task.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })

    const target = data.value!.projects[data.value!.project_index]
    const newlog:ExecutionLog = {
        project: target,
        state: ExecuteState.RUNNING,
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
    props.logs.logs = [newlog].concat(props.logs.logs)
    hasNewLog = true
}

const execute_project_finish = (d:Project) => {
    if(process_type.value == 1) {
        data.value!.running = false
        data.value!.stop = true
    }
    const index = data.value!.projects.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    data.value!.project = ""
    data.value!.project_state[index].state = ExecuteState.FINISH

    props.logs.logs[0].state = ExecuteState.FINISH
    props.logs.logs[0].end_timer = Date.now()
    hasNewLog = true

    if(data.value!.projects.length - 1 == index){
        clean()
        data.value!.running = false
        data.value!.stop = true
    }
    para.value = undefined
}

const execute_task_start = (d:[Task, number]) => {
    if (data.value!.project_index == -1) return
    const index = data.value!.projects[data.value!.project_index].task.findIndex(x => x.uuid == d[0].uuid)
    if(index == -1) return
    data.value!.task = d[0].uuid
    data.value!.task_index = index
    data.value!.task_state[index].state = ExecuteState.RUNNING
    props.logs.logs[0].logs[data.value!.task_index].task_detail = []

    data.value!.task_detail = []
    const p = data.value!.projects[data.value!.project_index]
    const t = p.task[data.value!.task_index]
    const count = props.execute!.get_task_state_count(p, t)
    for(let i = 0; i < count; i++){
        data.value!.task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
        props.logs.logs[0].logs[data.value!.task_index].task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
    }
    props.logs.logs[0].logs[data.value!.task_index].task_state.state = ExecuteState.RUNNING
    props.logs.logs[0].logs[data.value!.task_index].start_timer = Date.now()
    hasNewLog = true
}

const execute_task_finish = (d:Task) => {
    if(process_type.value == 2) {
        data.value!.running = false
        data.value!.stop = true
    }
    if (data.value!.project_index == -1) return
    const index = data.value!.projects[data.value!.project_index].task.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    data.value!.task = ""
    data.value!.task_state[index].state = ExecuteState.FINISH

    props.logs.logs[0].logs[data.value!.task_index].task_state.state = ExecuteState.FINISH
    props.logs.logs[0].logs[data.value!.task_index].end_timer = Date.now()
    hasNewLog = true
}

const execute_subtask_start = (d:[Task, number, string]) => {
    data.value!.task_detail[d[1]].node = d[2]
    data.value!.task_detail[d[1]].state = ExecuteState.RUNNING

    props.logs.logs[0].logs[data.value!.task_index].task_detail[d[1]].state = ExecuteState.RUNNING
    hasNewLog = true
}

const execute_subtask_end = (d:[Task, number, string]) => {
    data.value!.task_detail[d[1]].node = ""
    data.value!.task_detail[d[1]].state = ExecuteState.FINISH

    props.logs.logs[0].logs[data.value!.task_index].task_detail[d[1]].state = ExecuteState.FINISH
    hasNewLog = true
}

const execute_job_start = (d:[Job, number, string]) => {
    //data.value!.task_detail[index].node = node
}

const execute_job_finish = (d:[Job, number, string, number]) => {
    if (d[3] == 1){
        const currentLog = props.logs.logs[0]
        const task = data.value!.projects[data.value!.project_index].task[data.value!.task_index]
        const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
        if(index != -1 && task.jobs[index].category == JobCategory.Condition){
            const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
            if(cr == ConditionResult.None) return
            
            stop()
            let timer:any
            timer = setInterval(() => {
                if(data.value!.running == false){
                    hasNewLog = true
                    clearInterval(timer)
                    const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                    currentLog.logs[data.value!.task_index].task_detail[d[1]].state = state
                    currentLog.logs[data.value!.task_index].task_state.state = state
                    data.value!.task_state[data.value!.task_index].state = state
                    data.value!.task_detail[d[1]].state = state
                    if (cr == ConditionResult.Pause) return
                    if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                        skip(0, state)
                        currentLog.state = state
                        if(data.value!.project.length > 0){
                            if(process_type.value == 0){
                                execute(process_type.value)
                            }
                        }
                    }
                    else if (cr == ConditionResult.SkipTask || cr == ConditionResult.ThrowTask){
                        skip(1, state)
                        if(data.value!.project.length > 0){
                            if(process_type.value == 0){
                                execute(process_type.value)
                            }
                        }
                    }
                }
            }, 1000);
        }
    }
    //data.value!.task_detail[index].node = ""
}

const update_runtime_parameter = (d:Parameter) => {
    console.log("Sync para", d)
    para.value = d
}

const updateHandle = () => {
    if(data.value!.running && !data.value!.stop){
        try {
            props.execute?.Update()
        }catch(err:any){
            data.value!.stop = true
            const str = '執行中出現錯誤: ' + err.name + '\n' + err.message
            emitter?.emit('makeToast', {
                title: '錯誤中斷',
                message: str,
                type: 'danger'
            })
            console.error(err)
        }
    }
    if(data.value!.stop){
        if(props.execute!.jobstack == 0){
            data.value!.running = false
        }
    }
    if(hasNewLog){
        emitter?.emit('updateLog', props.logs)
        hasNewLog = false
    }
}

const execute = (type:number) => {
    process_type.value = type
    data.value!.running = true
    data.value!.stop = false
    props.execute!.first = true
}

const skip = (type:number, state?:ExecuteState) => {
    if(type == 0){
        // Project
        data.value!.project_state[data.value!.project_index].state = state != undefined ? state : ExecuteState.FINISH
        data.value!.project_index += 1
        if(data.value!.project_index == data.value!.projects.length) {
            data.value!.project_index = -1
            clean()
        }
        else {
            data.value!.task_state = data.value!.projects[data.value!.project_index].task.map(x => {
                return {
                    uuid: x.uuid,
                    state: ExecuteState.NONE
                }
            })
            data.value!.task_detail = []
            const p = data.value!.projects[data.value!.project_index]
            const t = p.task[data.value!.task_index]
            const count = props.execute!.get_task_state_count(p, t)
            for(let i = 0; i < count; i++){
                data.value!.task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = props.execute!.SkipProject()
            console.log("跳過專案", index)
        }
    }else if (type == 1){
        // Task
        data.value!.task_state[data.value!.task_index].state = state != undefined ? state : ExecuteState.FINISH
        data.value!.task_index += 1
        if(data.value!.task_index == data.value!.task_state.length) {
            skip(0)
        }else{
            data.value!.task_state[data.value!.task_index].state = state != undefined ? state : ExecuteState.FINISH
            data.value!.task_detail = []
            const p = data.value!.projects[data.value!.project_index]
            const t = p.task[data.value!.task_index]
            const count = props.execute!.get_task_state_count(p, t)
            for(let i = 0; i < count; i++){
                data.value!.task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = props.execute!.SkipTask()
            console.log("跳過流程", index)
        }
        
    }
}

const clean = () => {
    props.logs.logs[0].end_timer = Date.now()
    hasNewLog = true
    props.execute!.Clean()
    data.value!.projects = []
    data.value!.project = ""
    data.value!.task = ""
    data.value!.project_index = -1
    data.value!.task_index = -1
    data.value!.project_state = []
    data.value!.task_state = []
    data.value!.task_detail = []
    para.value = undefined
}

const stop = () => {
    data.value!.stop = true
    para.value = undefined
    props.execute!.Stop()
}

onMounted(() => {
    emitter?.on('execute', receivedPack)
    emitter?.on('updateHandle', updateHandle)
    emitter?.on('feedbackMessage', feedback_message)
    emitter?.on('executeProjectStart', execute_project_start)
    emitter?.on('executeProjectFinish', execute_project_finish)
    emitter?.on('executeTaskStart', execute_task_start)
    emitter?.on('executeTaskFinish', execute_task_finish)
    emitter?.on('executeSubtaskStart', execute_subtask_start)
    emitter?.on('executeSubtaskFinish', execute_subtask_end)
    emitter?.on('executeJobStart', execute_job_start)
    emitter?.on('executeJobFinish', execute_job_finish)
    emitter?.on('updateRuntimeParameter', update_runtime_parameter)
})

onUnmounted(() => {
    emitter?.off('execute', receivedPack)
    emitter?.off('updateHandle', updateHandle)
    emitter?.off('feedbackMessage', feedback_message)
    emitter?.off('executeProjectStart', execute_project_start)
    emitter?.off('executeProjectFinish', execute_project_finish)
    emitter?.off('executeTaskStart', execute_task_start)
    emitter?.off('executeTaskFinish', execute_task_finish)
    emitter?.off('executeSubtaskStart', execute_subtask_start)
    emitter?.off('executeSubtaskFinish', execute_subtask_end)
    emitter?.off('executeJobStart', execute_job_start)
    emitter?.off('executeJobFinish', execute_job_finish)
    emitter?.off('updateRuntimeParameter', update_runtime_parameter)
})

</script>

<template>
    <div fluid class="ma-0 pa-0" v-if="data != undefined">
        <div class="py-3">
            <v-toolbar density="compact" class="px-3">
                <p>{{ $t('execute') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(0)" :disabled="data.projects.length == 0 || data.running" color="success">
                            <v-icon>mdi-step-forward-2</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-0') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(1)" :disabled="data.projects.length == 0 || data.running" color="success">
                            <v-icon>mdi-step-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-1') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(2)" :disabled="data.projects.length == 0 || data.running" color="success">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-2') }}
                </v-tooltip>
                <p>{{ $t('skip') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(0)" :disabled="data.projects.length == 0 || data.running" color="info">
                            <v-icon>mdi-skip-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('project') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(1)" :disabled="data.projects.length == 0 || data.running" color="info">
                            <v-icon>mdi-skip-next</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('task') }}
                </v-tooltip>
                <p>{{ $t('action') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="clean" :disabled="data.projects.length == 0 || data.running" color="error">
                            <v-icon>mdi-stop</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clean') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="stop" :disabled="data.projects.length == 0 || data.stop" color="error">
                            <v-icon>mdi-pause</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('stop') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <v-row style="height: calc(100vh - 150px)" class="w-100">
            <v-col :cols="leftSize" style="border-right: brown 1px solid; filter:brightness(1.2)">
                <v-list v-model="tag" color="success">
                    <v-list-item @click="tag = 0" :value="0">
                        {{ $t('console.list') }}
                    </v-list-item>
                    <v-list-item @click="tag = 1" :value="1">
                        {{ $t('console.dashboard') }}
                    </v-list-item>
                    <v-list-item @click="tag = 3" :value="3">
                        {{ $t('console.parameter') }}
                    </v-list-item>
                    <v-list-item @click="tag = 2" :value="2">
                        Debug Log
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col :cols="rightSize" v-show="tag == 0">
                <List v-model="data" />
            </v-col>
            <v-col :cols="rightSize" v-show="tag == 1">
                <Process v-model="data" />
            </v-col>
            <v-col :cols="rightSize" v-show="tag == 2">
                <DebugLog />
            </v-col>
            <v-col :cols="rightSize" v-show="tag == 3">
                <ParameterPage v-model="para" />
            </v-col>
        </v-row>
    </div>
</template>

<style scoped>

</style>



