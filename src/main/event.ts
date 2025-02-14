import { dialog, ipcMain } from "electron";
import fs from "fs";
import { clientinit } from "./client/client";
import { dir_copy, dir_delete, file_copy, file_delete, fs_exist } from "./client/os";
import { messager_log } from "./debugger";
import { Log, Preference, Project, Record } from "./interface";
import { mainWindow } from "./main";
import { menu_client, menu_server, setupMenu } from "./menu";
import { i18n } from "./plugins/i18n";

export let menu_state = false

export const eventInit = () => {
    clientinit()
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
    
    ipcMain.on('file_copy', (event, from:string, to:string):void => {
        file_copy({ from: from, to: to })
    })
    
    ipcMain.on('dir_copy', (event, from:string, to:string):void => {
        dir_copy({ from: from, to: to })
    })
    
    ipcMain.on('file_delete', (event, path:string):void => {
        file_delete({ path: path })
    })
    
    ipcMain.on('dir_delete', (event, path:string):void => {
        dir_delete({ path: path })
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

    ipcMain.on('save_preference', (e, preference:string) => {
        fs.writeFileSync('preference.json', preference)
    })

    ipcMain.handle('load_preference', (e) => {
        const exist = fs.existsSync('preference.json');
        messager_log(`[事件] 讀取 preference.js, 檔案存在: ${exist}`)
        if(!exist){
            const record:Preference = {
                lan: 'zh_TW'
            }
            fs.writeFileSync('preference.json', JSON.stringify(record, null, 4))
            i18n.global.locale = 'zh_TW'
            setupMenu()
            return JSON.stringify(record)
        } else {
            const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
            return file.toString()
        }
    })
    
    ipcMain.handle('fs_exist', (event, path:string):boolean => {
        return fs_exist({ path: path })
    })
    
    ipcMain.handle('dir_create', (event, path:string):string | undefined => {
        return fs.mkdirSync(path, {recursive: true})
    })
    
    ipcMain.handle('dir_list', (event, path:string):Array<string> => {
        return fs.readdirSync(path, {withFileTypes: false}).map(x => x)
    })
    
    ipcMain.handle('file_list', (event, path:string):Array<string> => {
        return fs.readdirSync(path, {withFileTypes: true}).map(x => x.name)
    })
    ipcMain.on('import_project', (event) => {
        ImportProject()
    })
    ipcMain.on('export_project', (event, data:string) => {
        const p:Array<Project> = JSON.parse(data)
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

export const ImportProject = () => {
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

export const ExportProject = (value:Array<Project>) => {
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