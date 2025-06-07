<script setup lang="ts">
import { Emitter } from 'mitt';
import { inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { BusType, ExecutePair, ExecuteRecord, ExecuteState, Libraries, Node, Parameter, Preference, Project, Record } from '../../interface';
import { WebsocketManager } from '../../script/socket_manager';
import { DATA } from '../../util/console';
import ConsoleDialog from '../dialog/ConsoleDialog.vue';
import NumberDialog from '../dialog/NumberDialog.vue';
import DebugLog from './../components/console/DebugLog.vue';
import List from './../components/console/List.vue';
import ParameterPage from './../components/console/Parameter.vue';
import Process from './../components/console/Process.vue';
import { BackendProxy } from '../../proxy';

const emitter:Emitter<BusType> | undefined = inject('emitter');

interface PROPS {
    backend: BackendProxy
    preference: Preference
    socket: WebsocketManager | undefined
    execute: Array<ExecutePair>
    libs: Libraries
    projects: Array<Project>
    nodes: Array<Node>
    parameters: Array<Parameter>
}
const p_model = defineModel<ExecutePair>()
const props = defineProps<PROPS>()
const emits = defineEmits<{
    (e: 'added', name:string, record:Record):void,
    (e: 'select', index:number):void
    (e: 'stop'):void
}>()
const data:Ref<DATA> = ref({
    leftSize: 3,
    rightSize: 9,
    tag: 2,
    createModal: false,
    skipModal: false,
})
const model:Ref<ExecutePair> = ref({})
const updateWait = ref(false)
const queryWait = ref(false)

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
            model.value = { manager: p_model.value.manager, record: p_model.value.record, meta: Number.MIN_VALUE }
        }else{
            model.value.manager = p_model.value.manager
            model.value.record = p_model.value.record
            model.value.meta++
        }
    }else{
        model.value = { meta: Number.MIN_VALUE }
    }

    if(props.backend.config.haveBackend){
        if(!updateWait.value){
            updateWait.value = true
            props.backend.invoke("console_update").then((xs:Array<any>) => {
                if(xs){
                    for(let i = 0; i < xs.length; i++){
                        const x = xs[i]
                        if(x.code === 400){
                            const str = 'Execute Error: ' + x.name + '\n' + x.message
                            emitter?.emit('makeToast', {
                                title: 'Error Interrupt',
                                message: str,
                                type: 'error',
                                stack: x.stack,
                            })
                        }
                    }
                }
                updateWait.value = false
            })
        }
        if(!queryWait.value && p_model.value?.record != undefined){
            queryWait.value = true
            props.backend.invoke("console_record", p_model.value.record.uuid).then(x => {
                const t = JSON.parse(x)
                if(p_model.value?.record != undefined && t != undefined) p_model.value!.record = t
                queryWait.value = false
            })
        }
    }else{
        props.execute.forEach(x => {
            if(x.record!.running && !x.record!.stop){
                try {
                    x.manager!.Update()
                }catch(err:any){
                    x.record!.stop = true
                    const str = 'Execute Error: ' + err.name + '\n' + err.message
                    emitter?.emit('makeToast', {
                        title: 'Error Interrupt',
                        message: str,
                        type: 'danger'
                    })
                    console.error(err)
                }
            }
            if(x.record!.stop){
                if(x.manager!.jobstack == 0){
                    x.record!.running = false
                }
            }
            if(x.record!.command.length > 0){
                const p:Array<any> = x.record!.command.shift()!
                if(p[0] == 'clean') clean()
                else if (p[0] == 'stop') stop()
                else if (p[0] == 'skip') skip(p[1], p[2])
                else if (p[0] == 'execute') execute(p[1])
            }
        })
    }
}

const createConsole = () => {
    data.value.createModal = true
}
//#end1on

//#region UI Events
/**
 * Running the process
 * @param type How long does the step goes {@link process_type}
 * * 0: All Projects through
 * * 1: Single project through
 * * 2: SIngle task through
 */
const execute = (type:number) => {
    if(props.backend.config.haveBackend){
        props.backend.send('console_execute', model.value.record!.uuid, type)
    }else{
        model.value.record!.process_type = type
        model.value.record!.running = true
        model.value.record!.stop = false
        model.value.manager!.first = true
    }
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
    if(props.backend.config.haveBackend){
        if(type == 2) {
            data.value.skipModal = true
        }else{
            props.backend.send('console_skip', model.value.record?.uuid, type, state)
        }
    }else{
        if(type == 0){
            // Project
            model.value.record!.project_state[model.value.record!.project_index].state = state != undefined ? state : ExecuteState.FINISH
            model.value.record!.project_index += 1
            if(model.value.record!.project_index == model.value.record!.projects.length) {
                model.value.record!.project_index = -1
                clean()
            }
            else {
                model.value.record!.task_state = model.value.record!.projects[model.value.record!.project_index].task.map(x => {
                    return {
                        uuid: x.uuid,
                        state: ExecuteState.NONE
                    }
                })
                model.value.record!.task_detail = []
                const p = model.value.record!.projects[model.value.record!.project_index]
                const t = p.task[model.value.record!.task_index]
                const count = model.value.manager!.get_task_state_count(t)
                for(let i = 0; i < count; i++){
                    model.value.record!.task_detail.push({
                        index: i,
                        node: "",
                        message: [],
                        state: ExecuteState.NONE
                    })
                }
                const index = model.value.manager!.SkipProject()
                console.log("Skip project, index: %d, next count: %d", index, count)
            }
        }else if (type == 1){
            // Task
            model.value.record!.task_state[model.value.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
            model.value.record!.task_index += 1
            if(model.value.record!.task_index == model.value.record!.task_state.length) {
                skip(0)
            }else{
                model.value.record!.task_state[model.value.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
                model.value.record!.task_detail = []
                const p = model.value.record!.projects[model.value.record!.project_index]
                const t = p.task[model.value.record!.task_index]
                const count = model.value.manager!.get_task_state_count(t)
                for(let i = 0; i < count; i++){
                    model.value.record!.task_detail.push({
                        index: i,
                        node: "",
                        message: [],
                        state: ExecuteState.NONE
                    })
                }
                const index = model.value.manager!.SkipTask()
                console.log("Skip task, index: %d, next count: %d", index, count)
            }
        }else if (type == 2){
            data.value.skipModal = true
        }
    }
}
/**
 * When user click confirm on the skip step modal
 */
const confirmSkip = (v:number) => {
    if(props.backend.config.haveBackend){
        props.backend.send('console_skip2', model.value.record?.uuid, v)
    }else{
        const index = model.value.manager!.SkipSubTask(v)
        if(index < 0) {
            console.error("Skip step failed: ", index)
            return
        }
        for(let i = 0; i < index; i++){
            model.value.record!.task_detail[i].state = ExecuteState.FINISH
        }
        console.log("Skip task", index)
    }
    data.value.skipModal = false
}
/**
 * Destroy all state and reset
 */
const clean = () => {
    stop()
    if(props.backend.config.haveBackend){
        props.backend.send('console_clean', model.value.record!.uuid)
    }else{
        model.value.manager!.Clean()
        model.value.record!.projects = []
        model.value.record!.project = ""
        model.value.record!.task = ""
        model.value.record!.project_index = -1
        model.value.record!.task_index = -1
        model.value.record!.project_state = []
        model.value.record!.task_state = []
        model.value.record!.task_detail = []
    }
    emits('stop')
    nextTick(() => {
        if(props.execute.length == 0) data.value.tag = 2
    })
}
/**
 * It means pause... but i just name it 'stop' anyway. you get the idea\
 * This will not destroy the state, it just stop the update thought\
 * If you want to destroy and reset all state, you should call {@link clean()} function instead
 */
const stop = () => {
    if(props.backend.config.haveBackend){
        props.backend.send('console_stop', model.value.record!.uuid)
    }else{
        model.value.record!.stop = true
        model.value.manager!.Stop()
    }
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
                <p v-if="model.record != undefined">{{ $t('execute') }}</p>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(0)" :disabled="model.record!.running" color="success">
                            <v-icon>mdi-step-forward-2</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-0') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(1)" :disabled="model.record!.running" color="success">
                            <v-icon>mdi-step-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-1') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="execute(2)" :disabled="model.record!.running" color="success">
                            <v-icon>mdi-play</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('execute-2') }}
                </v-tooltip>
                <p v-if="model.record != undefined">{{ $t('skip') }}</p>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(0)" :disabled="model.record!.running" color="info">
                            <v-icon>mdi-skip-forward</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('project') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(1)" :disabled="model.record!.running" color="info">
                            <v-icon>mdi-skip-next</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('task') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="skip(2)" :disabled="model.record!.running" color="info">
                            <v-icon>mdi-debug-step-over</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('step') }}
                </v-tooltip>
                <p v-if="model.record != undefined">{{ $t('action') }}</p>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="clean" :disabled="model.record!.running" color="error">
                            <v-icon>mdi-stop</v-icon>
                        </v-btn>
                    </template>
                    {{ $t('clean') }}
                </v-tooltip>
                <v-tooltip location="bottom" v-if="model.record != undefined">
                    <template v-slot:activator="{ props }">
                        <v-btn icon v-bind="props" @click="stop" :disabled="model.record!.stop" color="error">
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
        <v-row style="height: calc(100vh - 120px)" class="w-100">
            <v-col :cols="data.leftSize" class="border border-e-lg">
                <v-list v-model.number="data.tag" mandatory color="success" :style="{ 'fontSize': props.preference.font + 'px' }">
                    <v-list-item v-if="model.record != undefined" @click="data.tag = 0" :value="0" :active="data.tag == 0">
                        {{ $t('console.list') }}
                    </v-list-item>
                    <v-list-item v-if="model.record != undefined" @click="data.tag = 1" :value="1" :active="data.tag == 1">
                        {{ $t('console.dashboard') }}
                    </v-list-item>
                    <v-list-item v-if="model.record != undefined" @click="data.tag = 3" :value="3" :active="data.tag == 3">
                        {{ $t('console.parameter') }}
                    </v-list-item>
                    <v-list-item @click="data.tag = 2" :value="2" :active="data.tag == 2">
                        Debug Log
                    </v-list-item>
                </v-list>
                <v-list mandatory v-if="props.execute.length > 0" color="success" :style="{ 'fontSize': props.preference.font + 'px' }">
                    <v-list-item v-for="(exe, i) in props.execute" :key="i" 
                        :active="exe.record?.uuid == model.record?.uuid"
                        @click="emits('select', i)">
                        <v-list-item-title>
                            {{ exe.record?.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ exe.record?.uuid }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
            </v-col>
            <v-col v-if="model.record != undefined" :cols="data.rightSize" v-show="data.tag == 0">
                <List v-model="model" :preference="props.preference" />
            </v-col>
            <v-col v-if="model.record != undefined" :cols="data.rightSize" v-show="data.tag == 1">
                <Process v-model="model" :socket="props.socket" :preference="props.preference" />
            </v-col>
            <v-col :cols="data.rightSize" v-show="data.tag == 2">
                <DebugLog :preference="props.preference" />
            </v-col>
            <v-col v-if="model.record != undefined" :cols="data.rightSize" v-show="data.tag == 3">
                <ParameterPage v-model="model.record!.para" :preference="props.preference" />
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