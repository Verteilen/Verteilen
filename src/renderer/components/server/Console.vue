<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
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
    if (state == 0) return  "Default"
    else if (state == 1) return "primary"
    else if (state == 2) return "success"
    else return "danger"
}

const receivedPack = (record:Record) => {
    console.log(record)
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

const execute = () => {
    data.value.running = !data.value.running
    if(data.value.running){
        window.electronAPI.send('ExecuteRendererPack', JSON.stringify(data.value as Record))
    }else{
        window.electronAPI.send('StopExecute')
    }
    
}

const feedback_message = (e:IpcRendererEvent, uuid:string, data:any) => {

}

const execute_project_start = (e:IpcRendererEvent, uuid:string) => {

}

const execute_project_finish = (e:IpcRendererEvent, uuid:string) => {

}

const execute_task_start = (e:IpcRendererEvent, uuid:string) => {

}

const execute_task_finish = (e:IpcRendererEvent, uuid:string) => {

}

const execute_job_start = (e:IpcRendererEvent, uuid:string, node:string) => {

}

const execute_job_finish = (e:IpcRendererEvent, uuid:string, node:string) => {

}

onMounted(() => {
    emitter?.on('execute', receivedPack)
    window.electronAPI.eventOn('feedback_message', feedback_message)
    window.electronAPI.eventOn('execute_project_start', execute_project_start)
    window.electronAPI.eventOn('execute_project_finish', execute_project_finish)
    window.electronAPI.eventOn('execute_task_start', execute_task_start)
    window.electronAPI.eventOn('execute_task_finish', execute_task_finish)
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
        <b-row style="height: calc(100vh - 45px)">
            <b-col :cols="leftSize" style="border-right: brown 1px solid;">
                <b-button-group class="my-3 w-100">
                    <b-button @click="execute" :disabled="data.projects.length == 0" :variant="data.running ? 'danger' : 'success'">{{ data.running ? '停止' : '執行' }}</b-button>
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
                <b-row>
                    <b-col v-for="(c, i) in data.task_state" :key="i">
                        <b-card class="w-100" no-body>
                            <b-card-header :header-bg-variant="getStateColor(c.state)" class="mb-2">
                                <span style="font-size: smaller;">{{ c.uuid }}</span>
                            </b-card-header>
                            <b-card-text>
                                <h4> {{ data.projects[data.project_index].task[i].title }} </h4>
                            </b-card-text>
                        </b-card>
                    </b-col>
                </b-row>
            </b-col>
            <b-col :cols="rightSize" v-if="tag == 2">

            </b-col>
        </b-row>
    </b-container>
</template>

<style scoped>

</style>

