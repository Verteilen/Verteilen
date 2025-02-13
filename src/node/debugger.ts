import { source } from "./client";
import { Header, Single } from "./interface";

export const messager = (msg:string, tag?:string) => {
    const str = tag != undefined ? `[${tag}] ${msg}` : `[節點訊息] ${msg}`
    console.log(str);
}

export const messager_log = (msg:string, tag?:string) => {
    const str = tag != undefined ? `[${tag}] ${msg}` : `[節點訊息] ${msg}`
    console.log(str);
    if(source != undefined) {
        // 不用 message 是因為伺服器會需要知道 此訊息是從哪一個客戶端送出的
        const h:Single = { data: msg }
        const d:Header = { name: 'feedback_message', data: h}
        source.send(JSON.stringify(d))
    }
}