<script setup lang="ts">
import { IpcRendererEvent } from 'electron';
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref } from 'vue';
import { messager_log, set_feedback } from '../debugger';
import { BusAnalysis, BusType, ExecuteProxy, ExecuteState, FeedBack, Job, JobCategory, JobType, JobType2, NodeTable, Parameter, Preference, Project, Property, Record, Rename, RENDER_FILE_UPDATETICK, RENDER_UPDATETICK, ShellFolder, Single, Task, WebsocketPack } from '../interface';
import { BackendProxy } from '../proxy';
import { ExecuteManager } from '../script/execute_manager';
import { WebsocketManager } from '../script/socket_manager';
import { DATA, Util_Server } from '../util/server/server';
import { i18n } from './../plugins/i18n';
import ConsolePage from './server/Console.vue';
import JobPage from './server/Job.vue';
import LibraryPage from './server/Library.vue';
import LogPage from './server/Log.vue';
import NodePage from './server/Node.vue';
import ParameterPage from './server/Parameter.vue';
import ProjectPage from './server/Project.vue';
import SelfPage from './server/Self.vue';
import TaskPage from './server/Task.vue';

const emitter:Emitter<BusType> | undefined = inject('emitter');
let updateHandle:any = undefined
let slowUpdateHandle:any = undefined

interface PROPS {
    preference: Preference
    backend: BackendProxy
}

const execute_proxy:ExecuteProxy = {
    executeProjectStart: (data:Project):void => { emitter?.emit('executeProjectStart', data) },
    executeProjectFinish: (data:Project):void => { emitter?.emit('executeProjectFinish', data) },
    executeTaskStart: (data:[Task, number]):void => { emitter?.emit('executeTaskStart', data) },
    executeTaskFinish: (data:Task):void => { emitter?.emit('executeTaskFinish', data) },
    executeSubtaskStart: (data:[Task, number, string]):void => { emitter?.emit('executeSubtaskStart', data) },
    executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { emitter?.emit('executeSubtaskUpdate', data) },
    executeSubtaskFinish: (data:[Task, number, string]):void => { emitter?.emit('executeSubtaskFinish', data) },
    executeJobStart: (data:[Job, number, string]):void => { emitter?.emit('executeJobStart', data) },
    executeJobFinish: (data:[Job, number, string, number]):void => { emitter?.emit('executeJobFinish', data) },
    feedbackMessage: (data:FeedBack):void => { emitter?.emit('feedbackMessage', data) },
    updateParameter: (data:Parameter):void => { emitter?.emit('updateRuntimeParameter', data) },
    shellReply: (data:Single):void => { emitter?.emit('shellReply', data) },
    folderReply: (data:ShellFolder) => { emitter?.emit('folderReply', data) }
}

const config = computed(() => props.backend.config)
const props = defineProps<PROPS>()
const data:Ref<DATA> = ref({
    websocket_manager: undefined,
    execute_manager: [],

    page: 0,
    lanSelect: i18n.global.locale as string,
    projects: [],
    projects_exe: {
      projects: [],
      nodes: [],
      running: false,
      stop: true,
      project: "",
      task: "",
      project_index: -1,
      task_index: -1,
      project_state: [],
      task_state: [],
      task_detail: [],
    },
    libs: {libs: []},
    selectProject: undefined,
    selectTask: undefined,
    nodes: []
})

const util:Util_Server = new Util_Server(data, () => config.value, emitter!)

const allUpdate = () => util.allUpdate()
const saveRecord = ():Record => util.saveRecord()

//#region Project
const addProject = (v:Array<Project>) => util.project.addProject(v)
const editProject = (id:string, v:Project) => util.project.editProject(id, v)
const deleteProject = (uuids:Array<string>) => util.project.deleteProject(uuids)
const chooseProject = (uuid:string) => util.project.chooseProject(uuid)
const moveupProject = (uuid:string) => util.project.moveupProject(uuid)
const movedownProject = (uuid:string) => util.project.movedownProject(uuid)
const executeProjects = (uuids:Array<string>, keep:boolean) => util.project.executeProjects(uuids, keep)
//#endregion

//#region Task
const addTask = (v:Array<Task>) => util.task.addTask(v)
const editTask = (id:string, v:Task) => util.task.editTask(id, v)
const deleteTask = (uuids:Array<string>) => util.task.deleteTask(uuids)
const chooseTask = (uuid:string) => util.task.chooseTask(uuid)
const moveupTask = (uuid:string) => util.task.moveupTask(uuid)
const movedownTask = (uuid:string) => util.task.movedownTask(uuid)
//#endregion

//#region Job
const addJob = (v:Array<Job>) => util.job.addJob(v)
const editJob = (v:Array<Job>, v2:Array<Property>) => util.job.editJob(v, v2)
const deleteJob = (uuids:Array<string>) => util.job.deleteJob(uuids)
//#endregion

//#region Node
const server_clients_update = (v:Array<NodeTable>) => util.node.server_clients_update(v)
//#endregion

//#region Parameter
const editParameter = (e:Parameter) => util.parameter.editParameter(e)
//#endregion

//#region Lib
const libRename = (d:Rename) => {
  data.value.projects.forEach(x => {
    x.task.forEach(y => {
      y.jobs.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.LUA) || (z.category == JobCategory.Execution && z.type == JobType.LUA)){
          const index = z.string_args.findIndex(x => x == d.oldname)
          if(index != -1) z.string_args[index] = d.newname
        }
      })
    })
  })
  allUpdate()
}

const libDelete = (name:string) => {
  data.value.projects.forEach(x => {
    x.task.forEach(y => {
      y.jobs.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.LUA) || (z.category == JobCategory.Execution && z.type == JobType.LUA)){
          const index = z.string_args.findIndex(x => x == name)
          if(index != -1) z.string_args.splice(index, 1)
        }
      })
    })
  })
  allUpdate()
}
//#endregion

//#region Web
const Cookie = () => {
  
}
//#endregion

const menuCreateProject = (e:IpcRendererEvent) => {
  data.value.page = 0
}

const menu_export_project = (e:IpcRendererEvent) => {
  if(config.value.isElectron) window.electronAPI.send("export_project", JSON.stringify(data.value.projects))
}

const import_project_feedback = (e:IpcRendererEvent, text:string) => {
  const ps:Array<Project> = JSON.parse(text)
  for(const p of ps){
    for(const t of p.task){
      for(const j of t.jobs){
        j.uuid = uuidv6()
      }
      t.uuid = uuidv6()
    }
    p.uuid = uuidv6()
  }
  data.value.projects.push(...ps)
  saveRecord()
  allUpdate()
}

const run_all = (e:IpcRendererEvent) => {
  executeProjects(data.value.projects.map(x => x.uuid), false)
}

const run_all_keep = (e:IpcRendererEvent) => {
  executeProjects(data.value.projects.map(x => x.uuid), true)
}

const debug_feedback = (e:string) => emitter?.emit('debuglog', e)

const onChangeLan = (e:string) => {
  data.value.lanSelect = e
  // @ts-ignore
  i18n.global.locale = e
  if(!config.value.isElectron) return
  window.electronAPI.send('save_preference', JSON.stringify(props.preference, null, 4))
}

const newConnect = (x:WebsocketPack) => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-create-title'),
    type: 'success',
    message: `${i18n.global.t('toast.connection-create-des')}: ${x.websocket.url} \n${x.uuid}`
  })
  data.value.execute_manager[0].NewConnection(x)
}

const testToast = () => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-create-title'),
    type: 'success',
    message: `Hello World`
  })
}

const disconnect = (x:WebsocketPack) => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-remove-title'),
    type: 'danger',
    message: `${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
  })
  data.value.execute_manager[0].Disconnect(x)
}

const analysis = (b:BusAnalysis) => {
  data.value.execute_manager[0]?.Analysis(b)
}

onMounted(() => {
  set_feedback(debug_feedback)
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), RENDER_UPDATETICK);
  slowUpdateHandle = setInterval(() => emitter?.emit('slowUpdateHandle'), RENDER_FILE_UPDATETICK);
  emitter?.on('updateNode', server_clients_update)
  emitter?.on('renameScript', libRename)
  emitter?.on('deleteScript', libDelete)

  props.backend.wait_init().then(() => {
    const x = config.value
    if(!x.isExpress){
      data.value.websocket_manager = new WebsocketManager(newConnect, disconnect, analysis, messager_log)
      data.value.execute_manager.push(new ExecuteManager(data.value.websocket_manager, messager_log))
      data.value.execute_manager[0].libs = data.value.libs
      data.value.execute_manager[0].proxy = execute_proxy
      data.value.websocket_manager.newConnect = newConnect
      data.value.websocket_manager.disconnect = disconnect
      data.value.websocket_manager.onAnalysis = data.value.execute_manager[0].Analysis
    }

    if(config.value.isElectron){
      window.electronAPI.send('menu', true)
      window.electronAPI.eventOn('createProject', menuCreateProject)
      window.electronAPI.eventOn('menu_export_project', menu_export_project)
      window.electronAPI.eventOn('run_all', run_all)
      window.electronAPI.eventOn('run_all_keep', run_all_keep)
      window.electronAPI.eventOn('import_project_feedback', import_project_feedback)
      const p1 = window.electronAPI.invoke('load_all_node').then(x => {
        const texts:Array<string> = JSON.parse(x)
        data.value.nodes = texts.map(y => JSON.parse(y))
        data.value.nodes = data.value.nodes.map(y => {
          return Object.assign(y, {
            s: false,
            state: 0,
            connection_rate: 0
          })
        })
        data.value.nodes.forEach(y => {
          data.value.websocket_manager?.server_start(y.url)
        })
      })
      const p2 = window.electronAPI.invoke('load_all_lib').then(x => {
        const texts:Array<string> = JSON.parse(x)
        data.value.libs = { libs: texts.map(y => JSON.parse(y)) }
        console.log("Libs", data.value.libs)
      })
      const p3 = window.electronAPI.invoke('load_all_record').then(x => {
        const texts:Array<string> = JSON.parse(x)
        data.value.projects = texts.map(y => JSON.parse(y))
      })
      Promise.all([p1, p2, p3]).then(() => {
        nextTick(() => allUpdate())
      })
    }
  })
})

onUnmounted(() => {
  data.value.execute_manager = []
  emitter?.off('updateNode', server_clients_update)
  emitter?.off('renameScript', libRename)
  emitter?.off('deleteScript', libDelete)
  if(updateHandle != undefined) clearInterval(updateHandle)
  if(slowUpdateHandle != undefined) clearInterval(slowUpdateHandle)
  if(config.value.isElectron) {
    window.electronAPI.eventOff('createProject', menuCreateProject)
    window.electronAPI.eventOff('menu_export_project', menu_export_project)
    window.electronAPI.eventOff('run_all', run_all)
    window.electronAPI.eventOff('run_all_keep', run_all_keep)
    window.electronAPI.eventOff('import_project_feedback', import_project_feedback)
  }
})

</script>

<template>
  <v-container fluid class="pa-0 ma-0">
    <v-tabs v-model="data.page" tabs style="position: fixed; z-index: 1; width: 100vw; height:50px;" class="bg-grey-darken-4">
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="0"><v-icon>mdi-cube</v-icon></v-tab>
        </template>
        {{ $t('toolbar.project') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="1"><v-icon>mdi-calendar</v-icon></v-tab>
        </template>
        {{ $t('toolbar.task') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="2"><v-icon>mdi-hammer</v-icon></v-tab>
        </template>
        {{ $t('toolbar.job') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="3"><v-icon>mdi-database</v-icon></v-tab>
        </template>
        {{ $t('toolbar.parameter') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="4"><v-icon>mdi-network</v-icon></v-tab>
        </template>
        {{ $t('toolbar.node') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="5"><v-icon>mdi-console-line</v-icon></v-tab>
        </template>
        {{ $t('toolbar.console') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="6"><v-icon>mdi-text-box-outline</v-icon></v-tab>
        </template>
        {{ $t('toolbar.log') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="7"><v-icon>mdi-puzzle</v-icon></v-tab>
        </template>
        {{ $t('toolbar.library') }}
      </v-tooltip>
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-tab v-bind="props" style="font-size: larger;" :value="8"><v-icon>mdi-nodejs</v-icon></v-tab>
        </template>
        {{ $t('toolbar.client') }}
      </v-tooltip>
      <v-tab @click="testToast"><v-icon>mdi-pen</v-icon></v-tab>
    </v-tabs>
    <div style="width: 100vw; height:100vh; padding-top: 50px; background-color: red;" class="bg-grey-darken-4 text-white">
      <ProjectPage v-show="data.page == 0" 
        :projects="data.projects" 
        :config="config"
        :preference="props.preference"
        @added="e => addProject(e)" 
        @edit="(id, e) => editProject(id, e)" 
        @select="e => chooseProject(e)" 
        @delete="e => deleteProject(e)"
        @moveup="e => moveupProject(e)"
        @movedown="e => movedownProject(e)" 
        @execute="(e, keep) => executeProjects(e, keep)"/>

      <TaskPage v-show="data.page == 1" 
        :projects="data.projects" 
        :select="data.selectProject" 
        :preference="props.preference"
        @added="e => addTask(e)" 
        @edit="(id, e) => editTask(id, e)" 
        @select="e => chooseTask(e)"
        @delete="e => deleteTask(e)"
        @moveup="e => moveupTask(e)"
        @movedown="e => movedownTask(e)"
        @parameter="data.page = 3" />

      <JobPage v-show="data.page == 2" 
        :projects="data.projects" 
        :select="data.selectTask"
        :owner="data.selectProject"
        :libs="data.libs"
        @added="e => addJob(e)" 
        @edit="(e, e2) => editJob(e, e2)" 
        @delete="e => deleteJob(e)" />

      <ParameterPage v-show="data.page == 3" 
        :config="config"
        :select="data.selectProject"
        :preference="props.preference"
        @edit="e => editParameter(e)" />

      <NodePage v-show="data.page == 4" 
        :manager="data.websocket_manager"
        :config="config"
        :nodes="data.nodes" />

      <ConsolePage v-show="data.page == 5" 
        :config="config"
        :preference="props.preference"
        :socket="data.websocket_manager"
        :execute="data.execute_manager"
        :libs="data.libs"
        v-model="data.projects_exe"/>
        
      <LogPage v-show="data.page == 6" 
        :config="config"
        :execute="data.execute_manager"
        :preference="props.preference"
        v-model="data.projects_exe"/>

      <LibraryPage v-show="data.page == 7" 
        :config="config"
        v-model="data.libs"/>

      <SelfPage v-show="data.page == 8" 
        :config="config"
        :preference="props.preference"/>
    </div>
  </v-container>
</template>

<style scoped>

</style>
