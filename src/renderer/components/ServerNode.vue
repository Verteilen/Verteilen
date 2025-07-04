<script setup lang="ts">
import { Emitter } from 'mitt';
import { v6 as uuidv6 } from 'uuid';
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue';
import { messager_log, set_feedback } from '../debugger';
import { BusAnalysis, BusType, ExecuteRecord, ExecutionLog, Job, JobCategory, JobType, JobType2, NodeProxy, NodeTable, Parameter, Preference, Project, Property, Record, Rename, RENDER_FILE_UPDATETICK, RENDER_UPDATETICK, Task, WebsocketPack, WebPORT, ConsolePORT, ExecutePair, FrontendUpdate } from '../interface';
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
import RolePage from './server/Role.vue';
import ServicePage from './server/Service.vue';
import ProfilePage from './server/Profile.vue';
import PluginPage from './server/Plugin.vue';
import { ConsoleManager } from '../script/console_manager';

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
    messages: [],
    plugin: { plugins: [], templates: [] }
})

const util:Util_Server = new Util_Server(data, () => props.backend, emitter!)

const selectExecute = computed(() => data.value.execute_manager[data.value.select_manager])

watch(() => data.value.page, () => {
  const tab = tabs.value.find(x => x[2] == data.value.page)!
  data.value.drawer = false
  if(tab == undefined) return
  data.value.page = tab[2]; 
  data.value.title = tab[1]; 
})

const allUpdate = () => util.allUpdate()
const saveRecord = () => util.saveRecord()

// #region Project
const addProject = (v:Array<Project>) => util.project.addProject(v)
const editProject = (id:string, v:Project) => util.project.editProject(id, v)
const deleteProject = (uuids:Array<string>, bind:boolean) => util.project.deleteProject(uuids, bind)
const chooseProject = (uuid:string) => util.project.chooseProject(uuid)
const moveupProject = (uuid:string) => util.project.moveupProject(uuid)
const movedownProject = (uuid:string) => util.project.movedownProject(uuid)
// #endregion

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
const libFresh = () => {
  props.backend.invoke('list_all_lib').then(x => {
    const texts:Array<any> = JSON.parse(x)
    console.log("list_all_lib", texts) 
    data.value.libs = { libs: texts.map(y => {
      const ext = y.split('.').pop()
      const r = {
        name: y.slice(0, -(ext.length + 1)),
        load: false,
        content: ""
      }
      return r
    })}
    console.log("Libs", data.value.libs)
  })
}
const libEdit = (oldname:string, newname:string) => { 
  props.backend.send("rename_lib", oldname, newname) 
  libFresh()
}
const libSave = (file:string, content:string, refresh: boolean) => { 
  props.backend.send('save_lib', file, content)
  if(refresh) libFresh()
}
const libLoad = (file:string) => {
  const ext = file.split('.').pop()!
  const name = file.slice(0, -(ext.length + 1))
  props.backend.invoke('load_lib', file).then(r => {
    const target = data.value.libs.libs.find(x => x.name == name)
    console.log(r)
    if(target == undefined) return
    target.load = true
    target.content = r
  }).catch(err => console.error(err))
}
const libDelete = (file:string) => {
  props.backend.send('delete_lib', file)
  data.value.projects.forEach(x => {
    x.task.forEach(y => {
      y.jobs.forEach(z => {
        if((z.category == JobCategory.Condition && z.type == JobType2.JAVASCRIPT) || (z.category == JobCategory.Execution && z.type == JobType.JAVASCRIPT)){
          const index = z.string_args.findIndex(x => x == file)
          if(index != -1) z.string_args.splice(index, 1)
        }
      })
    })
  })
  allUpdate()
}
const libJs = (code:string) => { props.backend.send('javascript', code) }
//#endregion

//#region Console
const consoleAdded = (name:string, record:Record) => {
  if(props.backend.config.haveBackend){
    // If we have backend, the instance should be place in the backend
    props.backend.invoke('console_add', name, record).then(r => {
      if(r != undefined){
        data.value.execute_manager.push({ record: r })
        data.value.select_manager = data.value.execute_manager.length - 1
      }else{
        emitter?.emit('makeToast', {
          title: 'Execute Failed',
          message: 'Project execute failed !\nYou can see detail in Console/DebugLog',
          type: 'warning'
        })
      }
    })
  }else{
    let r:boolean = false
    const em:ExecuteManager = new ExecuteManager(
      name,
      data.value.websocket_manager!, 
      messager_log, 
      JSON.parse(JSON.stringify(record))
    )
    const er:ExecuteRecord = {
      ...record,
      uuid: em.uuid,
      name: name,
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
    const p:ExecutePair = {manager: em, record: er}
    const uscp:Util_Server_Console_Proxy = new Util_Server_Console_Proxy(p)
    const uslp:Util_Server_Log_Proxy = new Util_Server_Log_Proxy(p, data.value.logs, props.preference, config.value)
    em.proxy = util.CombineProxy([uscp.execute_proxy, uslp.execute_proxy])
    r = util.console.receivedPack(p, record)
    if(r){
      data.value.execute_manager.push(p)
      data.value.select_manager = data.value.execute_manager.length - 1
    }else{
      emitter?.emit('makeToast', {
        title: 'Execute Failed',
        message: 'Project execute failed !\nYou can see detail in Console/DebugLog',
        type: 'warning'
      })
    }
    if(!r){
  }
  }
}
const consoleStop = () => {
  nextTick(() => {
    if(!props.backend.config.haveBackend){
      data.value.execute_manager[data.value.select_manager].manager!.Release()
    }
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
  if(!props.backend.config.haveBackend) return
  props.backend.send('delete_all_log')
  data.value.logs.logs = []
}
//#endregion

//#region Self
const msgAppend = (d:Array<string | undefined>) => util.self.msgAppend(d)
const msgClean = () => util.self.clearMessage()
//#endregion

//#region Plugin
const pluginAdded = (name:string, url:string) => {
  props.backend.invoke("import_plugin", name, url, props.preference.plugin_token.map(x => x.token).join(' ')).then(x => {
    data.value.plugin = JSON.parse(x)
  })
}
const templateAdded = (name:string, url:string) => {
  props.backend.invoke("import_template", name, url, props.preference.plugin_token.map(x => x.token).join(' ')).then(x => {
    data.value.plugin = JSON.parse(x)
  })
}
const pluginDelete = (name:string) => {
  props.backend.invoke("import_plugin_delete", name).then(x => {
    data.value.plugin = JSON.parse(x)
  })
}
const templateDelete = (name:string) => {
  props.backend.invoke("import_template_delete", name).then(x => {
    data.value.plugin = JSON.parse(x)
  })
}
//#endregion

const updateLocate = () => {
  updateTab()
}

const updateHandleCall = () => {
  if(props.backend.config.haveBackend){
  }
}

const updateTab = () => {
  tabs.value = [
    ["", "toolbar.editor", -1],
    ["mdi-cube", "toolbar.project", 0],
    ["mdi-calendar", "toolbar.task", 1],
    ["mdi-hammer", "toolbar.job", 2],
    ["mdi-database", "toolbar.parameter", 3],
    ["", "toolbar.compute", -1],
    ["mdi-network", "toolbar.node", 4],
    ["mdi-console-line", "toolbar.console", 5],
  ]
  
  if(config.value.haveBackend){
    tabs.value.push(["mdi-puzzle", "toolbar.plugin", 11])
    tabs.value.push(["", "toolbar.backend", -1])
    tabs.value.push(["mdi-text-box-outline", "toolbar.log", 6])
    tabs.value.push(["mdi-xml", "toolbar.library", 7])
  }
  if((config.value.isExpress && config.value.isAdmin) || config.value.isElectron){
    tabs.value.push(["mdi-nodejs", "toolbar.client", 8])
  }

  if(config.value.isExpress && config.value.isAdmin){
    tabs.value.push(["", "toolbar.server", -1])
    tabs.value.push(["mdi-lock", "toolbar.role", 9])
    tabs.value.push(["mdi-cog-play", "toolbar.service", 10])
  }
}

const menuCreateProject = () => {
  data.value.page = 0
}

const menu_export_project = () => {
  if(!props.backend.config.haveBackend) return
  props.backend.send("export_project", JSON.stringify(data.value.projects))
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

const newConnect = (x:WebsocketPack) => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-create-title'),
    type: 'success',
    message: `${i18n.global.t('toast.connection-create-des')}: ${x.websocket.url} \n${x.uuid}`
  })
  data.value.execute_manager.forEach(y => {
    y.manager!.NewConnection(x)
  })
}

const disconnect = (x:WebsocketPack) => {
  emitter?.emit('makeToast', {
    title: i18n.global.t('toast.connection-remove-title'),
    type: 'danger',
    message: `${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
  })
  data.value.execute_manager.forEach(y => {
    y.manager!.Disconnect(x)
  })
}

const onAnalysis = (d:BusAnalysis) => {
  data.value.execute_manager.forEach(x => x.manager!.Analysis(JSON.parse(JSON.stringify(d))))
}

const popSetting = () => { emitter?.emit('setting') }

const hotkey = (event:KeyboardEvent) => {
  if (event.altKey && Number(event.key) >= 1 && Number(event.key) <= 7) {
    event.preventDefault()
    if(event.key == "1") data.value.page = 0
    else if(event.key == "2") data.value.page = 1
    else if(event.key == "3") data.value.page = 2
    else if(event.key == "4") data.value.page = 3
    else if(event.key == "5") data.value.page = 4
    else if(event.key == "6") data.value.page = 5
    else if(event.key == "7") data.value.page = 6
  }
}

const repull = (u:FrontendUpdate) => {
  const c: Array<Promise<void>> = []
  if((u & FrontendUpdate.PROJECT) == FrontendUpdate.PROJECT){
    const p3 = props.backend.invoke('load_all_record').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.projects.push(...texts.map(y => JSON.parse(y)))
      console.log(data.value.projects)
    })
    c.push(p3)
  }
  if((u & FrontendUpdate.PARAMETER) == FrontendUpdate.PARAMETER){
    const p5 = props.backend.invoke('load_all_parameter').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.parameters = texts.map(y => JSON.parse(y))
      console.log("Parameters", data.value.libs)
    })
    c.push(p5)
  }
  return c
}

const makeToastFromBackend = (e:string) => {
    console.log("makeToastFromBackend", e)
    emitter?.emit('makeToast', JSON.parse(e))
}

const dataset_init = () => {
  updateTab()
  data.value.title = tabs.value.find(x => x[2] == 0)![1]
  const x = config.value
  if(!x.haveBackend){
    const nodeproxy:NodeProxy = {
      shellReply: data => { emitter?.emit('shellReply', data) },
      folderReply: data => { emitter?.emit('folderReply', data) },
    }
    data.value.websocket_manager = new WebsocketManager(newConnect, disconnect, onAnalysis, messager_log, nodeproxy)
  }
  else
  {
    props.backend.eventOn('shellReply', (data) => emitter?.emit('shellReply', data) )
    props.backend.eventOn('folderReply', (data) => emitter?.emit('folderReply', data) )
    props.backend.eventOn('frontend_update', repull)
  }

  props.backend.eventOn('makeToast', makeToastFromBackend)
  props.backend.eventOn('msgAppend', msgAppend)
  props.backend.send('menu', true)
  props.backend.eventOn('createProject', menuCreateProject)
  props.backend.eventOn('menu_export_project', menu_export_project)
  props.backend.eventOn('import_project_feedback', import_project_feedback)
  if(!props.backend.config.haveBackend) return
  props.backend.send('client_start');
  const p0 = props.backend.invoke('console_list').then((xs:Array<any>) => {
    data.value.execute_manager = xs.map(x => ({ record: x }))
    console.log("execute", data.value.execute_manager)
  })
  const p1 = props.backend.invoke('load_all_node').then(x => {
    const texts:Array<string> = JSON.parse(x)
    data.value.nodes.push(...texts.map(y => JSON.parse(y)))
    console.log("nodes", data.value.nodes)
  })
  const p2 = props.backend.invoke('list_all_lib').then(x => {
    const texts:Array<any> = JSON.parse(x)
    console.log("list_all_lib", texts) 
    data.value.libs = { libs: texts.map(y => {
      const ext = y.split('.').pop()
      const r = {
        name: y.slice(0, -(ext.length + 1)),
        load: false,
        content: ""
      }
      return r
    })}
    console.log("Libs", data.value.libs)
  })
  const p4 = props.backend.invoke('get_plugin').then(x => {
    data.value.plugin = JSON.parse(x)
    console.log("Plugins", data.value.plugin)
  })
  const p35 = repull(FrontendUpdate.ALL)
  const p6 = props.backend.invoke('load_all_log').then(x => {
      const stringlist:Array<string> = JSON.parse(x)
      const ll:Array<ExecutionLog> = stringlist.map(x => JSON.parse(x))
      ll.forEach(x => x.output = true)
      console.log("Logs", ll)
      data.value.logs.logs = ll
  })
  Promise.all([p0, p1, p2, p4, ...p35, p6]).then(() => {
    data.value.nodes = data.value.nodes.map(y => {
      return Object.assign(y, {
        s: false,
        state: 0,
        connection_rate: 0
      })
    })
    data.value.nodes.forEach(y => {
      if(props.backend.config.haveBackend){
        props.backend.send("node_add", y.url, y.ID)
      }else{
        data.value.websocket_manager?.server_start(y.url, y.ID)
      }
    })
    nextTick(() => allUpdate())
  })
}

onMounted(() => {
  document.addEventListener('keydown', hotkey)
  set_feedback(debug_feedback)
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), RENDER_UPDATETICK);
  slowUpdateHandle = setInterval(() => emitter?.emit('slowUpdateHandle'), RENDER_FILE_UPDATETICK);
  emitter?.on('updateNode', server_clients_update)
  emitter?.on('deleteScript', libDelete)
  emitter?.on('updateLocate', updateLocate)
  emitter?.on('updateHandle', updateHandleCall)

  props.backend.wait_init().then(() => {
    if(props.backend.config.isExpress){
      props.backend.consoleM = new ConsoleManager(`ws://${window.location.hostname}:${ConsolePORT}/server`, messager_log, {
        on: emitter!.on,
        off: emitter!.off,
        emit: emitter!.emit
      })
      const inter = setInterval(() => {
        if(props.backend.consoleM?.ws.readyState == 1){
          dataset_init()
          clearInterval(inter)
        }
      }, 500);   
    }else{
      dataset_init()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', hotkey)
  data.value.execute_manager = []
  emitter?.off('updateNode', server_clients_update)
  emitter?.off('deleteScript', libDelete)
  emitter?.off('updateLocate', updateLocate)
  emitter?.off('updateHandle', updateHandleCall)
  if(updateHandle != undefined) clearInterval(updateHandle)
  if(slowUpdateHandle != undefined) clearInterval(slowUpdateHandle)
  props.backend.send('client_stop');
  props.backend.eventOff('makeToast', makeToastFromBackend)
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
              <v-list-item @click="popSetting">{{ $t('setting') }}</v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-app-bar>
      <v-navigation-drawer temporary v-model="data.drawer">
        <v-list density="compact" nav>
          <v-list-item v-if="props.backend.config.isExpress"
            :prepend-avatar="props.backend.user?.picture_url ? '/pic' : 'assets/icon/user.png'"
            :title="props.backend.user?.name"
            :value="100" 
            @click="data.page = 100; data.title = 'toolbar.profile'"
          > 
          </v-list-item>
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
    <div style="width: 100vw; height:100vh; padding-top: 50px;" class="text-white" 
      :class="{ 'bg-dark': props.preference.theme == 'dark', 'bg-light': props.preference.theme == 'light' }">
      <v-tabs-window v-model="data.page">
        <v-tabs-window-item :value="0">
          <ProjectPage
            :backend="props.backend"
            :projects="data.projects" 
            :plugin="data.plugin"
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
            :backend="props.backend"
            :preference="props.preference"
            :plugin="data.plugin"
            @added="e => addParameter(e)"
            @select="e => selectParameter(e)"
            @edit="e => editParameter(e)" 
            @delete="e => deleteParameter(e)"
            @return="data.page = 1"/>
        </v-tabs-window-item>
        <v-tabs-window-item :value="4">
          <NodePage
            :manager="data.websocket_manager"
            :plugin="data.plugin"
            :backend="props.backend"
            :preference="props.preference"
            :nodes="data.nodes" />
        </v-tabs-window-item>
        <v-tabs-window-item :value="5">
          <ConsolePage
            :backend="props.backend"
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
            :backend="props.backend"
            :preference="props.preference"
            @edit="(d, d1) => libEdit(d, d1)"
            @save="(d, d1, d2) => libSave(d, d1, d2)"
            @load="d => libLoad(d)"
            @delete="d => libDelete(d)"
            @execute-js="d => libJs(d)"
            v-model="data.libs"/>
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.haveBackend" :value="8">
          <SelfPage
            :backend="props.backend"
            :messages="data.messages"
            :preference="props.preference"
            @clean="msgClean"/>
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.isExpress" :value="9">
          <RolePage 
            :preference="props.preference"
            :items="[]"
          />
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.isExpress" :value="10">
          <ServicePage />
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.haveBackend" :value="11">
          <PluginPage :plugin="data.plugin"
            @added-plugin="pluginAdded"
            @added-template="templateAdded"
            @delete-plugin="pluginDelete"
            @delete-template="templateDelete" />
        </v-tabs-window-item>
        <v-tabs-window-item v-show="config.isExpress" :value="100">
          <ProfilePage :backend="props.backend" />
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-container>
</template>

<style scoped>
.bg-dark {
  background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(33, 44, 42));
}
.bg-light {
  background-image: linear-gradient(to bottom, rgb(240, 240, 240), rgb(240, 255, 245));
}
</style>