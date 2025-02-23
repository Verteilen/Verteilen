import { spawn } from 'child_process';
import fs from "fs";
import { tag } from './client';
import { messager, messager_log } from "./debugger";
import { OnePath, TwoPath } from "./interface";

let stopState = false

export const file_copy = (data:TwoPath) => {
    messager(`[作業系統動作] 檔案複製, ${data.from} => ${data.to}`, tag)
    fs.copyFileSync(data.from, data.to)
}

export const dir_copy = (data:TwoPath) => {
    messager(`[作業系統動作] 資料夾複製, ${data.from} => ${data.to}`, tag)
    fs.cpSync(data.from, data.to, { recursive: true, force: true })
}

export const file_delete = (data:OnePath) => {
    messager(`[作業系統動作] 檔案刪除, ${data.path}`, tag)
    fs.rmSync(data.path);
}

export const dir_delete = (data:OnePath) => {
    messager(`[作業系統動作] 資料夾刪除, ${data.path}`, tag)
    fs.rmSync(data.path, { recursive: true, force: true })
}

export const rename = (data:TwoPath) => {
    messager(`[作業系統動作] 檔案或資料夾改名, ${data.from} => ${data.to}`, tag)
    fs.renameSync(data.from, data.to)
}

export const fs_exist = (data:OnePath):boolean => {
    const v = fs.existsSync(data.path)
    messager(`[作業系統動作] 查看路徑存在, ${data.path}`, tag)
    return v
}

export const dir_files = (data:OnePath):Array<string> => {
    const r = fs.readdirSync(data.path, { withFileTypes: true })
    return r.map(x => x.name)
}

export const dir_dirs = (data:OnePath):Array<string> => {
    const r = fs.readdirSync(data.path, { withFileTypes: false })
    return r as string[]
}

export const dir_create = (data:OnePath) => {
    messager(`[作業系統動作] 建立資料夾, ${data.path}`, tag)
    fs.mkdirSync(data.path, {recursive: true})
}

export const file_write = (data:TwoPath) => {
    messager(`[作業系統動作] 建立檔案, ${data.from}`, tag)
    fs.writeFileSync(data.from, data.to)
}

export const file_read = (data:OnePath) => {
    return fs.readFileSync(data.path).toString()
}

export const stopall = () => {
    stopState = true
    setTimeout(() => {
        stopState = false
    }, 1000);
}

export const command = async (cwd:string, command:string, args:string):Promise<string> => {
    messager(`[作業系統動作] 指令呼叫 cwd: ${cwd}`, tag)
    messager(`[作業系統動作] 指令呼叫 command: ${command}`, tag)
    messager(`[作業系統動作] 指令呼叫 args: ${args}`, tag)
    return new Promise<string>((resolve, reject) => {
        const child = spawn(command,  args.split(' '), { cwd: cwd, shell: true, stdio: ['inherit', 'pipe', 'pipe'] })
        const timer = setInterval(() => {
            if(stopState){
                child.kill()
                clearInterval(timer)
            }
        }, 100);
        child.on('spawn', () => {
            messager(`[指令執行] 生成執行序`, tag)
        })
        child.on('error', (err) => {
            messager(`[指令執行] 出現錯誤: ${err}`, tag)
            clearInterval(timer)
            reject(`執行錯誤 ${err}`)
        })
        child.on('exit', (code, signal) => {
            messager(`[指令執行] 執行序強關閉(exit): ${code}`, tag)
        })
        child.on('message', (message, sendHandle) => {
            messager(`[指令訊息] : ${message.toString()}`, tag)
        })
        child.on('close', (code, signal) => {
            messager(`[指令執行] 執行序弱關閉(close): ${code}`, tag)
            clearInterval(timer)
            resolve(`執行成功 ${code}`)
        })
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            messager_log(`[指令一般訊息] : ${chunk.toString()}`, tag)
        })
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk) => {
            messager_log(`[指令錯誤訊息] : ${chunk.toString()}`, tag)
        })
    })
}