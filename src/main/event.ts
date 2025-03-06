import { dialog, ipcMain } from "electron";
import fs from "fs";
import { Client } from "./client/client";
import { messager, messager_log } from "./debugger";
import { Libraries, Log, Preference, Project, Record } from "./interface";
import { mainWindow } from "./main";
import { menu_client, menu_server, setupMenu } from "./menu";
import { i18n } from "./plugins/i18n";

export class BackendEvent {
    menu_state = false
    client:Client | undefined = undefined

    Init = () => {
        this.client = new Client(messager, messager_log)
        ipcMain.on('client_start', (event, content:string) => {
            if(this.client == undefined) return
            this.client.Init()
        })
        ipcMain.on('client_stop', (event, content:string) => {
            if(this.client == undefined) return
            if (this.client?.client != undefined) this.client.client.close()
                this.client.client = undefined
                this.client.source = undefined;
        })
    
        ipcMain.on('lua', (event, content:string) => {
            const r = this.client?.lua.LuaExecute(content)
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
            this.menu_state = on
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
            this.ImportProject()
        })
        ipcMain.on('export_projects', (event, data:string) => {
            const p:Array<Project> = JSON.parse(data)
            this.ExportProjects(p)
        })
        ipcMain.on('export_project', (event, data:string) => {
            const p:Project = JSON.parse(data)
            this.ExportProject(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            i18n.global.locale = data
            setupMenu()
        })
    }

    ImportProject = () => {
        if(mainWindow == undefined) return;
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
            ]
        }).then(v => {
            if (v.canceled) return
            if(mainWindow == undefined) return;
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
}

export const backendEvent = new BackendEvent()