import { ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as os from "os";
import { messager, messager_log } from "./debugger";
import { Util_Server } from "./util/server";
import { 
    ExportProjects, 
    ImportProject, 
    ExportProject, 
    ImportDatabase, 
    ExportDatabase 
} from "./util/io";
import { mainWindow } from "./electron";
import { 
    Client,
    ClientJobExecute,
    CreatePreference,
    CreateRecordIOLoader,
    CreatePluginLoader, 
    PluginLoader,
    DATA_FOLDER, 
    Job, 
    JobCategory, 
    JobType, 
    Database, 
    PluginList, 
    Preference, 
    Project, 
    RecordIOLoader, 
    Server,
    RecordIOBase,
    ServerDetail,
    PluginFeedback,
    BackendAction,
    Record,
    ServerDetailEvent,
    ExecuteState,
} from "./interface";

const Loader = (loader:RecordIOLoader, key:string) => {
    ipcMain.handle(`load_all_${key}`, (e) => loader.load_all())
    ipcMain.on(`delete_all_${key}`, (e) => loader.delete_all())
    ipcMain.handle(`list_all_${key}`, (e) => loader.list_all())
    ipcMain.on(`save_${key}`, (e, name:string, data:string) => loader.save(name, data))
    ipcMain.on(`rename_${key}`, (e, name:string, newname:string) => loader.rename(name, newname))
    ipcMain.on(`delete_${key}`, (e, name:string) => loader.delete(name))
    ipcMain.on(`delete_all_${key}`, (e) => loader.delete_all())
    ipcMain.handle(`load_${key}`, (e, name:string) => loader.load(name, true))
}
const PluginInit = (loader:PluginLoader) => {
    loader.get_plugin()
    ipcMain.handle('get_plugin', async (e) => loader.get_plugin())
    ipcMain.handle('import_template', async (event, name:string, url:string, token:string) => loader.import_template(name, url, token))
    ipcMain.handle('import_plugin', async (event, name:string, url:string, token:string) => loader.import_plugin(name, url, token))
    ipcMain.handle('delete_template', async (event, name:string) => loader.delete_template(name))
    ipcMain.handle('delete_plugin', async (event, name:string) => loader.delete_plugin(name))
    ipcMain.handle('get_project', async (event, group:string, filename:string) => loader.get_project(group, filename))
    ipcMain.handle('get_database', async (event, group:string, filename:string) => loader.get_database(group, filename))
    ipcMain.on('plugin_download', (event, uuid:string, plugin:string, tokens:string) => loader.plugin_download(uuid, plugin, tokens))
    ipcMain.on('plugin_remove', (event, uuid:string, plugin:string) => loader.plugin_remove(uuid, plugin))
}
const DetailInit = (detail:ServerDetailEvent) => {
    ipcMain.on('resource_start', (e, uuid) => detail.resource_start(undefined, uuid))
    ipcMain.on('resource_end', (e, uuid) => detail.resource_end(undefined, uuid))
    ipcMain.on('plugin_info', (e, uuid) => detail.plugin_info(undefined, uuid))
    // Shell
    ipcMain.on('shell_enter', (e, uuid, value) => detail.shell_enter(undefined, uuid, value))
    ipcMain.on('shell_open', (e, uuid) => detail.shell_open(undefined, uuid))
    ipcMain.on('shell_close', (e, uuid) => detail.shell_close(undefined, uuid))
    ipcMain.on('shell_folder', (e, uuid, path) => detail.shell_folder(undefined, uuid, path))
    // Node Events
    ipcMain.handle('node_list', (e) => detail.node_list(undefined))
    ipcMain.on('node_add', (e, url:string, id:string) => detail.node_add(undefined, url, id))
    ipcMain.handle('node_update', (e) => detail.node_update(undefined))
    ipcMain.on('node_delete', (e, uuid:string, reason?:string) => detail.node_delete(undefined, uuid, reason))
    // Console Events
    ipcMain.handle('console_list', (event) => detail.console_list(undefined))
    ipcMain.handle('console_record', (event, uuid:string) => detail.console_record(undefined, uuid))
    ipcMain.on('console_execute', (event, uuid:string, type:number) => detail.console_execute(undefined, uuid, type))
    ipcMain.on('console_stop', (event, uuid:string) => detail.console_stop(undefined, uuid))
    ipcMain.on('console_clean', (event, uuid:string) => detail.console_clean(undefined, uuid))
    ipcMain.on('console_skip', (event, uuid:string, forward:boolean, type:number, state:ExecuteState) => detail.console_skip(undefined, uuid, forward, type, state))
    ipcMain.on('console_skip2', (event, uuid:string, type:number) => detail.console_skip2(undefined, uuid, type))
    ipcMain.handle('console_add', (event, name:string, record:Record) => detail.console_add(undefined, name, record, undefined))
    ipcMain.handle('console_update', (event) => detail.console_update(undefined))
}
const CreateIO = ():RecordIOBase => {
    return {
        root: path.join(os.homedir(), DATA_FOLDER),
        join: path.join,
        read_dir: (path:string) => fsp.readdir(path, { withFileTypes: false }),
        read_dir_dir: (path:string) => fsp.readdir(path, { withFileTypes: true }).then(x => x.filter(y => !y.isFile()).map(y => y.name)),
        read_dir_file: (path:string) => fsp.readdir(path, { withFileTypes: true }).then(x => x.filter(y => y.isFile()).map(y => y.name)),
        read_string: (path:string, options?:any) => fsp.readFile(path, options).then(x => x.toString('utf-8')),
        write_string: (path:string, content:string) => fsp.writeFile(path, content),
        exists: (path:string) => fs.existsSync(path),
        mkdir: async (path:string) => { await fsp.mkdir(path, {recursive: true}) },
        rm: (path:string) => fsp.rm(path, {recursive: true}),
        cp: (path:string, newpath:string) => fsp.cp(path, newpath)
    }
}

export class BackendEvent extends Server implements BackendAction {
    client:Client.Client | undefined = undefined
    /**
     * Memory preference config
     */
    preference: Preference = CreatePreference()

    constructor(){
        super()
        /**
         * * Config Setup
         */
        this.load_preference(false)
        /**
         * * IO And Plugin Setup
         */
        const feedback:PluginFeedback = {
            electron: mainWindow?.webContents.send,
            socket: undefined
        }
        this.io = CreateIO()
        this.loader = CreateRecordIOLoader(this.io, this.memory)
        this.LoadFromDisk()
        this.plugin_loader = CreatePluginLoader(this.io, this.plugin, (uuid:string) => this.detail!.websocket_manager?.targets.find(x => x.uuid == uuid), feedback)
        this.plugin_loader.load_all()
        PluginInit(this.plugin_loader)
        this.detail = new ServerDetail(this.io, this, feedback, messager, console.log)
        DetailInit(this.detail)
    }

    Init = () => {
        /**
         * * Local Client Setup
         */
        if(this.client != undefined) return
        this.client = new Client.Client((...args:Array<string | undefined>) => {
            messager(...args)
            mainWindow?.webContents.send('debuglog', args.join(' '));
        }, (msg:string, tag?:string, meta?:string) => {
            messager_log(msg, tag, meta)
            mainWindow?.webContents.send('debuglog', tag == undefined ? msg : `[${tag}] ${msg}`);
        })
        this.client.Init()
    }

    Destroy = () => {
        if(this.client == undefined) return
        this.client.Destroy()
        this.client.Dispose()
        this.client = undefined
    }

    EventInit = () => {
        this.AppInit()
    }

    AppInit = () => {
        ipcMain.on('client_start', (event) => this.Init())
        ipcMain.on('client_stop', (event) => this.Destroy())
        ipcMain.handle('exist', (event, path:string) => fs.existsSync(path))
        ipcMain.on('javascript', (event, content:string, database:string | undefined) => {
            const javascript_messager_feedback = (msg:string, tag?:string) => {
                messager(msg, tag)
                event.sender.send('javascript-feedback', msg)
            }
            const d:Job = {
                uuid: 'javascript',
                category: JobCategory.Execution,
                type: JobType.JAVASCRIPT,
                script: content,
                string_args: [],
                number_args: [],
                boolean_args: [],
                id_args: [],
            }
            const p:PluginList = { plugins: [] }
            const worker = new ClientJobExecute.ClientJobExecute(javascript_messager_feedback, javascript_messager_feedback, d, undefined, p)
            worker.database = database ? JSON.parse(database) : undefined
            worker.execute().then(x => {
                javascript_messager_feedback(x, "Finish")
            })
        })
        ipcMain.on('message', (e, message:string, tag?:string) => console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`))
        ipcMain.on('save_preference', (e, pre:string) => this.save_preference(pre))
        ipcMain.handle('load_preference', (e, token:string) => JSON.stringify(this.load_preference(true)))
        ipcMain.on('export_projects', (event, data:string) => {
            const p:Array<Project> = JSON.parse(data)
            ExportProjects(p)
        })
        ipcMain.on('import_project', (event) => {
            ImportProject()
        })
        ipcMain.on('export_project', (event, data:string) => {
            const p:Project = JSON.parse(data)
            ExportProject(p)
        })
        ipcMain.on('import_database', (event) => {
            ImportDatabase()
        })
        ipcMain.on('export_database', (event, data:string) => {
            const p:Database = JSON.parse(data)
            ExportDatabase(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            //i18n.global.locale = data
        })

        Loader(this.current_loader.project, 'record')
        Loader(this.current_loader.database, 'database')
        Loader(this.current_loader.node, 'node')
        Loader(this.current_loader.log, 'log')
        Loader(this.current_loader.lib, 'lib')
    }

    GetPreference = (uuid?: string):Preference => {
        return this.preference
    }

    save_preference = (pre:string) => {
        this.preference = JSON.parse(pre)
        const p = path.join(os.homedir(), DATA_FOLDER, 'preference.json')
        fs.writeFileSync(p, pre)
    }

    /**
     * Get preference data from memory or disk
     * @param cache Load from memory only
     * @returns The preference data
     */
    load_preference = (cache: boolean):Preference => {
        if(cache) return this.preference
        const p = path.join(os.homedir(), DATA_FOLDER, 'preference.json')
        const exist = fs.existsSync(p);
        console.log(`[Event] Read preference.js, file exist: ${exist}`)
        if(!exist){
            this.preference = CreatePreference()
            fs.writeFileSync(p, JSON.stringify(this.preference, null, 4))
            //i18n.global.locale = 'en'
            return this.preference
        } else {
            const file = fs.readFileSync(p, { encoding: 'utf8', flag: 'r' })
            this.preference = JSON.parse(file.toString())
            return this.preference
        }
    }
}

export const backendEvent = new BackendEvent()