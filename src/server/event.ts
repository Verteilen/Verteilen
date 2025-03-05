import { dialog, ipcMain } from "electron";
import fs from "fs";
import ws from 'ws';
import { Client } from "./client/client";
import { messager, messager_log } from "./debugger";
import { BusAnalysis, BusJobFinish, BusJobStart, BusProjectFinish, BusProjectStart, BusSubTaskFinish, BusSubTaskStart, BusTaskFinish, BusTaskStart, ExecuteProxy, Header, Libraries, Log, Preference, Project, Record, Setter, WebsocketPack } from "./interface";
import { i18n } from "./plugins/i18n";
import { ExecuteManager } from "./script/execute_manager";
import { WebsocketManager } from "./script/socket_manager";

export class BackendEvent {
    client:Client | undefined = undefined
    websocket_manager:WebsocketManager | undefined = undefined
    execute_manager:ExecuteManager | undefined = undefined
    manager:Array<ws.WebSocket> = []
    libs:Libraries = {libs: []}
    
    constructor(){
        this.client = new Client(messager, messager_log)
    }

    Init = () => {
        const proxy:ExecuteProxy = {
            executeProjectStart: (data:BusProjectStart):void => { emitter?.emit('executeProjectStart', data) },
            executeProjectFinish: (data:BusProjectFinish):void => { emitter?.emit('executeProjectFinish', data) },
            executeTaskStart: (data:BusTaskStart):void => { emitter?.emit('executeTaskStart', data) },
            executeTaskFinish: (data:BusTaskFinish):void => { emitter?.emit('executeTaskFinish', data) },
            executeSubtaskStart: (data:BusSubTaskStart):void => { emitter?.emit('executeSubtaskStart', data) },
            executeSubtaskFinish: (data:BusSubTaskFinish):void => { emitter?.emit('executeSubtaskFinish', data) },
            executeJobStart: (data:BusJobStart):void => { emitter?.emit('executeJobStart', data) },
            executeJobFinish: (data:BusJobFinish):void => { emitter?.emit('executeJobFinish', data) },
            feedbackMessage: (data:Setter):void => { emitter?.emit('feedbackMessage', data) },
        }

        this.websocket_manager = new WebsocketManager(this.newConnect, this.disconnect, this.analysis, messager_log)
        this.execute_manager = new ExecuteManager(this.websocket_manager, messager_log)
        this.execute_manager.libs = this.libs
        this.execute_manager.proxy = proxy
        this.websocket_manager.newConnect = this.newConnect
        this.websocket_manager.disconnect = this.disconnect
        this.websocket_manager.onAnalysis = this.execute_manager.Analysis
    }

    NewConsole = (socket:ws.WebSocket) => {
        this.manager.push(socket)
    }

    DropConsole = (socket:ws.WebSocket) => {
        const index = this.manager.findIndex(x => x == socket)
        if(index != -1) this.manager.splice(index, 1)
    }

    Analysis = (socket:ws.WebSocket, h:Header) => {
        const typeMap:{ [key:string]:Function } = {
            'lua': this.lua
        }

        if (h == undefined){
            messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            messager_log(`[來源資料解析] ${h.message}`)
        }
        if (h.data == undefined) return
        if(typeMap.hasOwnProperty(h.name)){
            const castingFunc = typeMap[h.name]
            castingFunc(h.data)
        }else{
            messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${h.name}, meta: ${h.meta}`)
        }


    
        ipcMain.on('lua', (event, content:string) => {
            const r = client?.lua.LuaExecute(content)
            event.sender.send('lua-feedback', r?.toString() ?? '')
        })
        ipcMain.on('message', (event, message:string, tag?:string) => {
            console.log(`${ tag == undefined ? '[後台訊息]' : '[' + tag + ']' } ${message}`);
        })
        
        ipcMain.on('modeSelect', (event, isclient:boolean) => {
            console.log("[後台訊息] 選擇模式: " + (isclient ? "節點" : "伺服器"))
            if(isclient) event.sender.send('msgAppend', "客戶端模式啟動")
        })
        
        ipcMain.on('menu', (event, on:boolean):void => {
            if(mainWindow == undefined) return;
            console.log(`[後台訊息] 工具列顯示設定為: ${on}`)
            menu_state = on
            if(on) mainWindow.setMenu(menu_server)
            else mainWindow.setMenu(menu_client)
        })
        ipcMain.on('save_record', (e, record:string) => {
            fs.writeFileSync('record.json', record)
        })
        ipcMain.handle('load_record', (e) => {
            const exist = fs.existsSync('record.json');
            messager_log(`[事件] 讀取 record.js, 檔案存在: ${exist}`)
            if(!exist){
                const record:Record = {
                    projects: [],
                    nodes: []
                }
                fs.writeFileSync('record.json', JSON.stringify(record, null, 4))
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('record.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        ipcMain.on('save_log', (e, log:string) => {
            fs.writeFileSync('log.json', log)
        })
        ipcMain.handle('load_log', (e) => {
            const exist = fs.existsSync('log.json');
            messager_log(`[事件] 讀取 log.js, 檔案存在: ${exist}`)
            if(!exist){
                const record:Log = {
                    logs: []
                }
                fs.writeFileSync('log.json', JSON.stringify(record, null, 4))
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('log.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        ipcMain.on('save_lib', (e, log:string) => {
            fs.writeFileSync('lib.json', log)
        })
        ipcMain.handle('load_lib', (e) => {
            const exist = fs.existsSync('log.json');
            messager_log(`[事件] 讀取 lib.js, 檔案存在: ${exist}`)
            if(!exist){
                const record:Libraries = {
                    libs: []
                }
                fs.writeFileSync('lib.json', JSON.stringify(record, null, 4))
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('lib.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        ipcMain.on('save_preference', (e, preference:string) => {
            fs.writeFileSync('preference.json', preference)
        })
        ipcMain.handle('load_preference', (e) => {
            const exist = fs.existsSync('preference.json');
            messager_log(`[事件] 讀取 preference.js, 檔案存在: ${exist}`)
            if(!exist){
                const record:Preference = {
                    lan: 'en'
                }
                fs.writeFileSync('preference.json', JSON.stringify(record, null, 4))
                i18n.global.locale = 'en'
                setupMenu()
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        ipcMain.on('import_project', (event) => {
            ImportProject()
        })
        ipcMain.on('export_projects', (event, data:string) => {
            const p:Array<Project> = JSON.parse(data)
            ExportProjects(p)
        })
        ipcMain.on('export_project', (event, data:string) => {
            const p:Project = JSON.parse(data)
            ExportProject(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            i18n.global.locale = data
            setupMenu()
        })
        ipcMain.handle('eval', (event, str:string):string => {
            return Function(`return ${str}`)()
        })
    }

    //#region Server Side
    
    private newConnect = (x:WebsocketPack) => {
        const d:Header = {
            name: 'makeToast',
            data: {
                title: "連線建立",
                type: 'success',
                message: `建立新的連線: ${x.websocket.url} \n${x.uuid}`
            }
        }
        this.manager.forEach(x => {
            x.send(JSON.stringify(d))
        })
        this.execute_manager?.NewConnection(x)
    }

    private disconnect = (x:WebsocketPack) => {
        const d:Header = {
            name: 'makeToast',
            data: {
                title: "連線中斷",
                type: 'danger',
                message: `連線中斷偵測: ${x.websocket.url} \n${x.uuid}`
            }
        }
        this.manager.forEach(x => {
            x.send(JSON.stringify(d))
        })
    }

    private analysis = (b:BusAnalysis) => {
        this.execute_manager?.Analysis(b)
    }
    
    private lua = (socket:ws.WebSocket, content:string) => {
        const r = this.client?.lua.LuaExecute(content)
        const d:Header = {
            name: 'lua-feedback',
            data: r?.toString() ?? ''
        }
        socket.send(JSON.stringify(d))
    }

    ImportProject = () => {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
            ]
        }).then(v => {
            if (v.canceled) return
            const p:Array<any> = []
            for(const x of v.filePaths){
                p.push(JSON.parse(fs.readFileSync(x).toString()))
            }
            mainWindow.webContents.send('import_project_feedback', JSON.stringify(p))
        })
    }
    
    ExportProject = (value:Project) => {
        if(mainWindow == undefined) return;
        dialog.showSaveDialog(mainWindow, {
            filters: [
                {
                    name: "JSON",
                    extensions: ['json']
                }
            ]
        }).then(v => {
            if (v.canceled || v.filePath.length == 0) return
            if(mainWindow == undefined) return;
            const path = v.filePath[0]
            fs.writeFileSync(path, JSON.stringify(value, null, 4))
        })
    }
    
    ExportProjects = (value:Array<Project>) => {
        if(mainWindow == undefined) return;
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        }).then(v => {
            if (v.canceled || v.filePaths.length == 0) return
            if(mainWindow == undefined) return;
            const path = v.filePaths[0]
            for(var x of value){
                fs.writeFileSync(`${path}/${x.title}.json`, JSON.stringify(x, null, 4))
            }
        })
    }
    //#endregion
}


export const backendEvent = new BackendEvent()
