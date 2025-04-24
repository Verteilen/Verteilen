<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, onMounted, onUnmounted, Ref, ref } from 'vue';
import { AppConfig, BusType, ExecuteRecord, ExecuteState, Libraries, Node, Parameter, Preference, Project, Record } from '../../interface';
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
    execute: Array<[ExecuteManager, ExecuteRecord]>
    libs: Libraries
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
}
const p_model = defineModel<[ExecuteManager, ExecuteRecord]>()
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', name:string, record:Record):void,
    (e: 'select', index:number):void
    (e: 'stop'):void
}>()
const data:Ref<DATA> = ref({
    leftSize: 3,
    rightSize: 9,
    tag: 1,
    para: undefined,
    createModal: false,
    skipModal: false,
})
const model:Ref<[ExecuteManager, ExecuteRecord, number] | undefined> = ref(undefined)

const util:Util_Console = new Util_Console(data, () => p_model.value)

const consoleAdded = (name:string, data:Record) => {
    emits('added', name, data)
}

//#region Bus Events
/**
 * Attach to main update cycle events\
 * This will response for the main update for the process worker
 */
const updateHandle = () => {
    if(p_model.value != undefined){
        if(model.value == undefined){
            model.value = [p_model.value![0], p_model.value![1], Number.MIN_VALUE]
        }else{
            model.value[0] = p_model.value![0]
            model.value[1] = p_model.value![1]
            model.value[2] = model.value![2]++
            if(model.value[2] == Number.MAX_VALUE) model.value[2] = Number.MIN_VALUE
        }
    }else{
        model.value = undefined
    }
    props.execute.forEach(x => {
        if(x[1].running && !x[1].stop){
            try {
                x[0].Update()
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
            if(x[0].jobstack == 0){
                model.value![1].running = false
            }
        }
        if(x[1].command.length > 0){
            const p:Array<any> = x[1].command.shift()!
            if(p[0] == 'clean') clean()
            else if (p[0] == 'stop') stop()
            else if (p[0] == 'skip') skip(p[1], p[2])
            else if (p[0] == 'execute') execute(p[1])
        }
    })
}

const createConsole = () => {
    data.value.createModal = true
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
    model.value![1].process_type = type
    model.value![1].running = true
    model.value![1].stop = false
    model.value![0].first = true
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
            const count = model.value![0].get_task_state_count(t)
            for(let i = 0; i < count; i++){
                model.value![1].task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = model.value![0].SkipProject()
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
            const count = model.value![0].get_task_state_count(t)
            for(let i = 0; i < count; i++){
                model.value![1].task_detail.push({
                    index: i,
                    node: "",
                    message: [],
                    state: ExecuteState.NONE
                })
            }
            const index = model.value![0].SkipTask()
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
    const index = model.value![0].SkipSubTask(v)
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
    stop()
    model.value![0].Clean()
    model.value![1].projects = []
    model.value![1].project = ""
    model.value![1].task = ""
    model.value![1].project_index = -1
    model.value![1].task_index = -1
    model.value![1].project_state = []
    model.value![1].task_state = []
    model.value![1].task_detail = []
    data.value.para = undefined
    emits('stop')
}
/**
 * It means pause... but i just name it 'stop' anyway. you get the idea\
 * This will not destroy the state, it just stop the update thought\
 * If you want to destroy and reset all state, you should call {@link clean()} function instead
 */
const stop = () => {
    model.value![1].stop = true
    model.value![0].Stop()
}
//#endregion

onMounted(() => {
    emitter?.on('updateHandle', updateHandle)
})

onUnmounted(() => {
    emitter?.off('updateHandle', updateHandle)
})

</script>

<template>
    <div fluid class="ma-0 pa-0">
        <div class="py-3">
            <v-toolbar density="compact" class="px-3" :style="{ 'fontSize': props.preference.font + 'px' }">
                <p v-if="model != undefined">{{ $t('execute') }}</p>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(0)" :disabled="model[1].running" color="success">
                            <v-icon>mdi-step-forward-2</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-0') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(1)" :disabled="model[1].running" color="success">
                            <v-icon>mdi-step-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-1') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(2)" :disabled="model[1].running" color="success">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-2') }}
                </v-tooltip>
                <p v-if="model != undefined">{{ $t('skip') }}</p>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(0)" :disabled="model[1].running" color="info">
                            <v-icon>mdi-skip-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('project') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(1)" :disabled="model[1].running" color="info">
                            <v-icon>mdi-skip-next</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('task') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(2)" :disabled="model[1].running" color="info">
                            <v-icon>mdi-debug-step-over</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('step') }}
                </v-tooltip>
                <p v-if="model != undefined">{{ $t('action') }}</p>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="clean" :disabled="model[1].running" color="error">
                            <v-icon>mdi-stop</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clean') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="stop" :disabled="model[1].stop" color="error">
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
                    <v-list-item v-if="model != undefined" @click="data.tag = 0" :value="0" :active="data.tag == 0">
                        {{ $t('console.list') }}
                    </v-list-item>
                    <v-list-item v-if="model != undefined" @click="data.tag = 1" :value="1" :active="data.tag == 1">
                        {{ $t('console.dashboard') }}
                    </v-list-item>
                    <v-list-item v-if="model != undefined" @click="data.tag = 3" :value="3" :active="data.tag == 3">
                        {{ $t('console.parameter') }}
                    </v-list-item>
                    <v-list-item @click="data.tag = 2" :value="2" :active="data.tag == 2">
                        Debug Log
                    </v-list-item>
                </v-list>
                <v-list mandatory v-if="model != undefined" color="success" :style="{ 'fontSize': props.preference.font + 'px' }">
                    <v-list-item v-for="(exe, i) in props.execute" :key="i" 
                        :active="exe[0].uuid == model[0].uuid"
                        @click="emits('select', i)">
                        <v-list-item-title>
                            {{ exe[0].name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ exe[0].uuid }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col v-if="model != undefined" :cols="data.rightSize" v-show="data.tag == 0">
                <List v-model="model" :preference="props.preference" />
            </v-col>
            <v-col v-if="model != undefined" :cols="data.rightSize" v-show="data.tag == 1">
                <Process v-model="model" :socket="props.socket" :preference="props.preference" />
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
            :preference="props.preference"
            :execute="props.execute"
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