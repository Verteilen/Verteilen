import tcpPortUsed from 'tcp-port-used';
import * as ws from 'ws';
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { DATA_FOLDER, GlobalPermission, Header, Job, JobCategory, JobType, Libraries, LocalPermiision, Parameter, PermissionType, PluginList, Preference, Record, ServerSetting, UserProfile, UserProfileClient, UserType } from "./interface";
import { ConsoleServerManager } from "./script/console_server_manager";
import { Loader, TypeMap } from "./util/loader";
import { Util_Server } from "./util/server/server";
import { v6 as uuidv6 } from 'uuid'
import { PluginInit } from './util/plugin';
import { ClientJobExecute } from './client/job_execute';

export class BackendEvent {
    manager:Array<ConsoleServerManager> = []

    setting: ServerSetting | undefined
    jsCall:ClientJavascript
    util: Util_Server = new Util_Server(this)
    libs:Libraries = {libs: []}
    
    constructor(){
        this.jsCall = new ClientJavascript(messager, messager_log, () => undefined)
    }

    // The new manager enter the hood
    NewConsoleConsole = (socket:ws.WebSocket) => {
        console.log(`New Connection ${socket.url}`)
        let typeMap:TypeMap = {
            'javascript': this.javascript,
            'message': this.message,
            'load_record_obsolete': this.load_record_obsolete,
            'save_preference': this.save_preference,
            'load_preference': this.load_preference,
        }
        typeMap = this.util.EventInit(typeMap)
        Loader(typeMap, 'record', 'record', PermissionType.PROJECT)
        Loader(typeMap, 'parameter', 'parameter', PermissionType.PARAMETER)
        Loader(typeMap, 'node', 'node', PermissionType.NODE)
        Loader(typeMap, 'log', 'log', PermissionType.LOG)
        Loader(typeMap, 'lib', 'lib', PermissionType.LIB, '')
        Loader(typeMap, 'user', 'user', PermissionType.ROOT)
        PluginInit(typeMap, this)
        const n = new ConsoleServerManager(socket, messager_log, typeMap)
        this.manager.push(n)
        return n
    }

    DropConsoleConsole = (socket:ws.WebSocket) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) this.manager.splice(index, 1)
    }

    ConsoleAnalysis = (socket:ws.WebSocket, h:Header) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) {
            this.manager[index].Analysis(h)
        } else {
            const n = this.NewConsoleConsole(socket)
            n.Analysis(h)
        }
    }

    IsPass = (token:string) => {
        const pa_root = path.join(os.homedir(), DATA_FOLDER)
        const pa = path.join(pa_root, 'user')
        return fs.existsSync(path.join(pa, token + '.json'))
    }

    //#region Manager Side
    private javascript = (socket:ws.WebSocket, content:string, parameter:string | undefined) => {
        const javascript_messager_feedback = (msg:string, tag?:string) => {
            messager(msg, tag)
            const d:Header = {
                name: 'javascript-feedback',
                data: msg
            }
            socket.send(JSON.stringify(d))
        }

        const d:Job = {
            uuid: 'javascript',
            category: JobCategory.Execution,
            type: JobType.JAVASCRIPT,
            script: content,
            string_args: [],
            number_args: [],
            boolean_args: []
        }
        const p:PluginList = { plugins: [] }
        const worker = new ClientJobExecute(javascript_messager_feedback, javascript_messager_feedback, d, undefined, p)
        worker.parameter = parameter ? JSON.parse(parameter) : undefined
        worker.execute().then(x => {
            javascript_messager_feedback(x, "Finish")
        })
    }
    private message = (socket:ws.WebSocket, message:string, tag?:string) => {
        console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`);
    }
    private load_record_obsolete = (socket:ws.WebSocket, dummy: number) => {
        if(!fs.existsSync('record.json')) return undefined
        const data = fs.readFileSync('record.json').toString()
        fs.rmSync('record.json')
        const d:Header = {
            name: "load_record_obsolete-feedback",
            data: data
        }
        socket.send(JSON.stringify(d))
    }
    private save_preference = (socket:ws.WebSocket, preference:string, token?:string) => {
        const pa = path.join(os.homedir(), DATA_FOLDER, "user")
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true})
        if(token != undefined){
            const target = path.join(pa, token + '.json')
            const p:UserProfile = JSON.parse(fs.readFileSync(target).toString())
            p.preference = JSON.parse(preference)
            fs.writeFileSync(target, JSON.stringify(p, null, 4))
        }
    }
    private load_preference = (socket:ws.WebSocket, token?:string) => {
        const pa = path.join(os.homedir(), DATA_FOLDER, "user")
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true})
        if(token != undefined){
            const file = path.join(pa, token + '.json')
            if(fs.existsSync(file)){
                const p:UserProfile = JSON.parse(fs.readFileSync(file).toString())
                const d:Header = { name: "load_preference-feedback", data: JSON.stringify(p.preference) }
                socket.send(JSON.stringify(d))
            }
        }
    }

    PortAvailable = async (start:number) => {
        let port_result = start
        let canbeuse = false

        while(!canbeuse){
            await tcpPortUsed.check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }

        return port_result
    }

    Boradcasting = (name:string, data:any) => {
        const d:Header = {
            name: name,
            data: data
        }
        this.manager.forEach(x => {
            x.ws.send(JSON.stringify(d))
        })
    }
    //#endregion

    //#region Server
    Root = (port:number) => {
        const pa_root = path.join(os.homedir(), DATA_FOLDER)
        const pa = path.join(pa_root, 'user')
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true});
        const c = fs.readdirSync(pa).length
        if(c == 0){
            const root:UserProfile = {
                token: uuidv6(),
                type: UserType.ROOT,
                preference: {
                    lan: 'en',
                    log: true,
                    font: 18,
                    theme: "dark",
                    notification: false,
                    plugin_token: [],
                    animation: true,
                },
                name: "root",
                description: "Root User",
                permission: this.RootPermission()
            }
            fs.writeFileSync(path.join(pa, root.token + '.json'), JSON.stringify(root, null, 2))
            console.log(`Login with root using: ${root.token} `)
            console.log(`Login with root using: https://127.0.0.1:${port}/login/${root.token} `)
        }else{
            const files = fs.readdirSync(pa).filter(x => x.endsWith('.json'))
            for(let file of files){
                const user:UserProfile = JSON.parse(fs.readFileSync(path.join(pa, file)).toString())
                if(user.type == UserType.ROOT){
                    console.log(`Login with root using: ${user.token} `)
                    console.log(`Login with root using: https://127.0.0.1:${port}/login/${user.token} `)
                }
            }
        }
        const server_setting = path.join(pa_root, "server.json")
        if(!fs.existsSync(server_setting)){
            this.setting = {
                open_guest: false
            }
            fs.writeFileSync(server_setting, JSON.stringify(this.setting, null, 2))
        }else{
            this.setting = JSON.parse(fs.readFileSync(server_setting).toString());
        }
    }

    RootPermission = () => {
        const perl:LocalPermiision = {
            view: true,
            create: true,
            edit: true,
            delete: true,
        }
        const per:GlobalPermission = {
            project: perl,
            task: perl,
            job: perl,
            plugin: perl,
            node: perl,
            parameter: perl,
            lib: perl,
            log: perl,
            execute_job: true
        }
        return per
    }

    GetUserType = (token?:string):UserProfileClient => {
        const pa_root = path.join(os.homedir(), DATA_FOLDER)
        const pa = path.join(pa_root, 'user')
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true});
        if(token != undefined){
            const target_path = path.join(pa, token + '.json')
            const p:UserProfile = JSON.parse(fs.readFileSync(target_path).toString())
            if(p.token == token){
                return {
                    name: p.name,
                    type: p.type,
                    picture_url: false,
                    description: p.description,
                    permission: p.type == UserType.ROOT ? this.RootPermission() : p.permission
                }
            }
        }
        return {
            name: "GUEST",
            picture_url: false,
            type: UserType.GUEST
        }
    }

    ChangeProfile = (token:string | undefined, data:any) => {
        const pa_root = path.join(os.homedir(), DATA_FOLDER)
        const pa = path.join(pa_root, 'user')
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true});
        if(token != undefined){
            const target_path = path.join(pa, token + '.json')
            const p:UserProfile = JSON.parse(fs.readFileSync(target_path).toString())
            if(p.token == token){
                if(data.name != undefined){
                    p.name = data.name
                }
                if(data.description != undefined){
                    p.description = data.description
                }
                fs.writeFileSync(target_path, JSON.stringify(p, null, 2))
                console.log("Update")
            }
        }else{
            console.log("token is null")
        }
    }
    //#endregion
}


export const backendEvent = new BackendEvent()
