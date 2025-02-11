<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import colors from 'vuetify/util/colors';
import { BusType, ExecuteRecord, ExecuteState, Record } from '../../interface';

const emitter:Emitter<BusType> | undefined = inject('emitter');

const headerState = ref(0)
const data:Ref<ExecuteRecord> = ref({
    projects: [],
    nodes: [],
    running: false,
    project: "",
    task: "",
    project_index: -1,
    task_index: -1,
    project_state: [],
    task_state: [],
    task_detail: [],
})
const leftSize = ref(3)
const rightSize = ref(9)
const tag = ref(1)

const getStateColor = (state:number):string => {
    if (state == ExecuteState.NONE) return colors.teal.base
    else if (state == ExecuteState.RUNNING) return colors.indigo.darken3
    else if (state == ExecuteState.FINISH) return colors.green.darken3
    else return colors.red.darken4
}

const receivedPack = (record:Record) => {
    if (data.value.running) return
    data.value.projects = record.projects
    data.value.nodes = record.nodes
    data.value.project_state = data.value.projects.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })
    data.value.project_index = 0
    data.value.task_state = data.value.projects[0].task.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })
}

const execute = (type:number) => {
    data.value.running = true
    const buffer:Record = {
        projects: data.value.projects,
        nodes: data.value.nodes
    }
    window.electronAPI.send('execute_pack', JSON.stringify(buffer))
}

const stop = () => {
    data.value.running = false
    window.electronAPI.send('execute_stop')
}

const feedback_message = (e:IpcRendererEvent, uuid:string, anydata:string) => {
    const index = data.value.task_detail.findIndex(x => x.node == uuid)
    if(index == -1) return
    data.value.task_detail[index].message.push(anydata)
}

const execute_project_start = (e:IpcRendererEvent, uuid:string) => {
    const index = data.value.projects.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value.project = uuid
    data.value.project_index = index
    data.value.project_state[index].state = ExecuteState.RUNNING
}

const execute_project_finish = (e:IpcRendererEvent, uuid:string) => {
    const index = data.value.projects.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value.project = ""
    data.value.project_index = -1
    data.value.project_state[index].state = ExecuteState.FINISH
}

const execute_task_start = (e:IpcRendererEvent, uuid:string, count:number) => {
    if (data.value.project_index == -1) return
    const index = data.value.projects[data.value.project_index].task.findIndex(x => x.uuid == uuid)
    console.log(index, uuid, count)
    if(index == -1) return
    data.value.task = uuid
    data.value.task_index = index
    data.value.task_state[index].state = ExecuteState.RUNNING
    data.value.task_detail = []
    for(let i = 0; i < count; i++){
        data.value.task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
    }
}

const execute_task_finish = (e:IpcRendererEvent, uuid:string) => {
    if (data.value.project_index == -1) return
    const index = data.value.projects[data.value.project_index].task.findIndex(x => x.uuid == uuid)
    if(index == -1) return
    data.value.task = ""
    data.value.task_index = -1
    data.value.task_state[index].state = ExecuteState.FINISH
    data.value.task_detail = []
}

const execute_subtask_start = (e:IpcRendererEvent, index:number, node:string) => {
    data.value.task_detail[index].node = node
    data.value.task_detail[index].state = ExecuteState.RUNNING
}

const execute_subtask_end = (e:IpcRendererEvent, index:number, node:string) => {
    data.value.task_detail[index].node = ""
    data.value.task_detail[index].state = ExecuteState.FINISH
}

const execute_job_start = (e:IpcRendererEvent, uuid:string, index:number, node:string) => {
    //data.value.task_detail[index].node = node
}

const execute_job_finish = (e:IpcRendererEvent, uuid:string, index:number, node:string) => {
    //data.value.task_detail[index].node = ""
}

onMounted(() => {
    emitter?.on('execute', receivedPack)
    window.electronAPI.eventOn('feedback_message', feedback_message)
    window.electronAPI.eventOn('execute_project_start', execute_project_start)
    window.electronAPI.eventOn('execute_project_finish', execute_project_finish)
    window.electronAPI.eventOn('execute_task_start', execute_task_start)
    window.electronAPI.eventOn('execute_task_finish', execute_task_finish)
    window.electronAPI.eventOn('execute_subtask_start', execute_subtask_start)
    window.electronAPI.eventOn('execute_subtask_end', execute_subtask_end)
    window.electronAPI.eventOn('execute_job_start', execute_job_start)
    window.electronAPI.eventOn('execute_job_finish', execute_job_finish)
})

onUnmounted(() => {
    emitter?.off('execute', receivedPack)
    window.electronAPI.eventOff('feedback_message', feedback_message)
    window.electronAPI.eventOff('execute_project_start', execute_project_start)
    window.electronAPI.eventOff('execute_project_finish', execute_project_finish)
    window.electronAPI.eventOff('execute_task_start', execute_task_start)
    window.electronAPI.eventOff('execute_task_finish', execute_task_finish)
    window.electronAPI.eventOff('execute_job_start', execute_job_start)
    window.electronAPI.eventOff('execute_job_finish', execute_job_finish)
})

</script>

<template>
    <b-container fluid>
        <b-row style="height: calc(100vh - 55px)" class="w-100">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <b-button-group class="my-3 w-100">
                    <b-button @click="execute(0)" :disabled="data.projects.length == 0 || data.running" variant="success">{{ $t('execute-0') }}</b-button>
                    <b-button @click="execute(1)" :disabled="data.projects.length == 0 || data.running" variant="success">{{ $t('execute-1') }}</b-button>
                </b-button-group>
                <b-button-group class="my-3 w-100">
                    <b-button @click="stop()" :disabled="data.projects.length == 0 || !data.running" variant="danger">{{ $t('stop') }}</b-button>
                </b-button-group>
                <b-list-group>
                    <b-list-group-item href="#" @click="tag = 0" :active="tag == 0">專案進程</b-list-group-item>
                    <b-list-group-item href="#" @click="tag = 1" :active="tag == 1">儀錶板</b-list-group-item>
                    <b-list-group-item href="#" @click="tag = 2" :active="tag == 2">Debug Log</b-list-group-item>
                </b-list-group>
            </b-col>
            <b-col :cols="rightSize" v-if="tag == 0">
                
            </b-col>
            <b-col :cols="rightSize" v-if="tag == 1">
                <b-container class="pt-4" style="max-height: 90vh; overflow-y: auto;">
                    <v-stepper v-model="data.task_index">
                        <v-stepper-header>
                            <div v-for="(c, i) in data.task_state" :key="i">
                                <v-stepper-item 
                                    :style="{ 'backgroundColor': getStateColor(c.state) }"
                                    :value="i"
                                    :title="data.projects[data.project_index].task[i].title"
                                    :complete="c.state == 2">
                                </v-stepper-item>
                                <v-divider color="white" v-if="i < data.task_state.length"></v-divider>
                            </div>
                        </v-stepper-header>
                    </v-stepper>
                    <br /> <br />
                    <b-card no-body v-for="(task, i) in data.task_detail" :key="i" bg-variant="dark" :style="{ 'border-color': getStateColor(task.state) }" class="w-100 text-white mb-3 px-4">
                        <b-card-header>
                            <span style="margin-right: 10px;">Index: {{ task.index }}</span> <b-spinner small v-if="task.node.length > 0"></b-spinner>
                        </b-card-header>
                        <b-card-text v-if="task.node.length > 0">
                            <p style="line-height: 15px; margin: 3px; text-align: left;" v-for="(text, j) in task.message" :key="j"> {{ text }} </p>
                        </b-card-text>
                    </b-card>
                    <br /> <br />
                </b-container>
            </b-col>
            <b-col :cols="rightSize" v-if="tag == 2">

            </b-col>
        </b-row>
    </b-container>
</template>

<style scoped>

</style>


