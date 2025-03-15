import { spawn } from 'child_process';
import fs from "fs";
import { OnePath, TwoPath } from "../interface";

type gettag = ()=>string

/**
 * The operation system related actions utility
 */
export class ClientOS {
    private messager:Function
    private messager_log:Function
    private tag:gettag
    stopState = false

    constructor(_tag:gettag, _messager:Function, _messager_log:Function){
        this.tag = _tag
        this.messager = _messager
        this.messager_log = _messager_log
    }

    file_copy = (data:TwoPath) => {
        this.messager(`[OS Action] File copy, ${data.from} => ${data.to}`, this.tag())
        fs.copyFileSync(data.from, data.to)
    }
    
    dir_copy = (data:TwoPath) => {
        this.messager(`[OS Action] Folder copy, ${data.from} => ${data.to}`, this.tag())
        fs.cpSync(data.from, data.to, { recursive: true, force: true })
    }
    
    file_delete = (data:OnePath) => {
        this.messager(`[OS Action] File delete, ${data.path}`, this.tag())
        fs.rmSync(data.path);
    }
    
    dir_delete = (data:OnePath) => {
        this.messager(`[OS Action] Folder delete, ${data.path}`, this.tag())
        fs.rmSync(data.path, { recursive: true, force: true })
    }
    
    rename = (data:TwoPath) => {
        this.messager(`[OS Action] File or dir rename, ${data.from} => ${data.to}`, this.tag())
        fs.renameSync(data.from, data.to)
    }
    
    fs_exist = (data:OnePath):boolean => {
        const v = fs.existsSync(data.path)
        this.messager(`[OS Action] Check path exists, ${data.path}`, this.tag())
        return v
    }

    fs_dir_exist = (data:OnePath):boolean => {
        const p = this.fs_exist(data)
        if(!p) return false
        const stat = fs.statSync(data.path)
        return stat.isDirectory()
    }

    fs_file_exist = (data:OnePath):boolean => {
        const p = this.fs_exist(data)
        if(!p) return false
        const stat = fs.statSync(data.path)
        return stat.isFile()
    }
    
    dir_files = (data:OnePath):Array<string> => {
        const r = fs.readdirSync(data.path, { withFileTypes: true })
        return r.map(x => x.name)
    }
    
    dir_dirs = (data:OnePath):Array<string> => {
        const r = fs.readdirSync(data.path, { withFileTypes: false })
        return r as string[]
    }
    
    dir_create = (data:OnePath) => {
        this.messager(`[OS Action] Create folder, ${data.path}`, this.tag())
        fs.mkdirSync(data.path, {recursive: true})
    }
    
    file_write = (data:TwoPath) => {
        this.messager(`[OS Action] Create file, ${data.from}`, this.tag())
        fs.writeFileSync(data.from, data.to)
    }
    
    file_read = (data:OnePath) => {
        return fs.readFileSync(data.path).toString()
    }
    
    stopall = () => {
        this.stopState = true
        setTimeout(() => {
            this.stopState = false
        }, 1000);
    }
    
    command = async (cwd:string, command:string, args:string):Promise<string> => {
        this.messager(`[OS Action] Command cwd: ${cwd}`, this.tag())
        this.messager(`[OS Action] Command command: ${command}`, this.tag())
        this.messager(`[OS Action] Command args: ${args}`, this.tag())
        return new Promise<string>((resolve, reject) => {
            const child = spawn(command,  args.split(' '), 
            { 
                cwd: cwd, 
                shell: true, 
                stdio: ['inherit', 'pipe', 'pipe'], 
                windowsHide: true
            })
            const timer = setInterval(() => {
                if(this.stopState){
                    child.kill()
                    clearInterval(timer)
                }
            }, 100);
            child.on('spawn', () => {
                this.messager_log(`[Command] Spawn process`, this.tag())
            })
            child.on('error', (err) => {
                this.messager_log(`[Command] Error: ${err}`, this.tag())
                clearInterval(timer)
                reject(`Error ${err}`)
            })
            child.on('exit', (code, signal) => {
                this.messager_log(`[Command] Process Exit: ${code}`, this.tag())
            })
            child.on('message', (message, sendHandle) => {
                this.messager_log(`[Command] : ${message.toString()}`, this.tag())
            })
            child.on('close', (code, signal) => {
                this.messager_log(`[Command] Process Close: ${code}`, this.tag())
                clearInterval(timer)
                resolve(`Successfully ${code}`)
            })
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', (chunk) => {
                this.messager_log(`[Command Info] : ${chunk.toString()}`, this.tag())
            })
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (chunk) => {
                this.messager_log(`[Command Error] : ${chunk.toString()}`, this.tag())
            })
            
        })
    }
}