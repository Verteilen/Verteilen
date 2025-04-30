<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { messager_log, set_feedback } from '../debugger';
import { BusAnalysis, BusType, ExecuteRecord, ExecutionLog, Job, JobCategory, JobType, JobType2, NodeProxy, NodeTable, Parameter, Preference, Project, Property, Record, Rename, RENDER_FILE_UPDATETICK, RENDER_UPDATETICK, Task, WebsocketPack } from '../interface';
import { BackendProxy } from '../proxy';
import { ExecuteManager } from '../script/execute_manager';
import { WebsocketManager } from '../script/socket_manager';
import { Util_Server_Console_Proxy } from '../util/server/console_handle';
import { Util_Server_Log_Proxy } from '../util/server/log_handle';
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

const config = computed(() => props.backend.config)
const props = defineProps<PROPS>()
const tabs:Ref<Array<[string, string, number]>> = ref([])
const data:Ref<DATA> = ref({
    websocket_manager: undefined,
    execute_manager: [],

    drawer: false,
    title: "",
    page: 0,
    select_manager: 0,
    lanSelect: i18n.global.locale as string,
    parameters: [],
    projects: [],
    libs: {libs: []},
    logs: {logs: []},
    selectProject: undefined,
    selectTask: undefined,
    selectParameter: undefined,
    nodes: [],
    messages: []
})

const util:Util_Server = new Util_Server(data, () => props.backend, emitter!)

const selectExecute = computed(() => data.value.execute_manager[data.value.select_manager])

watch(() => data.value.page, () => {
  const tab = tabs.value.find(x => x[2] == data.value.page)!
  data.value.page = tab[2]; 
  data.value.title = tab[1]; 
  data.value.drawer = false
})

const allUpdate = () => util.allUpdate()
const saveRecord = () => util.saveRecord()

//#region Project
const addProject = (v:Array<Project>) => util.project.addProject(v)
const editProject = (id:string, v:Project) => util.project.editProject(id, v)
const deleteProject = (uuids:Array<string>, bind:boolean) => util.project.deleteProject(uuids, bind)
const chooseProject = (uuid:string) => util.project.chooseProject(uuid)
const moveupProject = (uuid:string) => util.project.moveupProject(uuid)
const movedownProject = (uuid:string) => util.project.movedownProject(uuid)
//#endregion

//#region Task
const addTask = (v:Array<Task>) => util.task.addTask(v)
const editTask = (id:string, v:Task) => util.task.editTask(id, v)
const deleteTask = (uuids:Array<string>) => util.task.deleteTask(uuids)
const chooseTask = (uuid:string) => util.task.chooseTask(uuid)
const bindingTask = (uuid:string) => util.task.bindingTask(uuid)
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
const addParameter = (e:Parameter) => util.parameter.addParameter(e)
const selectParameter = (e:string) => util.parameter.selectParameter(e)
const editParameter = (e:Parameter) => util.parameter.editParameter(e)
const deleteParameter = (e:string) => util.parameter.deleteParameter(e)
const goParameter = (e:string) => {
  data.value.page = 3
  nextTick(() => emitter?.emit('selectParameter', e))
}
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

//#region Console
const consoleAdded = (name:string, record:Record) => {
  const em:ExecuteManager = new ExecuteManager(
    name,
    data.value.websocket_manager!, 
    messager_log, 
    JSON.parse(JSON.stringify(record))
  )
  const er:ExecuteRecord = {
    ...record,
    running: false,
    stop: true,
    process_type: -1,
    useCron: false,
    para: undefined,
    command: [],
    project: '',
    task: '',
    project_index: -1,
    task_index: -1,
    project_state: [],
    task_state: [],
    task_detail: [],
  }
  em.libs = data.value.libs
  const p:[ExecuteManager, ExecuteRecord] = [em, er]
  const uscp:Util_Server_Console_Proxy = new Util_Server_Console_Proxy(p)
  const uslp:Util_Server_Log_Proxy = new Util_Server_Log_Proxy(p, data.value.logs, props.preference, config.value)
  em.proxy = util.CombineProxy([uscp.execute_proxy, uslp.execute_proxy])
  const r = util.console.receivedPack(p, record)
  if(!r){
    emitter?.emit('makeToast', {
        title: 'Execute Failed',
        message: 'Project execute failed !\nYou can see detail in Console/DebugLog',
        type: 'warning'
    })
    return
  }
  data.value.execute_manager.push(p)
  data.value.select_manager = data.value.execute_manager.length - 1
}
const consoleStop = () => {
  nextTick(() => {
    data.value.execute_manager[data.value.select_manager][0].Release()
    data.value.execute_manager.splice(data.value.select_manager, 1)
    if(data.value.execute_manager.length == 0) data.value.select_manager = -1
    else data.value.select_manager = 0
  })
}
const consoleSelect = (e:number) => { data.value.select_manager = e }
//#endregion

//#region Log
const LogClean = (index:number) => {
  props.backend.send('delete_log', data.value.logs.logs[index])
  if(!config.value.isElectron) return
  window.electronAPI.send('delete_all_log')
  data.value.logs.logs = []
}
//#endregion

//#region Self
const msgAppend = (d:Array<string | undefined>) => util.self.msgAppend(d)
const msgClean = () => util.self.clearMessage()
//#endregion

//#region Web
const Cookie = () => {
  
}
//#endregion

const updateLocate = () => {
  updateTab()
}

const updateTab = () => {
  tabs.value = [
    ["", "toolbar.editor", -1],
    ["mdi-cube", "toolbar.project", 0],
    ["mdi-calendar", "toolbar.task", 1],
    ["mdi-hammer", "toolbar.job", 2],
    ["mdi-database", "toolbar.parameter", 3],
    ["", "toolbar.server", -1],
    ["mdi-network", "toolbar.node", 4],
    ["mdi-console-line", "toolbar.console", 5],
  ]
  if(config.value.haveBackend){
    tabs.value.push(["mdi-text-box-outline", "toolbar.log", 6])
    tabs.value.push(["mdi-puzzle", "toolbar.library", 7])
    tabs.value.push(["mdi-nodejs", "toolbar.client", 8])
  }
}

const menuCreateProject = () => {
  data.value.page = 0
}

const menu_export_project = () => {
  if(config.value.isElectron) window.electronAPI.send("export_project", JSON.stringify(data.value.projects))
}

const import_project_feedback = (text:string) => {
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
  data.value.execute_manager.forEach(y => {
    y[0].NewConnection(x)
  })
}

const disconnect = (x:WebsocketPack) => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-remove-title'),
    type: 'danger',
    message: `${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
  })
  data.value.execute_manager.forEach(y => {
    y[0].Disconnect(x)
  })
}

const onAnalysis = (d:BusAnalysis) => {
  data.value.execute_manager.forEach(x => x[0].Analysis(JSON.parse(JSON.stringify(d))))
}

const popSetting = () => {
  emitter?.emit('setting')
}

onMounted(() => {
  set_feedback(debug_feedback)
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), RENDER_UPDATETICK);
  slowUpdateHandle = setInterval(() => emitter?.emit('slowUpdateHandle'), RENDER_FILE_UPDATETICK);
  emitter?.on('updateNode', server_clients_update)
  emitter?.on('renameScript', libRename)
  emitter?.on('deleteScript', libDelete)
  emitter?.on('updateLocate', updateLocate)

  props.backend.wait_init().then(() => {
    updateTab()
    data.value.title = tabs.value.find(x => x[2] == 0)![1]
    const x = config.value
    if(!x.isExpress){
      const nodeproxy:NodeProxy = {
        shellReply: data => { emitter?.emit('shellReply', data) },
        folderReply: data => { emitter?.emit('folderReply', data) },
      }
      data.value.websocket_manager = new WebsocketManager(newConnect, disconnect, onAnalysis, messager_log, nodeproxy)
    }

    props.backend.eventOn('msgAppend', msgAppend)
    props.backend.send('menu', true)
    props.backend.eventOn('createProject', menuCreateProject)
    props.backend.eventOn('menu_export_project', menu_export_project)
    props.backend.eventOn('import_project_feedback', import_project_feedback)
    props.backend.send('client_start');
    const p1 = props.backend.invoke('load_all_node').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.nodes.push(...texts.map(y => JSON.parse(y)))
    })
    const p2 = props.backend.invoke('load_all_lib').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.libs = { libs: texts.map(y => JSON.parse(y)) }
      console.log("Libs", data.value.libs)
    })
    const p3 = props.backend.invoke('load_all_record').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.projects.push(...texts.map(y => JSON.parse(y)))
    })
    const p4 = props.backend.invoke('load_record_obsolete').then(x => {
      if(x == undefined) return
      const texts:Record = JSON.parse(x)
      const n:Array<NodeTable> = texts.nodes.map(y => {
        return Object.assign(y, {
          s: false,
          state: 0,
          connection_rate: 0
        })
      })
      data.value.nodes.push(...n)
      texts.projects.forEach(y => {
        const p:Parameter = JSON.parse(JSON.stringify(y.parameter))
        p.title = y.title
        p.uuid = uuidv6()
        data.value.parameters.push(p)
        y.parameter = undefined
        y.parameter_uuid = p.uuid
        data.value.projects.push(y)
      })
    })
    const p5 = props.backend.invoke('load_all_parameter').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.parameters = texts.map(y => JSON.parse(y))
      console.log("Parameters", data.value.libs)
    })
    const p6 = props.backend.invoke('load_all_log').then(x => {
        const stringlist:Array<string> = JSON.parse(x)
        const ll:Array<ExecutionLog> = stringlist.map(x => JSON.parse(x))
        ll.forEach(x => x.output = true)
        console.log("Logs", ll)
        data.value.logs.logs = ll
    })
    Promise.all([p1, p2, p3, p4, p5, p6]).then(() => {
      data.value.nodes = data.value.nodes.map(y => {
        return Object.assign(y, {
          s: false,
          state: 0,
          connection_rate: 0
        })
      })
      data.value.nodes.forEach(y => {
        data.value.websocket_manager?.server_start(y.url, y.ID)
      })
      nextTick(() => allUpdate())
    })
  })
})

onUnmounted(() => {
  data.value.execute_manager = []
  emitter?.off('updateNode', server_clients_update)
  emitter?.off('renameScript', libRename)
  emitter?.off('deleteScript', libDelete)
  emitter?.off('updateLocate', updateLocate)
  if(updateHandle != undefined) clearInterval(updateHandle)
  if(slowUpdateHandle != undefined) clearInterval(slowUpdateHandle)
  props.backend.send('client_stop');
  props.backend.eventOff('createProject', menuCreateProject)
  props.backend.eventOff('menu_export_project', menu_export_project)
  props.backend.eventOff('import_project_feedback', import_project_feedback)
  props.backend.eventOff('msgAppend', msgAppend)
})

</script>

<template>
  <v-container fluid class="pa-0 ma-0">
    <v-layout>
      <v-app-bar :elevation="2" class="text-left">
        <template v-slot:prepend>
          <v-app-bar-nav-icon @click="data.drawer = true"></v-app-bar-nav-icon>
        </template>
        <v-app-bar-title>{{ data.title ? $t(data.title) : '' }}</v-app-bar-title>
        <template v-slot:append>
          <v-menu location="left">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical"></v-btn>
            </template>
            <v-list width="120px">
              <v-list-item @click="popSetting">{{ $t('toolbar.setting') }}</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-app-bar>
      <v-navigation-drawer temporary v-model="data.drawer">
        <v-list density="compact" nav>
          <div v-for="(tab, index) in tabs" :key="index">
            <v-list-item v-if="tab[2] >= 0"
              :style="{ 'fontSize': props.preference.font + 'px' }"
              :prepend-icon="tab[0]"
              :value="tab[2]" 
              :active="data.page == tab[2]"
              @click="data.page = tab[2]">{{ $t(tab[1]) }}</v-list-item>
            <v-list-subheader v-else>{{ $t(tab[1]) }}</v-list-subheader>
          </div>
          
        </v-list>
      </v-navigation-drawer>
    </v-layout>
    <div style="width: 100vw; height:100vh; padding-top: 50px; background-color: red;" class="bg-grey-darken-4 text-white">
      <v-tabs-window v-model="data.page">
        <v-tabs-window-item :value="0">
          <ProjectPage
            :projects="data.projects" 
            :parameters="data.parameters"
            :config="config"
            :preference="props.preference"
            @added="e => addProject(e)" 
            @edit="(id, e) => editProject(id, e)" 
            @select="e => chooseProject(e)" 
            @delete="(e, e2) => deleteProject(e, e2)"
            @moveup="e => moveupProject(e)"
            @movedown="e => movedownProject(e)" />
        </v-tabs-window-item>
        <v-tabs-window-item :value="1">
          <TaskPage
            :projects="data.projects" 
            :select="data.selectProject" 
            :preference="props.preference"
            :parameters="data.parameters"
            @added="e => addTask(e)" 
            @edit="(id, e) => editTask(id, e)" 
            @select="e => chooseTask(e)"
            @bind="e => bindingTask(e)"
            @delete="e => deleteTask(e)"
            @moveup="e => moveupTask(e)"
            @movedown="e => movedownTask(e)"
            @parameter="e => goParameter(e)"
            @return="data.page = 0"/>
        </v-tabs-window-item>
        <v-tabs-window-item :value="2">
          <JobPage
            :projects="data.projects" 
            :select="data.selectTask"
            :owner="data.selectProject"
            :libs="data.libs"
            @added="e => addJob(e)" 
            @edit="(e, e2) => editJob(e, e2)" 
            @delete="e => deleteJob(e)"
            @return="data.page = 1"/>
        </v-tabs-window-item>
        <v-tabs-window-item :value="3">
          <ParameterPage
            :config="config"
            :parameters="data.parameters"
            :select="data.selectParameter"
            :preference="props.preference"
            @added="e => addParameter(e)"
            @select="e => selectParameter(e)"
            @edit="e => editParameter(e)" 
            @delete="e => deleteParameter(e)"
            @return="data.page = 1"/>
        </v-tabs-window-item>
        <v-tabs-window-item :value="4">
          <NodePage
            :manager="data.websocket_manager"
            :config="config"
            :nodes="data.nodes" />
        </v-tabs-window-item>
        <v-tabs-window-item :value="5">
          <ConsolePage
            :config="config"
            :preference="props.preference"
            :socket="data.websocket_manager"
            :execute="data.execute_manager"
            :libs="data.libs"
            :projects="data.projects"
            :nodes="data.nodes"
            :parameters="data.parameters"
            v-model="selectExecute"
            @added="(e, e1) => consoleAdded(e, e1)"
            @stop="consoleStop()"
            @select="e => consoleSelect(e)"/>
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.haveBackend" :value="6">
          <LogPage 
            :config="config"
            :execute="data.execute_manager"
            :preference="props.preference"
            :logs="data.logs"
            @clean="LogClean"
            v-model="selectExecute"/>
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.haveBackend" :value="7">
          <LibraryPage
            :config="config"
            v-model="data.libs"/>
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.haveBackend" :value="8">
          <SelfPage
            :backend="props.backend"
            :messages="data.messages"
            :preference="props.preference"
            @clean="msgClean"/>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-container>
</template>
