import { spawn } from 'child_process';
import fs from "fs";
import { messager_log } from "../debugger";
import { OnePath, TwoPath } from "../interface";

export const file_copy = (data:TwoPath) => {
    messager_log(`[作業系統動作] 檔案複製, ${data.from} => ${data.to}`)
    fs.copyFileSync(data.from, data.to)
}

export const dir_copy = (data:TwoPath) => {
    messager_log(`[作業系統動作] 資料夾複製, ${data.from} => ${data.to}`)
    fs.cpSync(data.from, data.to, { recursive: true, force: true })
}

export const file_delete = (data:OnePath) => {
    messager_log(`[作業系統動作] 檔案刪除, ${data.path}`)
    fs.rmSync(data.path);
}

export const dir_delete = (data:OnePath) => {
    messager_log(`[作業系統動作] 資料夾刪除, ${data.path}`)
    fs.rmSync(data.path, { recursive: true, force: true })
}

export const fs_exist = (data:OnePath):boolean => {
    const v = fs.existsSync(data.path)
    messager_log(`[作業系統動作] 查看路徑存在, ${data.path}`)
    return v
}

export const dir_files = (data:OnePath):Array<string> => {
    const r = fs.readdirSync(data.path, { withFileTypes: true })
    return r.map(x => x.name)
}

export const dir_dirs = (data:OnePath):Array<string> => {
    const r = fs.readdirSync(data.path, { withFileTypes: false })
    return r.map(x => x.name)
}

export const dir_create = (data:OnePath) => {
    fs.mkdirSync(data.path, {recursive: true})
}

export const file_write = (data:TwoPath) => {
    fs.writeFileSync(data.from, data.to)
}

export const command = async (cwd:string, command:string, args:string):Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const child = spawn(command,  args.split(''), { cwd: cwd })
        child.on('spawn', () => {
            messager_log(`[指令執行] 生成執行序`)
        })
        child.on('error', (err) => {
            messager_log(`[指令執行] 出現錯誤: ${err}`)
        })
        child.on('exit', (code, signal) => {
            messager_log(`[指令執行] 執行序強關閉(exit): ${code}`)
        })
        child.on('message', (message, sendHandle) => {
            messager_log(`[指令訊息] : ${message.toString()}`)
        })
        child.on('close', (code, signal) => {
            messager_log(`[指令執行] 執行序弱關閉(close): ${code}`)
        })
        child.stdout.on('data', (chunk) => {
            messager_log(`[指令一般訊息] : ${chunk.toString()}`)
        })
        child.stderr.on('data', (chunk) => {
            messager_log(`[指令錯誤訊息] : ${chunk.toString()}`)
        })
    })
}