import { consoleEvent } from "..";
import { Header, WebsocketPack } from "../interface";
import { messager_log } from "./../debugger";

export const analysis = (h:Header | undefined, c:WebsocketPack | undefined) => {
    if (h == undefined){
        messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
        return;
    }
    if (h.message != undefined && h.message.length > 0){
        messager_log(`[來源資料解析] ${h.message}`)
    }
    if (h.data == undefined) return
    consoleEvent.emit('analysis', {name: h.name, h: h, c: c})
}