<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { BusType, ExecuteRecord, ExecuteState, ExecutionLog, Log, Record, Setter } from '../../interface';
import { ExecuteManager } from '../../script/execute_manager';
import { WebsocketManager } from '../../script/socket_manager';

import DebugLog from './console/DebugLog.vue';
import List from './console/List.vue';
import Process from './console/Process.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    socket: WebsocketManager | undefined
    execute: ExecuteManager | undefined
    logs: Log
}
const data = defineModel<ExecuteRecord>()
const props = defineProps<PROPS>()
const leftSize = ref(3)
const rightSize = ref(9)
const tag = ref(1)
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
    const index = data.value!.task_detail.findIndex(x => x.node == d.key)
    if(index == -1) return
    data.value!.task_detail[index].message.push(d.value)
    
    props.logs.logs[0].logs[data.value!.task_index].task_detail[index].message.push(d.value)
    hasNewLog = true
}

const execute_project_start = (uuid:string) => {
    const index = data.value!.projects.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value!.project = uuid
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

const execute_project_finish = (uuid:string) => {
    if(process_type.value == 1) {
        data.value!.running = false
        data.value!.stop = true
    }
    const index = data.value!.projects.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value!.project = ""
    data.value!.project_state[index].state = ExecuteState.FINISH

    props.logs.logs[0].end_timer = Date.now()
    hasNewLog = true
}

const execute_task_start = (d:{uuid:string, count:number}) => {
    if (data.value!.project_index == -1) return
    const index = data.value!.projects[data.value!.project_index].task.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    data.value!.task = d.uuid
    data.value!.task_index = index
    data.value!.task_state[index].state = ExecuteState.RUNNING
    data.value!.task_detail = []
    props.logs.logs[0].logs[data.value!.task_index].task_detail = []
    for(let i = 0; i < d.count; i++){
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
    console.log("task_start", data.value!)
    props.logs.logs[0].logs[data.value!.task_index].task_state.state = ExecuteState.RUNNING
    props.logs.logs[0].logs[data.value!.task_index].start_timer = Date.now()
    hasNewLog = true
}

const execute_task_finish = (uuid:string) => {
    if(process_type.value == 2) {
        data.value!.running = false
        data.value!.stop = true
    }
    if (data.value!.project_index == -1) return
    const index = data.value!.projects[data.value!.project_index].task.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value!.task = ""
    data.value!.task_state[index].state = ExecuteState.FINISH

    props.logs.logs[0].logs[data.value!.task_index].task_state.state = ExecuteState.FINISH
    props.logs.logs[0].logs[data.value!.task_index].end_timer = Date.now()
    hasNewLog = true
}

const execute_subtask_start = (d:{index:number, node:string}) => {
    console.log("execute_subtask_start", d, data.value!)
    data.value!.task_detail[d.index].node = d.node
    data.value!.task_detail[d.index].state = ExecuteState.RUNNING

    props.logs.logs[0].logs[data.value!.task_index].task_detail[d.index].state = ExecuteState.RUNNING
    hasNewLog = true
}

const execute_subtask_end = (d:{index:number, node:string}) => {
    data.value!.task_detail[d.index].node = ""
    data.value!.task_detail[d.index].state = ExecuteState.FINISH

    props.logs.logs[0].logs[data.value!.task_index].task_detail[d.index].state = ExecuteState.FINISH
    hasNewLog = true
}

const execute_job_start = (d:{uuid:string, index:number, node:string}) => {
    //data.value!.task_detail[index].node = node
}

const execute_job_finish = (d:{uuid:string, index:number, node:string}) => {
    //data.value!.task_detail[index].node = ""
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
}

const skip = (type:number) => {
    if(type == 0){
        // Project
        data.value!.project_state[data.value!.project_index].state = ExecuteState.FINISH
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
        data.value!.task_state[data.value!.task_index].state = ExecuteState.FINISH
        data.value!.task_index += 1
        if(data.value!.task_index == data.value!.task_state.length) {
            skip(0)
        }else{
            data.value!.task_state[data.value!.task_index].state = ExecuteState.RUNNING
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
}

const stop = () => {
    data.value!.stop = true
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
})

</script>

<template>
    <b-container fluid v-if="data != undefined">
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <b-button-group class="mt-3 w-100">
                    <b-button @click="execute(0)" :disabled="data.projects.length == 0 || data.running" variant="success">{{ $t('execute-0') }}</b-button>
                    <b-button @click="execute(1)" :disabled="data.projects.length == 0 || data.running" variant="success">{{ $t('execute-1') }}</b-button>
                    <b-button @click="execute(2)" :disabled="data.projects.length == 0 || data.running" variant="success">{{ $t('execute-2') }}</b-button>
                </b-button-group>
                <b-button-group class="my-1 w-100">
                    <b-button @click="skip(0)" :disabled="data.projects.length == 0 || data.running" variant="info">{{ $t('skip-0') }}</b-button>
                    <b-button @click="skip(1)" :disabled="data.projects.length == 0 || data.running" variant="info">{{ $t('skip-1') }}</b-button>
                </b-button-group>
                <b-button-group class="my-1 w-100">
                    <b-button @click="clean()" :disabled="data.projects.length == 0 || data.running" variant="danger">{{ $t('clean') }}</b-button>
                </b-button-group>
                <b-button-group class="mb-3 w-100">
                    <b-button @click="stop()" :disabled="data.projects.length == 0 || data.stop" variant="danger">{{ $t('stop') }}</b-button>
                </b-button-group>
                <b-list-group>
                    <b-list-group-item href="#" variant="dark" @click="tag = 0" :active="tag == 0">{{ $t('console.list') }}</b-list-group-item>
                    <b-list-group-item href="#" variant="dark" @click="tag = 1" :active="tag == 1">{{ $t('console.dashboard') }}</b-list-group-item>
                    <b-list-group-item href="#" variant="dark" @click="tag = 2" :active="tag == 2">Debug Log</b-list-group-item>
                </b-list-group>
            </b-col>
            <b-col :cols="rightSize" v-show="tag == 0">
                <List v-model="data" />
            </b-col>
            <b-col :cols="rightSize" v-show="tag == 1">
                <Process v-model="data" />
            </b-col>
            <b-col :cols="rightSize" v-show="tag == 2">
                <DebugLog />
            </b-col>
        </b-row>
    </b-container>
</template>

<style scoped>

</style>



