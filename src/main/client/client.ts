import * as path from 'path';
import { check } from 'tcp-port-used';
import { WebSocket, WebSocketServer } from 'ws';
import { CLIENT_UPDATETICK, Header, Messager, Messager_log, PORT } from '../interface';
import { ClientAnalysis } from './analysis';

/**
 * The calculation node worker
 */
export class Client {
    private client:WebSocketServer | undefined = undefined
    private sources:Array<WebSocket> = []

    private messager:Messager
    private messager_log:Messager_log
    private analysis:ClientAnalysis
    private updatehandle 

    public get count() : number {
        return this.sources.length
    }
    
    public get clients() : Array<WebSocket> {
        return this.sources
    }

    constructor(_messager:Messager, _messager_log:Messager_log){
        this.messager = _messager
        this.messager_log = _messager_log
        this.analysis = new ClientAnalysis(_messager, _messager_log, this)
        this.updatehandle = setInterval(this.update, CLIENT_UPDATETICK);
    }

    Dispose (){
        clearInterval(this.updatehandle)
    }

    /**
     * Start a websocket server, and waiting for cluster server to connect
     */
    Init = async () => {
        let port_result = PORT
        let canbeuse = false

        while(!canbeuse){
            await check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }
        this.messager_log('[Server] Select Port: ' + port_result.toString())
        this.client = new WebSocketServer({port: port_result})
        this.client.on('listening', () => {
            this.messager_log('[Server] Listen PORT: ' + port_result.toString())
        })
        this.client.on('error', (err) => {
            this.messager_log(`[Server] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        this.client.on('close', () => {
            this.messager_log('[Server] Close !')
        })
        this.client.on('connection', (ws, request) => {
            this.sources.push(ws)
            this.messager_log(`[Server] New Connection detected, ${ws.url}`)
            ws.on('close', (code, reason) => {
                const index = this.sources.findIndex(x => x == ws)
                if(index != -1) this.sources.splice(index, 1)
                this.messager_log(`[Source] Close ${code} ${reason}`)
                this.analysis.disconnect(ws)
            })
            ws.on('error', (err) => {
                this.messager_log(`[Source] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            ws.on('open', () => {
                this.messager_log(`[Source] New source is connected, URL: ${ws?.url}`)
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
        this.analysis.stop_all()
    }

    /**
     * The node update function, It will do things below
     * * Send system info to cluster server
     */
    private update = () => {
        this.analysis.update(this)
    }

    public static workerPath = () => {
        // @ts-ignore
        const isExe = process.pkg?.entrypoint != undefined
        let workerExe = ""
        if(isExe && path.basename(process.execPath) == "app.exe") { // Node build
            workerExe = path.join(process.execPath, "..", "worker.exe")
        }
        else if(isExe && path.basename(process.execPath) != "app.exe") { // Electron package
            workerExe = "worker.exe"
        }
        else if (process.env.NODE_ENV === 'development'){
            workerExe = "worker.exe"
        }
        else{ // Node un-build
            workerExe = path.join(__dirname, "worker.exe")
        }
        console.log("worker path: " + workerExe)
        return workerExe
    }
}
