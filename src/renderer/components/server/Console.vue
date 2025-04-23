<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, ConditionResult, ExecuteRecord, ExecuteState, FeedBack, Job, JobCategory, Libraries, MESSAGE_LIMIT, Node, Parameter, Preference, Project, Record, Task } from '../../interface';
import { ExecuteManager } from '../../script/execute_manager';
import { WebsocketManager } from '../../script/socket_manager';
import { DATA, Util_Console } from '../../util/console';
import ConsoleDialog from '../dialog/ConsoleDialog.vue';
import NumberDialog from '../dialog/NumberDialog.vue';
import DebugLog from './console/DebugLog.vue';
import List from './console/List.vue';
import ParameterPage from './console/Parameter.vue';
import Process from './console/Process.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    config: AppConfig
    preference: Preference
    socket: WebsocketManager | undefined
    execute: Array<ExecuteManager>
    libs: Libraries
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
}
const model = defineModel<[ExecuteManager, ExecuteRecord]>()
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', name:string, record:Record):void
}>()
const data:Ref<DATA> = ref({
    leftSize: 3,
    rightSize: 9,
    tag: 1,
    para: undefined,
    useCron: false,
    createModal: false,
    skipModal: false,
    /**
     * The speicifed the process step type
     * * 0: All Projects through
     * * 1: Single project through
     * * 2: SIngle task through
     */
    process_type: -1,
})

const util:Util_Console = new Util_Console(data, () => model.value)

const consoleAdded = (name:string, data:Record) => {
    emits('added', name, data)
}

//#region Bus Events
/**
 * Attach to main update cycle events\
 * This will response for the main update for the process worker
 */
const updateHandle = () => {
    if(model.value![1].running && !model.value![1].stop){
        try {
            props.execute[0].Update()
        }catch(err:any){
            model.value![1].stop = true
            const str = 'Execute Error: ' + err.name + '\n' + err.message
            emitter?.emit('makeToast', {
                title: 'Error Interrupt',
                message: str,
                type: 'danger'
            })
            console.error(err)
        }
    }
    if(model.value![1].stop){
        if(props.execute[0].jobstack == 0){
            model.value![1].running = false
        }
    }
}

const createConsole = () => {
    data.value.createModal = true
}

/**
 * When parameter getting change by the process steps\
 * This get called
 * @param d The whole container for the parameters
 */
const update_runtime_parameter = (d:Parameter) => util.update_runtime_parameter(d)

const feedback_message = (d:FeedBack) => {
    if(d.index == undefined || d.index == -1) return
    const container = model.value![1].task_detail[d.index]
    if(container != undefined){
        container.message.push(d.message)
        if(container.message.length > MESSAGE_LIMIT){
            container.message.shift()
        }
    }
}

const execute_project_start = (d:Project) => {
    const index = model.value![1].projects.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    model.value![1].project = d.uuid
    model.value![1].project_index = index
    model.value![1].project_state[index].state = ExecuteState.RUNNING
    model.value![1].task_state = model.value![1].projects[index].task.map(x => {
        return {
            uuid: x.uuid,
            state: ExecuteState.NONE
        }
    })
}

const execute_project_finish = (d:Project) => {
    if(data.value.process_type == 1) {
        model.value![1].running = false
        model.value![1].stop = true
    }
    const index = model.value![1].projects.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    model.value![1].project = ""
    model.value![1].project_state[index].state = ExecuteState.FINISH

    if(model.value![1].projects.length - 1 == index){
        clean()
        model.value![1].running = false
        model.value![1].stop = true
    }
    data.value.para = undefined
}

const execute_task_start = (d:[Task, number]) => {
    if (model.value![1].project_index == -1) return
    const index = model.value![1].projects[model.value![1].project_index].task.findIndex(x => x.uuid == d[0].uuid)
    if(index == -1) return
    data.value.useCron = d[0].cronjob
    model.value![1].task = d[0].uuid
    model.value![1].task_index = index
    model.value![1].task_state[index].state = ExecuteState.RUNNING
    model.value![1].task_detail = []
    const p = model.value![1].projects[model.value![1].project_index]
    const t = p.task[model.value![1].task_index]
    const count = props.execute[0].get_task_state_count(t)
    for(let i = 0; i < count; i++){
        model.value![1].task_detail.push({
            index: i,
            node: "",
            message: [],
            state: ExecuteState.NONE
        })
    }
}

const execute_task_finish = (d:Task) => {
    if(data.value.process_type == 2) {
        model.value![1].running = false
        model.value![1].stop = true
    }
    if (model.value![1].project_index == -1) return
    const index = model.value![1].projects[model.value![1].project_index].task.findIndex(x => x.uuid == d.uuid)
    if(index == -1) return
    data.value.useCron = false
    model.value![1].task = ""
    model.value![1].task_state[index].state = ExecuteState.FINISH
    if(index + 1 < model.value![1].task_state.length - 1){
        model.value![1].task_state[index + 1].state = ExecuteState.RUNNING
    }
}

const execute_subtask_start = (d:[Task, number, string]) => {
    if(model.value![1].task_detail.length > d[1]){
        model.value![1].task_detail[d[1]].node = d[2]
        model.value![1].task_detail[d[1]].state = ExecuteState.RUNNING
    }else{
        console.error(`subtask_start ${d[1]} is out of range: ${model.value![1].task_detail.length}`)
    }
}
const execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
    if(model.value![1].task_detail.length > d[1]){
        model.value![1].task_detail[d[1]].node = d[2]
        model.value![1].task_detail[d[1]].state = d[3]
    }else{
        console.error(`subtask_start ${d[1]} is out of range: ${model.value![1].task_detail.length}`)
    }
}
const execute_subtask_end = (d:[Task, number, string]) => {
    if(model.value![1].task_detail.length > d[1]){
        //model.value![1].task_detail[d[1]].node = ""
        model.value![1].task_detail[d[1]].state = ExecuteState.FINISH
    }else{
        console.error(`subtask_start ${d[1]} is out of range: ${model.value![1].task_detail.length}`)
    }
}

const execute_job_start = (d:[Job, number, string]) => {
    //model.value![1].task_detail[index].node = node
}

const execute_job_finish = (d:[Job, number, string, number]) => {
    if (d[3] == 1){
        const task = model.value![1].projects[model.value![1].project_index].task[model.value![1].task_index]
        const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
        if(index != -1 && task.jobs[index].category == JobCategory.Condition){
            const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
            if(cr == ConditionResult.None) return
            
            stop()
            let timer:any
            timer = setInterval(() => {
                if(model.value![1].running == false){
                    clearInterval(timer)
                    const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                    model.value![1].task_state[model.value![1].task_index].state = state
                    model.value![1].task_detail[d[1]].state = state
                    if (cr == ConditionResult.Pause) return
                    if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                        skip(0, state)
                        if(model.value![1].project.length > 0){
                            if(data.value.process_type == 0){
                                execute(data.value.process_type)
                            }
                        }
                    }
                    else if (cr == ConditionResult.SkipTask || cr == ConditionResult.ThrowTask){
                        skip(1, state)
                        if(model.value![1].project.length > 0){
                            if(data.value.process_type == 0){
                                execute(data.value.process_type)
                            }
                        }
                    }
                }
            }, 1000);
        }
    }
    //model.value![1].task_detail[index].node = ""
}
//#endregion

//#region UI Events
/**
 * Running the process
 * @param type How long does the step goes {@link process_type}
 * * 0: All Projects through
 * * 1: Single project through
 * * 2: SIngle task through
 */
const execute = (type:number) => {
    data.value.process_type = type
    model.value![1].running = true
    model.value![1].stop = false
    props.execute[0].first = true
}
/**
 * Skip the project ahead, 
 * @param type How far step you want to skip
 * * 0: Project
 * * 1: Task
 * * 2: Step
 * @param state The override state, default is FINISH
 */
const skip = (type:number, state:ExecuteState = ExecuteState.FINISH) => {
    if(type == 0){
        // Project
        model.value![1].project_state[model.value![1].project_index].state = state != undefined ? state : ExecuteState.FINISH
        model.value![1].project_index += 1
        if(model.value![1].project_index == model.value![1].projects.length) {
            model.value![1].project_index = -1
            clean()
        }
        else {
            model.value![1].task_state = model.value![1].projects[model.value![1].project_index].task.map(x => {
                return {
                    uuid: x.uuid,
                    state: ExecuteState.NONE
                }
            })
            model.value![1].task_detail = []
            const p = model.value![1].projects[model.value![1].project_index]
            const t = p.task[model.value![1].task_index]
            const count = props.execute[0].get_task_state_count(t)
            for(let i = 0; i < count; i++){
                model.value![1].task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = props.execute[0].SkipProject()
            console.log("Skip project", index)
        }
    }else if (type == 1){
        // Task
        model.value![1].task_state[model.value![1].task_index].state = state != undefined ? state : ExecuteState.FINISH
        model.value![1].task_index += 1
        if(model.value![1].task_index == model.value![1].task_state.length) {
            skip(0)
        }else{
            model.value![1].task_state[model.value![1].task_index].state = state != undefined ? state : ExecuteState.FINISH
            model.value![1].task_detail = []
            const p = model.value![1].projects[model.value![1].project_index]
            const t = p.task[model.value![1].task_index]
            const count = props.execute[0].get_task_state_count(t)
            for(let i = 0; i < count; i++){
                model.value![1].task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = props.execute[0].SkipTask()
            console.log("Skip task", index)
        }
    }else if (type == 2){
        data.value.skipModal = true
    }
}
/**
 * When user click confirm on the skip step modal
 */
const confirmSkip = (v:number) => {
    const index = props.execute[0].SkipSubTask(v)
    if(index < 0) {
        console.error("Skip step failed: ", index)
        return
    }
    for(let i = 0; i < index; i++){
        model.value![1].task_detail[i].state = ExecuteState.FINISH
    }
    console.log("Skip task", index)
    data.value.skipModal = false
}
/**
 * Destroy all state and reset
 */
const clean = () => {
    props.execute[0].Clean()
    model.value![1].projects = []
    model.value![1].project = ""
    model.value![1].task = ""
    model.value![1].project_index = -1
    model.value![1].task_index = -1
    model.value![1].project_state = []
    model.value![1].task_state = []
    model.value![1].task_detail = []
    data.value.para = undefined
}
/**
 * It means pause... but i just name it 'stop' anyway. you get the idea\
 * This will not destroy the state, it just stop the update thought\
 * If you want to destroy and reset all state, you should call {@link clean()} function instead
 */
const stop = () => {
    model.value![1].stop = true
    props.execute[0].Stop()
}
//#endregion

onMounted(() => {
    emitter?.on('updateHandle', updateHandle)
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
})

onUnmounted(() => {
    emitter?.off('updateHandle', updateHandle)
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
    <div fluid class="ma-0 pa-0" v-if="model != undefined">
        <div class="py-3">
            <v-toolbar density="compact" class="px-3" :style="{ 'fontSize': props.preference.font + 'px' }">
                <p>{{ $t('execute') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(0)" :disabled="model[1].projects.length == 0 || model[1].running" color="success">
                            <v-icon>mdi-step-forward-2</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-0') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(1)" :disabled="model[1].projects.length == 0 || model[1].running" color="success">
                            <v-icon>mdi-step-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-1') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(2)" :disabled="model[1].projects.length == 0 || model[1].running" color="success">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-2') }}
                </v-tooltip>
                <p>{{ $t('skip') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(0)" :disabled="model[1].projects.length == 0 || model[1].running" color="info">
                            <v-icon>mdi-skip-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('project') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(1)" :disabled="model[1].projects.length == 0 || model[1].running" color="info">
                            <v-icon>mdi-skip-next</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('task') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(2)" :disabled="model[1].projects.length == 0 || model[1].running" color="info">
                            <v-icon>mdi-debug-step-over</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('step') }}
                </v-tooltip>
                <p>{{ $t('action') }}</p>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="clean" :disabled="model[1].projects.length == 0 || model[1].running" color="error">
                            <v-icon>mdi-stop</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clean') }}
                </v-tooltip>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="stop" :disabled="model[1].projects.length == 0 || model[1].stop" color="error">
                            <v-icon>mdi-pause</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('stop') }}
                </v-tooltip>
                <v-spacer></v-spacer>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="createConsole">
                            <v-icon>mdi-plus</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('create') }}
                </v-tooltip>
            </v-toolbar>
        </div>
        <v-row style="height: calc(100vh - 150px)" class="w-100">
            <v-col :cols="data.leftSize" style="border-right: brown 1px solid; filter:brightness(1.2)">
                <v-list v-model.number="data.tag" mandatory color="success" :style="{ 'fontSize': props.preference.font + 'px' }">
                    <v-list-item @click="data.tag = 0" :value="0" :active="data.tag == 0">
                        {{ $t('console.list') }}
                    </v-list-item>
                    <v-list-item @click="data.tag = 1" :value="1" :active="data.tag == 1">
                        {{ $t('console.dashboard') }}
                    </v-list-item>
                    <v-list-item @click="data.tag = 3" :value="3" :active="data.tag == 3">
                        {{ $t('console.parameter') }}
                    </v-list-item>
                    <v-list-item @click="data.tag = 2" :value="2" :active="data.tag == 2">
                        Debug Log
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col :cols="data.rightSize" v-show="data.tag == 0">
                <List v-model="model[1]" :preference="props.preference" />
            </v-col>
            <v-col :cols="data.rightSize" v-show="data.tag == 1">
                <Process v-model="model[1]" :socket="props.socket" :preference="props.preference" />
            </v-col>
            <v-col :cols="data.rightSize" v-show="data.tag == 2">
                <DebugLog :preference="props.preference" />
            </v-col>
            <v-col :cols="data.rightSize" v-show="data.tag == 3">
                <ParameterPage v-model="data.para" :preference="props.preference" />
            </v-col>
        </v-row>
        <ConsoleDialog v-model="data.createModal"
            :projects="props.projects"
            :nodes="props.nodes"
            :parameters="props.parameters"
            @confirm="(e, e1) => consoleAdded(e, e1)"
        />
        <NumberDialog v-model="data.skipModal" 
            :default-value="0" 
            @submit="confirmSkip" 
            :title="$t('modal.skip-step')" 
            icon="mdi-debug-step-over" 
            :label="$t('step')"/>
    </div>
</template>