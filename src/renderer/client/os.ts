import { spawn } from 'child_process';
import fs from "fs";
import { OnePath, TwoPath } from "../interface";

let stopState = false
type gettag = ()=>string

export class ClientOS {
    messager:Function
    messager_log:Function
    tag:gettag

    constructor(_tag:gettag, _messager:Function, _messager_log:Function){
        this.tag = _tag
        this.messager = _messager
        this.messager_log = _messager_log
    }

    file_copy = (data:TwoPath) => {
        this.messager(`[作業系統動作] 檔案複製, ${data.from} => ${data.to}`, this.tag())
        fs.copyFileSync(data.from, data.to)
    }
    
    dir_copy = (data:TwoPath) => {
        this.messager(`[作業系統動作] 資料夾複製, ${data.from} => ${data.to}`, this.tag())
        fs.cpSync(data.from, data.to, { recursive: true, force: true })
    }
    
    file_delete = (data:OnePath) => {
        this.messager(`[作業系統動作] 檔案刪除, ${data.path}`, this.tag())
        fs.rmSync(data.path);
    }
    
    dir_delete = (data:OnePath) => {
        this.messager(`[作業系統動作] 資料夾刪除, ${data.path}`, this.tag())
        fs.rmSync(data.path, { recursive: true, force: true })
    }
    
    rename = (data:TwoPath) => {
        this.messager(`[作業系統動作] 檔案或資料夾改名, ${data.from} => ${data.to}`, this.tag())
        fs.renameSync(data.from, data.to)
    }
    
    fs_exist = (data:OnePath):boolean => {
        const v = fs.existsSync(data.path)
        this.messager(`[作業系統動作] 查看路徑存在, ${data.path}`, this.tag())
        return v
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
        this.messager(`[作業系統動作] 建立資料夾, ${data.path}`, this.tag())
        fs.mkdirSync(data.path, {recursive: true})
    }
    
    file_write = (data:TwoPath) => {
        this.messager(`[作業系統動作] 建立檔案, ${data.from}`, this.tag())
        fs.writeFileSync(data.from, data.to)
    }
    
    file_read = (data:OnePath) => {
        return fs.readFileSync(data.path).toString()
    }
    
    stopall = () => {
        stopState = true
        setTimeout(() => {
            stopState = false
        }, 1000);
    }
    
    command = async (cwd:string, command:string, args:string):Promise<string> => {
        this.messager(`[作業系統動作] 指令呼叫 cwd: ${cwd}`, this.tag())
        this.messager(`[作業系統動作] 指令呼叫 command: ${command}`, this.tag())
        this.messager(`[作業系統動作] 指令呼叫 args: ${args}`, this.tag())
        return new Promise<string>((resolve, reject) => {
            const child = spawn(command,  args.split(' '), { cwd: cwd, shell: true, stdio: ['inherit', 'pipe', 'pipe'] })
            const timer = setInterval(() => {
                if(stopState){
                    child.kill()
                    clearInterval(timer)
                }
            }, 100);
            child.on('spawn', () => {
                this.messager(`[指令執行] 生成執行序`, this.tag())
            })
            child.on('error', (err) => {
                this.messager(`[指令執行] 出現錯誤: ${err}`, this.tag())
                clearInterval(timer)
                reject(`執行錯誤 ${err}`)
            })
            child.on('exit', (code, signal) => {
                this.messager(`[指令執行] 執行序強關閉(exit): ${code}`, this.tag())
            })
            child.on('message', (message, sendHandle) => {
                this.messager(`[指令訊息] : ${message.toString()}`, this.tag())
            })
            child.on('close', (code, signal) => {
                this.messager(`[指令執行] 執行序弱關閉(close): ${code}`, this.tag())
                clearInterval(timer)
                resolve(`執行成功 ${code}`)
            })
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', (chunk) => {
                this.messager_log(`[指令一般訊息] : ${chunk.toString()}`, this.tag())
            })
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (chunk) => {
                this.messager_log(`[指令錯誤訊息] : ${chunk.toString()}`, this.tag())
            })
            
        })
    }
}