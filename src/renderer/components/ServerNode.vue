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
  Job, 
  JobCategory, 
  JobType, 
  JobType2, 
  NodeProxy, 
  NodeTable, 
  Database, 
  Preference, 
  Project, 
  Property, 
  Record, 
  RENDER_FILE_UPDATETICK, 
  RENDER_UPDATETICK, 
  Task, 
  WebsocketPack, 
  WebPORT, 
  ExecutePair, 
  FrontendUpdate
} from './../interface'
import { BackendProxy } from '../proxy'
import { DATA, Util_Server } from './server/server'
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
//#endregion

//#region Data
const $t = i18n.global.t
const emitter:Emitter<BusType> = inject('emitter')!
const backend:Ref<BackendProxy> = inject("backend")!
const preference:Ref<Preference> = inject("preference")!
const tabs:Ref<Array<[string, string, number]>> = ref([])
const data:Ref<DATA> = ref({
    websocket_manager: undefined,
    execute_manager: [],

    loading: true,
    drawer: false,
    title: "",
    page: 0,
    select_manager: 0,
    lanSelect: i18n.global.locale as string,
    databases: [],
    projects: [],
    libs: {libs: []},
    logs: {logs: []},
    selectProject: undefined,
    selectTask: undefined,
    selectDatabase: undefined,
    nodes: [],
    messages: [],
    plugin: { plugins: [], templates: [] }
})
const util:Util_Server = new Util_Server(data, () => backend.value, emitter!)
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
})
//#endregion

//#region Computed
const config = computed(() => backend.value.config)
const selectExecute = computed(() => data.value.execute_manager[data.value.select_manager])
const projectbind = computed(() => {
  if(data.value.selectProject == undefined) return undefined
  return data.value.databases.find(x => x.uuid == data.value.selectProject?.database_uuid) 
})
//#endregion

//#region Methods
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

//#region Database
const addDatabase = (e:Database) => util.database.addDatabase(e)
const selectDatabase = (e:string) => util.database.selectDatabase(e)
const editDatabase = (e:Database) => util.database.editDatabase(e)
const deleteDatabase = (e:string) => util.database.deleteDatabase(e)
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
    const target = data.value.libs.libs.find(x => x.name == name)
    console.log(r)
    if(target == undefined) return
    target.load = true
    target.content = r
  }).catch(err => console.error(err))
}
const libDelete = (file:string) => {
  backend.value.send('delete_lib', file)
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
    em.libs = data.value.libs
    const p:ExecutePair = {manager: em, record: er}
    const uscp:UtilServer_Console.Util_Server_Console_Proxy = new UtilServer_Console.Util_Server_Console_Proxy(p)
    const uslp:UtilServer_Log.Util_Server_Log_Proxy = new UtilServer_Log.Util_Server_Log_Proxy(p, data.value.logs, preference.value)
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
  data.value.logs.logs = []
}
//#endregion

//#region Self
const msgAppend = (d:Array<string | undefined>) => util.self.msgAppend(d)
const msgClean = () => util.self.clearMessage()
//#endregion

//#region Plugin
const pluginAdded = (name:string, url:string) => {
  backend.value.invoke("import_plugin", name, url, preference.value.plugin_token.map(x => x.token).join(' ')).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", JSON.parse(x))
    nextTick(() => {
      data.value.plugin = { plugins: [], templates: [] }
      nextTick(() => {
        data.value.plugin = JSON.parse(x)
      })
    })
  })
}
const templateAdded = (name:string, url:string) => {
  backend.value.invoke("import_template", name, url, preference.value.plugin_token.map(x => x.token).join(' ')).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", JSON.parse(x))
    nextTick(() => {
      data.value.plugin = { plugins: [], templates: [] }
      nextTick(() => {
        data.value.plugin = JSON.parse(x)
      })
    })
  })
}
const pluginDelete = (name:string) => {
  backend.value.invoke("import_plugin_delete", name).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", JSON.parse(x))
    data.value.plugin = JSON.parse(x)
  })
}
const templateDelete = (name:string) => {
  backend.value.invoke("import_template_delete", name).then(x => {
    if (process.env.NODE_ENV == 'development') console.log("plugin result", JSON.parse(x))
    data.value.plugin = JSON.parse(x)
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
    const p3 = backend.value.invoke('load_all_record').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.projects.push(...texts.map(y => JSON.parse(y)))
      if (process.env.NODE_ENV == 'development') console.log(data.value.projects)
    })
    c.push(p3)
  }
  if((u & FrontendUpdate.PARAMETER) == FrontendUpdate.PARAMETER){
    const p5 = backend.value.invoke('load_all_database').then(x => {
      const texts:Array<string> = JSON.parse(x)
      data.value.databases = texts.map(y => JSON.parse(y))
      if (process.env.NODE_ENV == 'development') console.log("Databases", data.value.libs)
    })
    c.push(p5)
  }
  return c
}

const makeToastFromBackend = (e:any) => {
    if (process.env.NODE_ENV == 'development') console.log("makeToastFromBackend", e)
    emitter?.emit('makeToast', e)
}

const logUpdate = (e:string) => {
  const as:Array<ExecutionLog> = JSON.parse(e)
  as.forEach(x => {
    x.dirty = true
    const index = data.value.logs.logs.findIndex(y => y.uuid == x.uuid)
    if(index == -1) data.value.logs.logs.push(x)
    else data.value.logs.logs[index] = x;
  })
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
    data.value.websocket_manager = new Execute_SocketManager.WebsocketManager(newConnect, disconnect, onAnalysis, messager_log, nodeproxy)
  }
  else
  {
    backend.value.eventOn('shellReply', (data:any) => emitter?.emit('shellReply', data) )
    backend.value.eventOn('folderReply', (data:any) => emitter?.emit('folderReply', data) )
    backend.value.eventOn('frontend_update', repull)
  }
  backend.value.eventOn('makeToast', makeToastFromBackend)
  backend.value.eventOn('logUpdate', logUpdate)
  backend.value.eventOn('msgAppend', msgAppend)
  backend.value.eventOn('console-delete', consoleDelete)
  backend.value.eventOn('createProject', menuCreateProject)
  backend.value.eventOn('menu_export_project', menu_export_project)
  backend.value.eventOn('import_project_feedback', import_project_feedback)
  backend.value.send('menu', true)
  if(!backend.value.config.haveBackend) return
  backend.value.send('client_start');
  const p0 = backend.value.invoke('console_list').then((xs:any) => {
    if(xs == undefined) xs = []
    data.value.execute_manager = Array.isArray(xs) ? xs.map(x => ({ record: x })) : [{record: xs}]
    console.log("execute", data.value.execute_manager)
  })
  const p1 = backend.value.invoke('load_all_node').then(x => {
    const texts:Array<string> = JSON.parse(x)
    data.value.nodes.push(...texts.map(y => JSON.parse(y)))
    for(const x of data.value.nodes) x.s = false
    data.value.nodes = data.value.nodes.map(y => {
      return Object.assign(y, {
        s: false,
        state: 0,
        connection_rate: 0
      })
    })
    data.value.nodes.forEach(y => {
      if(backend.value.config.haveBackend){
        console.log("backend node_add", y.url, y.uuid)
        backend.value.send("node_add", y.url, y.uuid)
      }else{
        console.log("static web node_add", y.url, y.uuid)
        data.value.websocket_manager?.server_start(y.url, y.uuid)
      }
    })
    if (process.env.NODE_ENV == 'development') console.log("nodes", data.value.nodes)
  })
  const p2 = backend.value.invoke('list_all_lib').then(x => {
    const texts:Array<any> = JSON.parse(x)
    if (process.env.NODE_ENV == 'development') console.log("list_all_lib", texts) 
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
  const p4 = backend.value.invoke('get_plugin').then(x => {
    data.value.plugin = JSON.parse(x)
    if (process.env.NODE_ENV == 'development') console.log("Plugins", data.value.plugin)
  })
  const p35 = repull(FrontendUpdate.ALL)
  const p6 = backend.value.invoke('load_all_log').then(x => {
      const stringlist:Array<string> = JSON.parse(x)
      const ll:Array<ExecutionLog> = stringlist.map(x => JSON.parse(x))
      ll.forEach(x => x.output = true)
      if (process.env.NODE_ENV == 'development') console.log("Logs", ll)
      data.value.logs.logs = ll
  })
  Promise.all([p0, p1, p2, p4, ...p35, p6]).then(() => {
    nextTick(() => allUpdate())
  }).catch(err => {
    console.error("Init Promises Call Failed: ", err)
  })
}

const InitCaller = (delay:boolean) => {
  if(data.value.page > 20){
    data.value.page = 0
    setTimeout(() => {
      data.value.loading = false
    }, 800);
    return
  }
  nextTick(() => {
    if(delayy == 2){
      data.value.page += 1
      delayy = 0
    }
    delayy += 1
    InitCaller(delay)
  })
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

  if(backend.value.config.haveBackend){
    data.value.loading = true
    InitCaller(true)
  }
  backend.value.wait_init().then(() => {
    data.value.loading = true
    InitCaller(!backend.value.config.isElectron)
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
})

onUnmounted(() => {
  data.value.loading = true
  document.removeEventListener('keydown', hotkey)
  data.value.execute_manager = []
  emitter.off('updateNode', server_clients_update)
  emitter.off('deleteScript', libDelete)
  emitter.off('updateLocate', updateLocate)
  emitter.off('updateHandle', updateHandleCall)
  if(updateHandle != undefined) clearInterval(updateHandle)
  if(slowUpdateHandle != undefined) clearInterval(slowUpdateHandle)
  backend.value.send('client_stop');
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
      <template #title>
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

    <div v-if="data.loading" class="loading">
      <p>{{ $t('loading') }}</p>
      <v-progress-circular color="blue-lighten-3" indeterminate></v-progress-circular>
    </div>

    <v-tabs-window v-model="data.page">
      <v-tabs-window-item :value="0">
        <ProjectPage
          :backend="backend"
          :projects="data.projects" 
          :plugin="data.plugin"
          :databases="data.databases"
          :config="config"
          :preference="preference"
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
          :preference="preference"
          :databases="data.databases"
          @added="e => addTask(e)" 
          @edit="(id, e) => editTask(id, e)" 
          @select="e => chooseTask(e)"
          @bind="e => bindingTask(e)"
          @delete="e => deleteTask(e)"
          @moveup="e => moveupTask(e)"
          @movedown="e => movedownTask(e)"
          @database="e => goDatabase(e)"
          @return="data.page = 0"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="2">
        <JobPage
          :projects="data.projects" 
          :select="data.selectTask"
          :owner="data.selectProject"
          :libs="data.libs"
          :database="projectbind"
          :preference="preference"
          @added="e => addJob(e)" 
          @edit="(e, e2) => editJob(e, e2)" 
          @delete="e => deleteJob(e)"
          @return="data.page = 1"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="3">
        <DatabasePage
          :config="config"
          :databases="data.databases"
          :select="data.selectDatabase"
          :backend="backend"
          :preference="preference"
          :plugin="data.plugin"
          @added="e => addDatabase(e)"
          @select="e => selectDatabase(e)"
          @edit="e => editDatabase(e)" 
          @delete="e => deleteDatabase(e)"
          @return="data.page = 1"/>
      </v-tabs-window-item>
      <v-tabs-window-item :value="4">
        <NodePage
          :manager="data.websocket_manager"
          :plugin="data.plugin"
          :nodes="data.nodes" />
      </v-tabs-window-item>
      <v-tabs-window-item :value="5">
        <ConsolePage
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
          :config="config"
          :execute="data.execute_manager"
          :preference="preference"
          :logs="data.logs"
          @clean="LogClean"
          v-model="selectExecute"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.haveBackend" :value="7">
        <LibraryPage
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
          :backend="backend"
          :messages="data.messages"
          :preference="preference"
          @clean="msgClean"/>
      </v-tabs-window-item>
      <v-tabs-window-item v-show="config.isExpress" :value="9">
        <RolePage 
          :preference="preference"
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
        <ProfilePage :backend="backend" />
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