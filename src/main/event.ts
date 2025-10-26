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
    ImportParameter, 
    ExportParameter 
} from "./util/io";
import { mainWindow } from "./electron";
import { 
    Client,
    ClientJobExecute,
    CreatePreference,
    CreateRecordIOLoader,
    DATA_FOLDER, 
    Job, 
    JobCategory, 
    JobType, 
    Parameter, 
    PluginList, 
    Preference, 
    Project, 
    RecordIOLoader, 
    Server
} from "./interface";
import { CreatePluginLoader, PluginLoader } from "verteilen-core/src/server/plugin";

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
    ipcMain.handle('get_plugin', async (e) => loader.get_plugin())
    ipcMain.handle('import_template', async (event, name:string, url:string, token:string) => loader.import_template(name, url, token))
    ipcMain.handle('import_plugin', async (event, name:string, url:string, token:string) => loader.import_plugin(name, url, token))
    ipcMain.handle('delete_template', async (event, name:string) => loader.delete_template(name))
    ipcMain.handle('delete_plugin', async (event, name:string) => loader.delete_plugin(name))
    ipcMain.handle('get_project', async (event, group:string, filename:string) => loader.get_project(group, filename))
    ipcMain.handle('get_parameter', async (event, group:string, filename:string) => loader.get_parameter(group, filename))
    ipcMain.on('plugin_download', (event, uuid:string, plugin:string, tokens:string) => loader.plugin_download(uuid, plugin, tokens))
    ipcMain.on('plugin_remove', (event, uuid:string, plugin:string) => loader.plugin_remove(uuid, plugin))
}

export class BackendEvent extends Server {
    client:Client.Client | undefined = undefined
    util: Util_Server = new Util_Server(this)

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

        /**
         * * IO And Plugin Setup
         */
        this.io = {
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
        this.loader = CreateRecordIOLoader(this.io, this.memory)
        this.LoadFromDisk()
        this.plugin_loader = CreatePluginLoader(this.io, this.plugin, (uuid:string) => {
            return this.util.websocket_manager?.targets.find(x => x.uuid == uuid)
        }, {
            electron: mainWindow?.webContents.send,
            socket: undefined
        })
        this.plugin_loader.load_all()
        PluginInit(this.plugin_loader)
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
        ipcMain.on('javascript', (event, content:string, parameter:string | undefined) => {
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
            worker.parameter = parameter ? JSON.parse(parameter) : undefined
            worker.execute().then(x => {
                javascript_messager_feedback(x, "Finish")
            })
        })
        ipcMain.on('message', (event, message:string, tag?:string) => {
            console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`);
        })
        ipcMain.on('save_preference', (e, preference:string) => {
            const p = path.join(os.homedir(), DATA_FOLDER, 'preference.json')
            fs.writeFileSync(p, preference)
        })
        ipcMain.handle('load_preference', (e) => {
            const p = path.join(os.homedir(), DATA_FOLDER, 'preference.json')
            const exist = fs.existsSync(p);
            messager_log(`[Event] Read preference.js, file exist: ${exist}`)
            if(!exist){
                const record:Preference = CreatePreference()
                fs.writeFileSync(p, JSON.stringify(record, null, 4))
                //i18n.global.locale = 'en'
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync(p, { encoding: 'utf8', flag: 'r' })
                const jsonString = file.toString()
                this.util.preference = JSON.parse(jsonString)
                return jsonString
            }
        })
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
        ipcMain.on('import_parameter', (event) => {
            ImportParameter()
        })
        ipcMain.on('export_parameter', (event, data:string) => {
            const p:Parameter = JSON.parse(data)
            ExportParameter(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            //i18n.global.locale = data
        })

        Loader(this.current_loader.project, 'record')
        Loader(this.current_loader.parameter, 'parameter')
        Loader(this.current_loader.node, 'node')
        Loader(this.current_loader.log, 'log')
        Loader(this.current_loader.lib, 'lib')
    }
}

export const backendEvent = new BackendEvent()