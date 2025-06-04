import { Client } from './client/client';
import { Header, Single } from './interface';

let client:Client | undefined = undefined

if (process.env?.npm_lifecycle_script?.includes('ts-node')) {
  process.env.NODE_ENV = 'development'
}

const messager = (msg:string, tag?:string) => {
    const str = tag != undefined ? `[${tag}] ${msg}` : `[Node Info] ${msg}`
    console.log(str);
}

const messager_log = (msg:string, tag?:string) => {
    const str = tag != undefined ? `[${tag}] ${msg}` : `[Node Info] ${msg}`
    console.log(str);
    if(client == undefined) return
    if(client.clients.length > 0) {
        // 不用 message 是因為伺服器會需要知道 此訊息是從哪一個客戶端送出的
        const h:Single = { data: msg }
        const d:Header = { name: 'feedback_message', data: h}
        client.clients.forEach(x => x.send(JSON.stringify(d)))
    }
}

console.log("dir: " + process.cwd())
client = new Client(messager, messager_log)
client.Init()