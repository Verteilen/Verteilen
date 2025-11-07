<script setup lang="ts">
//#region Modules
import { Emitter } from 'mitt'
import { v6 as uuidv6 } from 'uuid'
import { computed, inject, nextTick, onMounted, onUnmounted, Ref, ref, watch } from 'vue'
import { messager_log, set_feedback } from '../debugger'
import { 
  Execute_ExecuteManager,
  Execute_SocketManager,
  UtilServer_Console,
  UtilServer_Log,
  BusAnalysis, 
  BusType, 
  ExecuteRecord, 
  ExecutionLog, 
  JobCategory, 
  JobType, 
  JobType2, 
  NodeProxy, 
  NodeTable, 
  Database, 
  Preference, 
  Record, 
  RENDER_FILE_UPDATETICK, 
  RENDER_UPDATETICK, 
  WebsocketPack, 
  WebPORT, 
  ExecutePair, 
  FrontendUpdate,
  ProjectTable,
} from './../interface'
import { BackendProxy } from '../proxy'
import { DATA, Util_Server } from './server_logic'
import { i18n } from './../plugins/i18n'
//#endregion

//#region Views
import ConsolePage from './server/Console.vue';
import JobPage from './server/Job.vue';
import LibraryPage from './server/Library.vue';
import LogPage from './server/Log.vue';
import NodePage from './server/Node.vue';
import DatabasePage from './server/Database.vue';
import ProjectPage from './server/Project.vue';
import SelfPage from './server/Self.vue';
import TaskPage from './server/Task.vue';
import RolePage from './server/Role.vue';
import ServicePage from './server/Service.vue';
import ProfilePage from './server/Profile.vue';
import PluginPage from './server/Plugin.vue';
import Layout from './components/layout/Layout.vue'
import AppBar from './components/layout/AppBar.vue'
import { Server } from 'verteilen-core/src/server'
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const server:Ref<Server | undefined> = ref(undefined)
const tabs:Ref<Array<[string, string, number]>> = ref([])
const data:Ref<DATA> = ref({
    websocket_manager: undefined,
    execute_manager: [],

    loading: true,
    drawer: false,
    title: "",
    page: 0,
    select_manager: 0,
    lanSelect: i18n.global.locale,
    databases: [],
    projects: [],
    tasks: [],
    jobs: [],
    libs: [],
    logs: [],
    selectProjectID: "",
    selectTaskID: "",
    selectDatabaseID: "",
    nodes: [],
    messages: [],
    plugin: { plugins: [], templates: [] }
})
let delayy = 0
let updateHandle:any = undefined
let slowUpdateHandle:any = undefined
//#endregion

//#region Watch
watch(() => data.value.page, () => {
  const tab = tabs.value.find(x => x[2] == data.value.page)!
  data.value.drawer = false
  if(tab == undefined) return
  data.value.page = tab[2]; 
  data.value.title = tab[1];
  util.page_update(data.value.page)
})
//#endregion

//#region Computed
const selectProject = computed(() => data.value.projects.find(x => x.uuid == data.value.selectProjectID))
const selectTask = computed(() => data.value.tasks.find(x => x.uuid == data.value.selectTaskID))
const selectDatabase = computed(() => data.value.databases.find(x => x.uuid == data.value.selectDatabaseID))
const config = computed(() => backend.value.config)
const selectExecute = computed(() => data.value.execute_manager[data.value.select_manager])
const projectbind = computed(() => {
  if(selectProject.value == undefined) return undefined
  return data.value.databases.find(x => x.uuid == selectProject.value?.database_uuid) 
})
const util:Util_Server = new Util_Server(data, emitter, backend, preference, server, selectProject, selectTask, selectDatabase)
//#endregion

//#region Methods
const allUpdate = () => util.allUpdate()
const saveRecord = () => util.saveRecord()

const server_clients_update = (v:Array<NodeTable>) => util.node.server_clients_update(v)

//#region Database
const goDatabase = (e:string) => {
  data.value.page = 3
  nextTick(() => emitter?.emit('selectDatabase', e))
}
//#endregion

//#region Lib
const libFresh = () => {
  backend.value.invoke('list_all_lib').then(x => {
    const texts:Array<any> = JSON.parse(x)
    console.log("list_all_lib", texts) 
    data.value.libs = texts.map(y => {
      const ext = y.split('.').pop()
      const r = {
        uuid: uuidv6(),
        name: y.slice(0, -(ext.length + 1)),
        load: false,
        content: ""
      }
      return r
    })
    console.log("Libs", data.value.libs)
  })
}
const libEdit = (oldname:string, newname:string) => { 
  backend.value.send("rename_lib", oldname, newname) 
  libFresh()
}
const libSave = (file:string, content:string, refresh: boolean) => { 
  backend.value.send('save_lib', file, content)
  if(refresh) libFresh()
}
const libLoad = (file:string) => {
  const ext = file.split('.').pop()!
  const name = file.slice(0, -(ext.length + 1))
  backend.value.invoke('load_lib', file).then(r => {
    const target = data.value.libs.find(x => x.name == name)
    console.log(r)
    if(target == undefined) return
    target.load = true
    target.content = r
  }).catch(err => console.error(err))
}
const libDelete = (file:string) => {
  backend.value.send('delete_lib', file)
  data.value.projects.forEach(x => {
    x.tasks.forEach(y => {
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
const libJs = (code:string, para:Database | undefined) => { backend.value.send('javascript', code, para ? JSON.stringify(para) : undefined) }
//#endregion

//#region Console
const consoleAdded = (name:string, record:Record) => {
  if(backend.value.config.haveBackend){
    // If we have backend, the instance should be place in the backend
    backend.value.invoke('console_add', name, record, backend.value.config.isExpress ? preference : undefined).then(r => {
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
    //util.server.value?.detail?.console_add(undefined, name, record, undefined)
    let r:boolean = false
    const em:Execute_ExecuteManager.ExecuteManager = new Execute_ExecuteManager.ExecuteManager(
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
    em.libs = { libs: data.value.libs }
    const p:ExecutePair = {manager: em, record: er}
    const uscp:UtilServer_Console.Console_Proxy = new UtilServer_Console.Console_Proxy(p)
    const uslp:UtilServer_Log.Log_Proxy = new UtilServer_Log.Log_Proxy(p, { logs: data.value.logs }, preference.value)
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
  }
}
const consoleStop = () => {
  nextTick(() => {
    if(!backend.value.config.haveBackend){
      data.value.execute_manager[data.value.select_manager].manager!.Release()
    }
    data.value.execute_manager.splice(data.value.select_manager, 1)
    if(data.value.execute_manager.length == 0) data.value.select_manager = -1
    else data.value.select_manager = 0
  })
}
const consoleDelete = (uuid:string) => {
  const index = data.value.execute_manager.findIndex(x => x.manager?.uuid == uuid)
  data.value.execute_manager.splice(index, 1)
}
const consoleSelect = (e:number) => { data.value.select_manager = e }
//#endregion

//#region Log
const LogClean = () => {
  if(!backend.value.config.haveBackend) return
  backend.value.send('delete_all_log')
  data.value.logs = []
}
//#endregion

//#region Self
const msgAppend = (d:Array<string | undefined>) => util.self.msgAppend(d)
const msgClean = () => util.self.clearMessage()
//#endregion

//#region Plugin
const pluginAdded = (name:string, url:string) => {
  backend.value.invoke("import_plugin", name, url, preference.value.plugin_token.map(x => x.token).join(' ')).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", x)
    data.value.plugin = x
  })
}
const pluginDelete = (name:string) => {
  backend.value.invoke("import_plugin_delete", name).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", x)
    data.value.plugin = x
  })
}
//#endregion

const updateLocate = () => {
  updateTab()
}

const updateHandleCall = () => {
  if(backend.value.config.haveBackend){
  }
}

const updateTab = () => {
  if(config.value.isExpress){
    tabs.value = [
      ["", "toolbar.editor", -1],
      ["mdi-cube", "toolbar.project", 0],
    ]
    if(backend.value.user.permission?.task.view){
      tabs.value.push(["mdi-calendar", "toolbar.task", 1])
    }
    if(backend.value.user.permission?.job.view){
      tabs.value.push(["mdi-hammer", "toolbar.job", 2])
    }
    if(backend.value.user.permission?.database.view){
      tabs.value.push(["mdi-database", "toolbar.database", 3])
    }
    tabs.value.push(["", "toolbar.compute", -1])
    if(backend.value.user.permission?.node.view){
      tabs.value.push(["mdi-network", "toolbar.node", 4])
    }
    if(backend.value.user.permission?.execute_job){
      tabs.value.push(["mdi-console-line", "toolbar.console", 5])
    }
  }else{
    tabs.value = [
      ["", "toolbar.editor", -1],
      ["mdi-cube", "toolbar.project", 0],
      ["mdi-calendar", "toolbar.task", 1],
      ["mdi-hammer", "toolbar.job", 2],
      ["mdi-database", "toolbar.database", 3],
      ["", "toolbar.compute", -1],
      ["mdi-network", "toolbar.node", 4],
      ["mdi-console-line", "toolbar.console", 5],
    ]
  }
  
  if(config.value.haveBackend){
    if((config.value.isExpress && backend.value.user.permission?.plugin.view) || !config.value.isExpress){
      tabs.value.push(["mdi-puzzle", "toolbar.plugin", 11])
    }
    tabs.value.push(["", "toolbar.backend", -1])
    if((config.value.isExpress && backend.value.user.permission?.log.view) || !config.value.isExpress){
      tabs.value.push(["mdi-text-box-outline", "toolbar.log", 6])
    }
    if((config.value.isExpress && backend.value.user.permission?.lib.view) || !config.value.isExpress){
      tabs.value.push(["mdi-xml", "toolbar.library", 7])
    }
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
  if(!backend.value.config.haveBackend) return
  backend.value.send("export_project", JSON.stringify(data.value.projects))
}

const import_project_feedback = (text:string) => {
  const ps:Array<ProjectTable> = JSON.parse(text)
  for(const p of ps){
    for(const t of p.tasks){
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

const hotkey = (event:KeyboardEvent) => {
  if (event.altKey) {
    if(event.key == 'q') data.value.page = 0 // Project
    else if(event.key == 'w') data.value.page = 1 // Task
    else if(event.key == 'e') data.value.page = 2 // Job
    else if(event.key == 'r') data.value.page = 3 // Database
    else if(event.key == 'a') data.value.page = 4 // Node
    else if(event.key == 's') data.value.page = 5 // Console
    else if(event.key == 'd') data.value.page = 6 // Log
    else if(event.key == 'f') data.value.page = 7 // Library
    else if(event.key == 'g') data.value.page = 11 // Plugin
    else if(event.key == 'z') data.value.page = 8 // Self
    else if(event.key == 'x') data.value.page = 9 // Role
    else if(event.key == 'c') data.value.page = 10 // Service
    else if(event.key == 'b') {
      data.value.page = 12 // Profile
      data.value.title = "toolbar.profile"
    }
    else if(event.key == 'x' && data.value.page == 5) emitter?.emit('hotkey', 'c_r') // Restore console
  }
  if (event.ctrlKey) {
    if(event.key == 'q' && data.value.page == 0) emitter?.emit('hotkey', 'create_project')
    if(event.key == 'q' && data.value.page == 1) emitter?.emit('hotkey', 'create_task')
    if(event.key == 'q' && data.value.page == 2) emitter?.emit('hotkey', 'create_job')
    if(event.key == 'q' && data.value.page == 3) emitter?.emit('hotkey', 'create_database')
    if(event.key == 'q' && data.value.page == 4) emitter?.emit('hotkey', 'create_node')
    if(event.key == 'q' && data.value.page == 5) emitter?.emit('hotkey', 'create_console')
    if(event.key == 'q' && data.value.page == 7) emitter?.emit('hotkey', 'create_lib')
    if(event.key == 'q' && data.value.page == 11) emitter?.emit('hotkey', 'create_plugin')
    if(event.key == 'w' && data.value.page == 11) emitter?.emit('hotkey', 'create_template')
    if(event.key == 's' && data.value.page == 2) emitter?.emit('hotkey', 'job_save')
    if(event.key == 's' && data.value.page == 3) emitter?.emit('hotkey', 'database_save')
    if(event.key == 's' && data.value.page == 7) emitter?.emit('hotkey', 'lib_save')
  }
}

const repull = (u:FrontendUpdate) => {
  const c: Array<Promise<void>> = []
  if((u & FrontendUpdate.PROJECT) == FrontendUpdate.PROJECT){
    const p3 = util.query.load_all_project()
    c.push(p3)
  }
  if((u & FrontendUpdate.DATABASE) == FrontendUpdate.DATABASE){
    const p5 = util.query.load_all_database()
    c.push(p5)
  }
  return c
}

const makeToastFromBackend = (e:any) => {
    if (process.env.NODE_ENV == 'development') console.log("makeToastFromBackend", e)
    emitter?.emit('makeToast', JSON.parse(e))
}

const logUpdate = (e:string) => {
  const as:Array<ExecutionLog> = JSON.parse(e)
  as.forEach(x => {
    x.dirty = true
    const index = data.value.logs.findIndex(y => y.uuid == x.uuid)
    if(index == -1) data.value.logs.push(x)
    else data.value.logs[index] = x;
  })
}

/**
 * **Initialize Dataset**\
 * Query data from the backend and assign to data variables
 */
const dataset_init = () => {
  updateTab()
  data.value.title = tabs.value.find(x => x[2] == 0)![1]
  const x = config.value
  if(!x.haveBackend){
    server.value = new Server()
    const nodeproxy:NodeProxy = {
      shellReply: data => { emitter?.emit('shellReply', data) },
      folderReply: data => { emitter?.emit('folderReply', data) },
    }
    data.value.websocket_manager = new Execute_SocketManager.WebsocketManager(newConnect, disconnect, onAnalysis, messager_log, nodeproxy)
    return
  }
  backend.value.eventOn('shellReply', (data:any) => emitter?.emit('shellReply', data) )
  backend.value.eventOn('folderReply', (data:any) => emitter?.emit('folderReply', data) )
  backend.value.eventOn('frontend_update', repull)
  backend.value.eventOn('makeToast', makeToastFromBackend)
  backend.value.eventOn('logUpdate', logUpdate)
  backend.value.eventOn('msgAppend', msgAppend)
  backend.value.eventOn('console-delete', consoleDelete)
  backend.value.eventOn('createProject', menuCreateProject)
  backend.value.eventOn('menu_export_project', menu_export_project)
  backend.value.eventOn('import_project_feedback', import_project_feedback)
}
//#endregion

onMounted(() => {
  document.addEventListener('keydown', hotkey)
  set_feedback(debug_feedback)
  updateHandle = setInterval(() => emitter?.emit('updateHandle'), RENDER_UPDATETICK);
  slowUpdateHandle = setInterval(() => emitter?.emit('slowUpdateHandle'), RENDER_FILE_UPDATETICK);
  emitter.on('updateNode', server_clients_update)
  emitter.on('deleteScript', libDelete)
  emitter.on('updateLocate', updateLocate)
  emitter.on('updateHandle', updateHandleCall)
  backend.value.wait_init().then(() => {
    backend.value.eventOn('debuglog', debug_feedback)
    if(backend.value.config.isExpress){
      backend.value.Create_Console_Host(`wss://${window.location.hostname}:${WebPORT}`, {
        on: emitter!.on,
        off: emitter!.off,
        emit: emitter!.emit
      })
      const inter = setInterval(() => {
        if(backend.value.consoleM?.ws.readyState == 1){
          dataset_init()
          clearInterval(inter)
        }
      }, 500);   
    }else{
      dataset_init()
    }
  })
  util.page_update(0)
})

onUnmounted(() => {
  document.removeEventListener('keydown', hotkey)
  if(updateHandle != undefined) clearInterval(updateHandle)
  if(slowUpdateHandle != undefined) clearInterval(slowUpdateHandle)
  emitter.off('updateNode', server_clients_update)
  emitter.off('deleteScript', libDelete)
  emitter.off('updateLocate', updateLocate)
  emitter.off('updateHandle', updateHandleCall)
  data.value.execute_manager = []
  if(!backend.value.config.haveBackend) return
  backend.value.eventOff('debuglog', debug_feedback)
  backend.value.eventOff('console-delete', consoleDelete)
  backend.value.eventOff('makeToast', makeToastFromBackend)
  backend.value.eventOff('logUpdate', logUpdate)
  backend.value.eventOff('createProject', menuCreateProject)
  backend.value.eventOff('menu_export_project', menu_export_project)
  backend.value.eventOff('import_project_feedback', import_project_feedback)
  backend.value.eventOff('msgAppend', msgAppend)
})

</script>

<template>
  <Layout>
    <AppBar show_icon @click="data.drawer = true" goback>
      <template v-if="data.title.length > 0" #title>
        {{ $t(data.title).slice(0, $t(data.title).length - 4) }} 
        <span :style="{ 'fontSize': (preference.font - 5) + 'px' }">
          {{ $t(data.title).slice($t(data.title).length - 4, $t(data.title).length) }}
        </span> 
      </template>

      <v-navigation-drawer temporary v-model="data.drawer" :scrim="preference?.animation">
        <v-list density="compact" nav>
          <v-list-item v-if="backend.config.isExpress"
            :title="backend.user?.name"
            :value="100" 
            @click="data.page = 100; data.title = 'toolbar.profile'"
          > 
          </v-list-item>
          <div v-for="(tab, index) in tabs" :key="index">
            <v-list-item v-if="tab[2] >= 0"
              :style="{ 'fontSize': preference.font + 'px' }"
              :prepend-icon="tab[0]"
              :value="tab[2]" 
              :active="data.page == tab[2]"
              @click="data.page = tab[2]">
                {{ $t(tab[1]).slice(0, $t(tab[1]).length - 4) }} 
                <span :style="{ 'fontSize': (preference.font - 5) + 'px' }">
                  {{ $t(tab[1]).slice($t(tab[1]).length - 4, $t(tab[1]).length) }}
                </span> 
            </v-list-item>
            <v-list-subheader v-else>{{ $t(tab[1]) }}</v-list-subheader>
          </div>
          
        </v-list>
      </v-navigation-drawer>
    </AppBar>

    <div v-if="false" class="loading">
      <p>{{ $t('loading') }}</p>
      <v-progress-circular color="blue-lighten-3" indeterminate></v-progress-circular>
    </div>

    <v-tabs-window v-model="data.page" class="w-100 pt-10" style="height: calc(100vh - 22px)">
      <v-tabs-window-item :value="0">
        <ProjectPage
          v-if="data.page == 0"
          :backend="backend"
          :projects="data.projects" 
          :plugin="data.plugin"
          :databases="data.databases"
          :config="config"
          :preference="preference"
          @added="e => util.project.addProject(e)" 
          @clone="e => util.project.cloneProject(e)"
          @edit="(id, e) => util.project.editProject(id, e)" 
          @select="e => util.project.chooseProject(e)" 
          @delete="(e, e2) => util.project.deleteProject(e, e2)"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="1">
        <TaskPage
          v-if="data.page == 1"
          :projects="data.projects" 
          :tasks="data.tasks"
          :select="selectProject" 
          :databases="data.databases"
          @added="e => util.task.addTask(e)" 
          @clone="e => util.task.cloneTask(e)"
          @edit="(id, e) => util.task.editTask(id, e)" 
          @select="e => util.task.chooseTask(e)"
          @bind="e => util.task.bindingTask(e)"
          @delete="e => util.task.deleteTask(e)"
          @reorder="e => util.task.reorderTask(e)"
          @database="e => goDatabase(e)"
          @return="data.page = 0"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="2">
        <JobPage
          v-if="data.page == 2"
          :projects="data.projects" 
          :jobs="data.jobs"
          :select="selectTask"
          :owner="selectProject"
          :libs="data.libs"
          :database="projectbind"
          @added="e => util.job.addJob(e)" 
          @edit="e => util.job.editJob(e)" 
          @delete="e => util.job.deleteJob(e)"
          @return="data.page = 1"
          @padded="util.task.addProperty()"
          @preorder="e => util.task.reorderProperty(e)"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="3">
        <DatabasePage
          v-if="data.page == 3"
          :config="config"
          :databases="data.databases"
          :select="selectDatabase"
          :backend="backend"
          :preference="preference"
          :plugin="data.plugin"
          @added="e => util.database.addDatabase(e)"
          @select="e => util.database.selectDatabase(e)"
          @edit="e => util.database.editDatabase(e)" 
          @delete="e => util.database.deleteDatabase(e)"
          @return="data.page = 1"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="4">
        <NodePage
          v-if="data.page == 4"
          :manager="data.websocket_manager"
          :plugin="data.plugin"
          :nodes="data.nodes" />
      </v-tabs-window-item>
      <v-tabs-window-item :value="5">
        <ConsolePage
          v-if="data.page == 5"
          :backend="backend"
          :preference="preference"
          :socket="data.websocket_manager"
          :execute="data.execute_manager"
          :libs="data.libs"
          :projects="data.projects"
          :nodes="data.nodes"
          :databases="data.databases"
          v-model="selectExecute"
          @added="(e, e1) => consoleAdded(e, e1)"
          @stop="consoleStop()"
          @select="e => consoleSelect(e)"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.haveBackend" :value="6">
        <LogPage 
          v-if="data.page == 6"
          :config="config"
          :execute="data.execute_manager"
          :preference="preference"
          :logs="data.logs"
          @clean="LogClean"
          v-model="selectExecute"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.haveBackend" :value="7">
        <LibraryPage
          v-if="data.page == 7"
          :backend="backend"
          :preference="preference"
          :databases="data.databases"
          @edit="(d, d1) => libEdit(d, d1)"
          @save="(d, d1, d2) => libSave(d, d1, d2)"
          @load="d => libLoad(d)"
          @delete="d => libDelete(d)"
          @execute-js="(d, d1) => libJs(d, d1)"
          v-model="data.libs"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.haveBackend" :value="8">
        <SelfPage
          v-if="data.page == 8"
          :backend="backend"
          :messages="data.messages"
          :preference="preference"
          @clean="msgClean"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.isExpress" :value="9">
        <RolePage 
          v-if="data.page == 9"
          :preference="preference"
          :items="[]"
        />
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.isExpress" :value="10">
        <ServicePage />
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.haveBackend" :value="11">
        <PluginPage :plugin="data.plugin"
          v-if="data.page == 11"
          @added-plugin="pluginAdded"
          @delete-plugin="pluginDelete" />
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.isExpress" :value="100">
        <ProfilePage 
          v-if="data.page == 100"
          :backend="backend" />
      </v-tabs-window-item>
    </v-tabs-window>
  </Layout>
</template>

<style scoped>
.bg-dark {
  background-image: linear-gradient(to bottom, rgb(33, 33, 33), rgb(33, 44, 42));
}
.bg-light {
  background-image: linear-gradient(to bottom, rgb(240, 240, 240), rgb(240, 255, 245));
}
.loading {
  position: fixed;
  width: 100vw;
  height: 100vh;
  padding: auto auto;
  margin: auto auto;
  background-color: rgba(1, 1, 1, 1);
  z-index: 10000;
  align-items: center;
  align-content: center;
  align-self: center;
  text-align: center;
  top: 0px;
}
</style>