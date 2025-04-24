import { mainWindow } from "./electron";
import { backendEvent } from "./event";
import { Header, Single, WebsocketPack } from "./interface";

/** 
* 傳送資料到 UI 執行序 
*/
export const messager = (...args:Array<string | undefined>) => {
    if(mainWindow == null || mainWindow == undefined || mainWindow.isDestroyed()) return
    mainWindow.webContents.send('msgAppend', args);
}

export const messager_feedback = (msg:string, meta?:string) => {
    if(backendEvent.client == undefined) return
    if(backendEvent.client.count > 0) {
        // 不用 message 是因為伺服器會需要知道 此訊息是從哪一個客戶端送出的
        const h:Single = { data: msg }
        const d:Header = { name: 'feedback_message', meta: meta, data: h}
        backendEvent.client.clients.forEach(x => x.send(JSON.stringify(d)))
    }
}

/** 
* 傳送資料到 UI 執行序 \
* 控制台輸出 \
* 回傳伺服器訊息
*/
export const messager_log = (msg:string, tag?:string, meta?:string) => {
    messager(msg, tag);
    console.log(msg);
    messager_feedback(msg, meta)
}

/**
* 傳送資料到 UI 執行序 \
* 控制台輸出 \
* 給指定的客戶端對象訊息 \
* @param wss 如果不輸入, 會直接從伺服器實體抓所有連線
*/
export const message_broadcast = (msg:string, wss:Array<WebsocketPack>) => {
    messager(msg);
    console.log(msg);
    wss.forEach(s => {
        const d:Header = { name: 'message', message: msg}
        s.websocket.send(JSON.stringify(d))
    })
}