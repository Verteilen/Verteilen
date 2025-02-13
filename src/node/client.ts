import tcpPortUsed from 'tcp-port-used';
import ws, { WebSocketServer } from 'ws';
import { analysis } from './analysis';
import { messager_log } from './debugger';
import { Header, PORT } from './interface';

export let tag:string | undefined = undefined
export const settag = (v:string | undefined) => { tag = v }
export let source:ws.WebSocket | undefined = undefined
export let client:WebSocketServer | undefined = undefined

export const clientinit = async () => {
    let port_result = PORT
    let canbeuse = false
    while(!canbeuse){
        await tcpPortUsed.check(port_result).then(x => {
            canbeuse = !x
        }).catch(err => {
            canbeuse = true
        })
        if(!canbeuse) port_result += 1
    }
    messager_log('[伺服器] 選定 Port: ' + port_result.toString())
    client = new WebSocketServer({port: port_result})
    client.on('listening', () => {
        messager_log('[聆聽事件] 伺服器啟動於 PORT: ' + port_result.toString())
    })
    client.on('error', (err) => {
        messager_log(`[錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
    })
    client.on('close', () => {
        messager_log('[關閉事件] 伺服器關閉 !')
    })
    client.on('connection', (ws, request) => {
        if (source != undefined) {
            messager_log(`[連線事件] 偵錯到第二個來源連線, 強制斷線`)
            ws.close();
            return;
        }
        source = ws;
        messager_log(`[連線事件] 偵測到新來源連線, ${ws.url}`)
        source.on('close', (code, reason) => {
            source = undefined;
            messager_log(`[來源關閉事件] ${code} ${reason}`)
        })
        source.on('error', (err) => {
            messager_log(`[來源錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        source.on('open', () => {
            messager_log(`[新來源事件] 新的來源也建立連結, URL: ${source?.url}`)
        })
        source.on('message', (data, isBinery) => {
            const h:Header | undefined = JSON.parse(data.toString());
            analysis(h);
        })
        source.on('pong', (data) => {

        })
        source.on('ping', (data) => {

        })
    })
}
