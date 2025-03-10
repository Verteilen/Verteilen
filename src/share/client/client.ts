import tcpPortUsed from 'tcp-port-used';
import { WebSocket, WebSocketServer } from 'ws';
import { Header, Messager, PORT } from '../interface';
import { ClientAnalysis } from './analysis';

/**
 * The calculation node worker
 */
export class Client {
    private client:WebSocketServer | undefined = undefined
    private sources:Array<WebSocket> = []

    private messager:Messager
    private messager_log:Messager
    private analysis:ClientAnalysis

    public get count() : number {
        return this.sources.length
    }
    
    public get clients() : Array<WebSocket> {
        return this.sources
    }

    constructor(_messager:Messager, _messager_log:Messager){
        this.messager = _messager
        this.messager_log = _messager_log
        this.analysis = new ClientAnalysis(_messager, _messager_log, this)
        setInterval(this.update, 10000);
    }

    /**
     * Start a websocket server, and waiting for cluster server to connect
     */
    Init = async () => {
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
            this.sources.push(ws)
            this.messager_log(`[連線事件] 偵測到新來源連線, ${ws.url}`)
            ws.on('close', (code, reason) => {
                const index = this.sources.findIndex(x => x == ws)
                if(index != -1) this.sources.splice(index, 1)
                this.messager_log(`[來源關閉事件] ${code} ${reason}`)
            })
            ws.on('error', (err) => {
                this.messager_log(`[來源錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            ws.on('open', () => {
                this.messager_log(`[新來源事件] 新的來源也建立連結, URL: ${ws?.url}`)
            })
            ws.on('message', (data, isBinery) => {
                const h:Header | undefined = JSON.parse(data.toString());
                this.analysis.analysis(h, ws);
            })
        })
    }

    Destroy = () => {
        if(this.client == undefined) return
        this.client.close((err) => {
            this.messager_log(`[Client] Close error ${err}`)
        })
    }

    /**
     * The node update function, It will do things below
     * * Send system info to cluster server
     */
    private update = () => {
        this.analysis.update(this)
    }
}
