import { spawn } from 'child_process';
import fs from "fs";
import { parentPort } from 'worker_threads';
import { OnePath, OSAction, Setter, TwoPath, WorkerOS } from "../../interface";

class ClientOS {
    private messager:Function
    private messager_log:Function
    private tag:string = ""
    stopState = false

    constructor(_messager:Function, _messager_log:Function){
        this.messager = _messager
        this.messager_log = _messager_log
    }

    RUN = async (data:WorkerOS):Promise<any> => {
        this.tag = data.tag
        switch(data.type){
            case OSAction.COPY_FILE: { return this.file_copy(data.data) }
            case OSAction.COPY_DIR:
                {
                    this.dir_copy(data.data)
                    break
                }
            case OSAction.DELETE_FILE:
                {
                    this.file_delete(data.data)
                    break
                }
            case OSAction.DELETE_DIR:
                {
                    this.dir_delete(data.data)
                    break
                }
            case OSAction.RENAME:
                {
                    this.rename(data.data)
                    break
                }
            case OSAction.Exist:
                {
                    this.fs_exist(data.data)
                    break
                }
            case OSAction.LIST_FILE:
                {
                    this.dir_files(data.data)
                    break
                }
            case OSAction.LIST_DIR:
                {
                    this.dir_dirs(data.data)
                    break
                }
            case OSAction.CREATE_DIR:
                {
                    this.dir_create(data.data)
                    break
                }
            case OSAction.CREATE_FILE:
                {
                    this.file_write(data.data)
                    break
                }
            case OSAction.READ_FILE:
                {
                    this.file_read(data.data)
                    break
                }
            case OSAction.COMMAND:
                {
                    this.command(data.data[0], data.data[1], data.data[2])
                    break
                }
        }
    }

    private file_copy = async (data:TwoPath):Promise<any> => {
        return new Promise<any>(() => {
            if(!fs.existsSync(data.from)) {
                throw `[OS Action] File does not exist: ${data.from}`
            }
            fs.copyFileSync(data.from, data.to)
            this.messager_log(`[OS Action] File copy successfully, ${data.from} => ${data.to}`, this.tag)
            return true
        })
    }
    
    private dir_copy = (data:TwoPath) => {
        this.messager(`[OS Action] 資料夾複製, ${data.from} => ${data.to}`, this.tag)
        fs.cpSync(data.from, data.to, { recursive: true, force: true })
    }
    
    private file_delete = (data:OnePath) => {
        this.messager(`[OS Action] 檔案刪除, ${data.path}`, this.tag)
        fs.rmSync(data.path);
    }
    
    private dir_delete = (data:OnePath) => {
        this.messager(`[OS Action] 資料夾刪除, ${data.path}`, this.tag)
        fs.rmSync(data.path, { recursive: true, force: true })
    }
    
    private rename = (data:TwoPath) => {
        this.messager(`[OS Action] 檔案或資料夾改名, ${data.from} => ${data.to}`, this.tag)
        fs.renameSync(data.from, data.to)
    }
    
    private fs_exist = (data:OnePath):boolean => {
        const v = fs.existsSync(data.path)
        this.messager(`[OS Action] 查看路徑存在, ${data.path}`, this.tag)
        return v
    }
    
    private dir_files = (data:OnePath):Array<string> => {
        const r = fs.readdirSync(data.path, { withFileTypes: true })
        return r.map(x => x.name)
    }
    
    private dir_dirs = (data:OnePath):Array<string> => {
        const r = fs.readdirSync(data.path, { withFileTypes: false })
        return r as string[]
    }
    
    private dir_create = (data:OnePath) => {
        this.messager(`[OS Action] 建立資料夾, ${data.path}`, this.tag)
        fs.mkdirSync(data.path, {recursive: true})
    }
    
    private file_write = (data:TwoPath) => {
        this.messager(`[OS Action] 建立檔案, ${data.from}`, this.tag)
        fs.writeFileSync(data.from, data.to)
    }
    
    private file_read = (data:OnePath) => {
        return fs.readFileSync(data.path).toString()
    }
    
    stopall = () => {
        this.stopState = true
        setTimeout(() => {
            this.stopState = false
        }, 1000);
    }
    
    private command = async (cwd:string, command:string, args:string):Promise<string> => {
        this.messager(`[OS Action] 指令呼叫 cwd: ${cwd}`, this.tag)
        this.messager(`[OS Action] 指令呼叫 command: ${command}`, this.tag)
        this.messager(`[OS Action] 指令呼叫 args: ${args}`, this.tag)
        return new Promise<string>((resolve, reject) => {
            const child = spawn(command,  args.split(' '), { cwd: cwd, shell: true, stdio: ['inherit', 'pipe', 'pipe'] })
            const timer = setInterval(() => {
                if(this.stopState){
                    child.kill()
                    clearInterval(timer)
                }
            }, 100);
            child.on('spawn', () => {
                this.messager(`[指令執行] 生成執行序`, this.tag)
            })
            child.on('error', (err) => {
                this.messager(`[指令執行] 出現錯誤: ${err}`, this.tag)
                clearInterval(timer)
                reject(`執行錯誤 ${err}`)
            })
            child.on('exit', (code, signal) => {
                this.messager(`[指令執行] 執行序強關閉(exit): ${code}`, this.tag)
            })
            child.on('message', (message, sendHandle) => {
                this.messager(`[指令訊息] : ${message.toString()}`, this.tag)
            })
            child.on('close', (code, signal) => {
                this.messager(`[指令執行] 執行序弱關閉(close): ${code}`, this.tag)
                clearInterval(timer)
                resolve(`執行成功 ${code}`)
            })
            child.stdout.setEncoding('utf8');
            child.stdout.on('data', (chunk) => {
                this.messager_log(`[指令一般訊息] : ${chunk.toString()}`, this.tag)
            })
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (chunk) => {
                this.messager_log(`[指令錯誤訊息] : ${chunk.toString()}`, this.tag)
            })
            
        })
    }
}

class ClassOSWorker {
    private buffer:ClientOS

    constructor(){
        this.buffer = new ClientOS(this.messager, this.messager_log)
    }

    RUN = (data:WorkerOS) => {
        this.buffer.RUN(data).then(x => {
            const d:Setter = {
                key: 'result',
                value: x
            }
            parentPort?.postMessage(d)
        }).catch(err => {
            const d:Setter = {
                key: 'err',
                value: err.toString()
            }
            parentPort?.postMessage(d)
        })
    }

    private messager = (message:string, tag?:string) => {
        const d:Setter = {
            key: 'messager',
            value: `${ tag == undefined ? '[Backend]' : '[' + tag + ']' } ${message}`
        }
        parentPort?.postMessage(d)
    }

    private messager_log = (message:string, tag?:string) => {
        const d:Setter = {
            key: 'messager_log',
            value: `${ tag == undefined ? '[Backend]' : '[' + tag + ']' } ${message}`
        }
        parentPort?.postMessage(d)
    }
}


/**
 * Multi-thread: OS action
 */
parentPort?.on('message', (msg:WorkerOS) => {
    const l = new ClassOSWorker()
    l.RUN(msg)
})

/**
 * Single-thread: OS action
 */
export const RUN = async (msg:WorkerOS, _messager:Function, _messager_log:Function):Promise<any> => {
    const l = new ClientOS(_messager, _messager_log)
    return l.RUN(msg)
}