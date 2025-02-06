import { ipcMain } from "electron";
import fs from "fs";
import { clientinit } from "./client/client";
import { dir_copy, dir_delete, file_copy, file_delete, fs_exist } from "./client/os";
import { mainWindow } from "./main";
import menu from "./menu";
import { serverinit } from "./server/server";

export const eventInit = () => {
    serverinit()
    clientinit()
    ipcMain.on('message', (event, message) => {
        console.log(`[後台訊息] ${message}`);
    })
    
    ipcMain.on('modeSelect', (event, isclient:boolean) => {
        console.log("[後台訊息] 選擇模式: " + (isclient ? "節點" : "伺服器"))
        if(isclient) event.sender.send('msgAppend', "客戶端模式啟動")
    })
    
    ipcMain.on('menu', (event, on:Array<boolean>):void => {
        if(mainWindow == undefined) return;
        console.log(`[後台訊息] 工具列顯示設定為: ${on[0]}`)
        if(on[0]) mainWindow.setMenu(menu)
        else mainWindow.setMenu(null)
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
}