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