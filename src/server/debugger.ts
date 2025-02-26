import { Header, WebsocketPack } from "./interface";

/** 
* 傳送資料到 UI 執行序 
*/
export const messager = (...args:Array<string | undefined>) => {}

/** 
* 傳送資料到 UI 執行序 \
* 控制台輸出 \
* 回傳伺服器訊息
*/
export const messager_log = (msg:string, tag?:string) => {
    messager(msg, tag);
    console.log(msg);
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