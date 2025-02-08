import { source } from "./client/client";
import { Header, Single, WebsocketPack } from "./interface";
import { mainWindow } from "./main";
import { targets } from "./server/server";

/** 
* 傳送資料到 UI 執行序 
*/
export const messager = (msg:string) => mainWindow?.webContents.send('msgAppend', msg);

/** 
* 傳送資料到 UI 執行序 \
* 控制台輸出 \
* 回傳伺服器訊息
*/
export const messager_log = (msg:string) => {
    messager(msg);
    console.log(msg);
    if(source != undefined) {
        // 不用 message 是因為伺服器會需要知道 此訊息是從哪一個客戶端送出的
        const h:Single = { data: msg }
        const d:Header = { name: 'feedback_message', data: h}
        source.send(JSON.stringify(d))
    }
}

/**
* 傳送資料到 UI 執行序 \
* 控制台輸出 \
* 給指定的客戶端對象訊息 \
* @param wss 如果不輸入, 會直接從伺服器實體抓所有連線
*/
export const message_broadcast = (msg:string, wss?:Array<WebsocketPack>) => {
    messager(msg);
    console.log(msg);
    const ts = wss == undefined ? targets : wss
    ts.forEach(s => {
        const d:Header = { name: 'message', message: msg}
        s.websocket.send(JSON.stringify(d))
    })
}