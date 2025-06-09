import { ChildProcess, spawn } from 'child_process';
import { WebSocket } from 'ws';
import { Header, Job, Libraries, Messager, Messager_log, Parameter } from "../interface";
import { Client } from './client';
import { ClientExecute } from "./execute";
import { ClientShell } from './shell';

/**
 * The analysis worker. decode the message received from cluster server
 */
export class ClientAnalysis {
    private messager: Messager
    private messager_log: Messager_log
    private client:Client
    private exec:Array<ClientExecute>
    private shell:ClientShell
    private resource_wanter:Array<WebSocket> = []
    private resource_thread:ChildProcess | undefined = undefined

    private resource_cache:Header | undefined = undefined

    constructor(_messager:Messager, _messager_log:Messager_log, _client:Client){
        this.client = _client
        this.messager = _messager
        this.messager_log = _messager_log
        this.shell = new ClientShell(_messager, _messager_log, this.client)
        this.exec = []
    }

    /**
     * Analysis the package
     * @param h Package
     * @param source Websocket instance
     */
    analysis = (h:Header | undefined, source:WebSocket) => {
        const typeMap = {
            'execute_job': this.execute_job,
            'release': this.release,
            'stop_job': this.stop_all,
            'set_parameter': this.set_parameter,
            'set_libs': this.set_libs,
            'shell_folder': this.shell.shell_folder,
            'open_shell': this.shell.open_shell,
            'close_shell': this.shell.close_shell,
            'enter_shell': this.shell.enter_shell,
            'resource_start': this.resource_start,
            'resource_end': this.resource_end,
            'ping': this.pong,
        }

        if (h == undefined){
            this.messager_log('[Source Analysis] Analysis Failed, Value is undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) {
            this.messager_log('[Source Analysis] Analysis Failed, Data is undefined')
            return
        }
        if(typeMap.hasOwnProperty(h.name)){
            const castingFunc = typeMap[h.name]
            castingFunc(h.data, source, h.channel)
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }

    private execute_job = (job: Job, source: WebSocket, channel:string | undefined) => {
        if(channel == undefined) return
        const target = this.exec_checker(channel)
        target.execute_job(job, source)
    }

    private release = (dummy:number, source: WebSocket, channel:string | undefined) => {
        if(channel == undefined) return
        const index = this.exec.findIndex(x => x.uuid == channel)
        if(index == -1) return
        this.exec.splice(index, 1)
    }

    private set_parameter = (data:Parameter, source: WebSocket, channel:string | undefined) => {
        if(channel == undefined) return
        const target = this.exec_checker(channel)
        target.set_parameter(data)
    }

    private set_libs = (data:Libraries, source: WebSocket, channel:string | undefined) => {
        if(channel == undefined) return
        const target = this.exec_checker(channel)
        target.set_libs(data)
    }

    private exec_checker = (uuid:string): ClientExecute => {
        let r:ClientExecute | undefined = undefined
        const index = this.exec.findIndex(x => x.uuid == uuid)
        if(index == -1) {
            r = new ClientExecute(uuid, this.messager, this.messager_log, this.client)
            this.exec.push(r)
        }else{
            r = this.exec[index]
        }
        return r
    }

    /**
     * Network delay request
     * @param data Dummy value, should always be 0
     * @param source The cluster server websocket instance
     */
    private pong = (data:number, source: WebSocket) => {
        const h:Header = { name: 'pong', data: data }
        source.send(JSON.stringify(h))
    }

    private resource_start = (data:number, source: WebSocket) => {
        this.resource_wanter.push(source)
        this.messager_log(`Register resource_wanter!, count: ${this.resource_wanter.length}`)
        if(this.resource_cache != undefined) source.send(JSON.stringify(this.resource_cache))
    }

    private resource_end = (data:number, source: WebSocket) => {
        const index = this.resource_wanter.findIndex(x => x ==source)
        if(index != -1) {
            this.resource_wanter.splice(index, 1)
            this.messager_log(`UnRegister resource_wanter!, count: ${this.resource_wanter.length}`)
        }
    }

    update = (client:Client) => {
        this.resource_require()
        if(this.resource_cache != undefined){
            this.resource_wanter.forEach(x => x.send(JSON.stringify(this.resource_cache)))
        }
    }

    disconnect = (source: WebSocket) => {
        this.shell.disconnect(source)
        this.exec.forEach(x => x.stop_job())
    }

    stop_all = () => {
        this.exec.forEach(x => x.stop_job())
    }

    private resource_require = () => {
        if(this.resource_thread != undefined) return
        const shouldRun = this.resource_thread == undefined && (this.resource_cache == undefined || this.resource_wanter.length > 0)
        if(!shouldRun) return
        this.resource_thread = spawn(Client.workerPath(), [],
            {
                stdio: ['inherit', 'pipe', 'pipe'],
                shell: true,
                windowsHide: true,
                env: {
                    ...process.env,
                    type: "RESOURCE",
                    cache: this.resource_cache == undefined ? undefined : JSON.stringify(this.resource_cache.data)
                }
            }
        )
        let k = "" 

        const workerFeedbackExec = (str:string) => {
            try{
                const msg:Header = JSON.parse(str)
                if(msg.name == 'messager'){
                    this.messager(msg.data, "RESOURCE")
                } 
                else if(msg.name == 'messager_log'){
                    this.messager_log(msg.data, "RESOURCE")
                }
                else if(msg.name == 'resource'){
                    const h:Header = {
                        name: 'system_info',
                        data: msg.data
                    }
                    this.resource_cache = h
                    this.resource_wanter.forEach(x => x.send(JSON.stringify(h)))
                } 
                else if(msg.name == 'error'){
                    if(msg.data instanceof String) this.messager_log(msg.data.toString(), "RESOURCE")
                    else this.messager_log(JSON.stringify(msg.data), "RESOURCE")
                }
            }catch(err:any){
                console.log("str: " + str)
                console.log(err.name + "\n" + err.message)
            }
        }
        const workerFeedback = (str:string) => {
            for(let i = 0; i < str.length; i++){
                if(str[i] != '\n') k += str[i]
                else {
                    workerFeedbackExec(k)
                    k = ''
                }
            }
        }

        this.resource_thread.on('error', (err) => {
            this.messager_log(`[Worker Error] ${err}`)
        })

        this.resource_thread.on('exit', (code, signal) => {
            this.resource_thread = undefined
        })
        this.resource_thread.on('message', (message, sendHandle) => {
            workerFeedback(message.toString())
        })
        this.resource_thread.stdout?.setEncoding('utf8');
        this.resource_thread.stdout?.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
        this.resource_thread.stderr?.setEncoding('utf8');
        this.resource_thread.stderr?.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
    }

    
}
