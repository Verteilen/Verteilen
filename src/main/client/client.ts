import tcpPortUsed from 'tcp-port-used';
import { WebSocket, WebSocketServer } from 'ws';
import * as share from '../interface';
import { ClientAnalysis } from './analysis';
import { ClientExecute } from './execute';
import { ClientLua } from './lua';
import { ClientOS } from './os';
import { ClientParameter } from './parameter';

export class Client {
    client:WebSocketServer | undefined = undefined
    tag:string = ""
    settag = (v:string) => { this.tag = v }
    source:WebSocket | undefined = undefined

    messager:Function
    messager_log:Function
    para:ClientParameter
    os:ClientOS
    lua:ClientLua
    execute:ClientExecute
    analysis:ClientAnalysis

    constructor(_messager:Function, _messager_log:Function){
        this.messager = _messager
        this.messager_log = _messager_log
        this.para = new ClientParameter(this)
        this.os = new ClientOS(() => this.tag, _messager, _messager_log)
        this.lua = new ClientLua(_messager, _messager_log)
        this.execute = new ClientExecute(_messager, _messager_log, this.lua, this.os, this)
        this.analysis = new ClientAnalysis(_messager_log, this.execute)
        ClientLua.Init(_messager, _messager_log, this.os, this.para, 
            () => this.execute.libraries,
            () => this.execute.parameter
        )
    }

    Init = async () => {
        let port_result = share.PORT
        let canbeuse = false

        while(!canbeuse){
            await tcpPortUsed.check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }
        this.messager_log('[Server] Select Port: ' + port_result.toString())
        this.client = new WebSocketServer({port: port_result})
        this.client.on('listening', () => {
            this.messager_log('[聆聽事件] 伺服器啟動於 PORT: ' + port_result.toString())
        })
        this.client.on('error', (err) => {
            this.messager_log(`[錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        this.client.on('close', () => {
            this.messager_log('[關閉事件] 伺服器關閉 !')
        })
        this.client.on('connection', (ws, request) => {
            if (this.source != undefined) {
                this.messager_log(`[連線事件] 偵錯到第二個來源連線, 強制斷線`)
                ws.close();
                return;
            }
            this.source = ws;
            this.messager_log(`[連線事件] 偵測到新來源連線, ${ws.url}`)
            this.source.on('close', (code, reason) => {
                this.source = undefined;
                this.messager_log(`[來源關閉事件] ${code} ${reason}`)
            })
            this.source.on('error', (err) => {
                this.messager_log(`[來源錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            this.source.on('open', () => {
                this.messager_log(`[新來源事件] 新的來源也建立連結, URL: ${this.source?.url}`)
            })
            this.source.on('message', (data, isBinery) => {
                const h:share.Header | undefined = JSON.parse(data.toString());
                this.analysis.analysis(h);
            })
            this.source.on('pong', (data) => {
    
            })
            this.source.on('ping', (data) => {
    
            })
        })
    }
}
