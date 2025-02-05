import { ipcMain } from "electron";
import fs from "fs";

ipcMain.on('message', (event, message) => {
    console.log(message);
})

ipcMain.on('modeSelect', (event, isclient:boolean) => {
    console.log("Select mode: " + isclient ? "Client" : "Server")
    event.sender.send('msgAppend', "Client mode on...")
})

ipcMain.on('file_copy', (event, from:string, to:string):void => {
    fs.copyFileSync(from, to)
})

ipcMain.on('dir_copy', (event, from:string, to:string):void => {
    fs.cpSync(from, to, { recursive: true, force: true })
})

ipcMain.on('file_delete', (event, path:string):void => {
    fs.rmSync(path);
})

ipcMain.on('dir_delete', (event, path:string):void => {
    fs.rmSync(path, { recursive: true, force: true })
})

ipcMain.handle('fs_exist', (event, path:string):boolean => {
    return fs.existsSync(path)
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