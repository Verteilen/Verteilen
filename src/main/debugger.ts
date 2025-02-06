import { mainWindow } from "./main";

export const messager = (msg:string) => mainWindow?.webContents.send('msgAppend', msg);
export const messager_log = (msg:string) => {
    messager(msg);
    console.log(msg);
}