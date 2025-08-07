// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ChildProcess, spawn } from "child_process";
import WebSocket from 'ws';
import { Header, Messager, ShellFolder, Single } from "../interface";
import { Client } from "./client";
import { ClientOS } from "./os";


export class ClientShell {
    private messager:Messager
    private messager_log:Messager
    private os:ClientOS
    private shell_workers:Array<[WebSocket, ChildProcess]> = []

    constructor(_messager:Messager, _messager_log:Messager, _client:Client){
        this.os = new ClientOS(() => "SHELL", () => "", _messager, _messager_log)
        this.messager = _messager
        this.messager_log = _messager_log
    }

    /**
     * Open shell console
     * @param input 
     */
    open_shell = (data:number, source:WebSocket) => {
        if(this.shell_workers.find(x => x[0] == source)){
            this.messager_log(`[Shell] Error the source already open the shell`)
            return
        }
        const program = process.platform === "win32" ? 'cmd' : 'bash'
        const child = spawn(program, [], 
            { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                windowsHide: true,
                env: {
                    ...process.env,
                }
        })
        this.shell_workers.push([source, child])
        let t = ""
        const workerFeedback = (str:string) => {
            for(let i = 0; i < str.length; i++){
                if(str[i] == '\n'){
                    const data:Single = {
                        data: t
                    }
                    const d:Header = {
                        name: "shell_reply",
                        data: data
                    }
                    source.send(JSON.stringify(d))
                    t = ""
                }else{
                    t += str[i]
                }
            }
        }
        child.on('exit', (code, signal) => {
            const index = this.shell_workers.findIndex(x => x[0] == source)
            if(index != -1) this.shell_workers.splice(index, 1)
        })
        child.on('message', (message, sendHandle) => {
            workerFeedback(message.toString())
        })
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
    }

    /**
     * Open shell console
     * @param input 
     */
    enter_shell = (input:string, source:WebSocket) => {
        const p = this.shell_workers.find(x => x[0] == source)
        if(p == undefined){
            this.messager_log(`[Shell] Cannot find shell instance`)
            return
        }
        p[1].stdin?.write(input + '\n')
        if(process.platform == 'win32') p[1].stdin?.write("echo %cd%" + '\n')
        else p[1].stdin?.write("pwd" + '\n')
    }

    /**
     * Open shell console
     * @param input 
     */
    close_shell = (data:number, source:WebSocket) => {
        const p = this.shell_workers.find(x => x[0] == source)
        if(p == undefined){
            this.messager_log(`[Shell] Cannot find shell instance`)
            return
        }
        p[1].kill()
    }

    /**
     * Open shell console
     * @param input 
     */
    close_shell_all = (data:number) => {
        this.shell_workers.forEach(p => {
            if(p == undefined){
                this.messager_log(`[Shell] Cannot find shell instance`)
                return
            }
            p[1].kill()
        })
    }

    shell_folder = (data:string, source:WebSocket) => {
        if(data.length == 0){
            data = process.cwd()
        }
        if(!this.os.fs_dir_exist({path: data})){
            data = process.cwd()
        }
        const d:ShellFolder = {
            path: data,
            cwd: process.cwd(),
            folders: this.os.dir_dirs({path: data}),
            files: this.os.dir_files({path: data})
        }
        const h:Header = {
            name: "shell_folder_reply",
            data: d
        }
        source.send(JSON.stringify(h))
    }

    disconnect = (source:WebSocket) => {
        const p = this.shell_workers.find(x => x[0] == source)
        if(p == undefined) return
        p[1].kill()
    }
}