import { messager_log } from "../debugger";
import { Header } from "../interface";
import { dir_copy, dir_delete, file_copy, file_delete, fs_exist } from "./os";

const typeMap = {
    'file_copy': file_copy,
    'dir_copy': dir_copy,
    'file_delete': file_delete,
    'dir_delete': dir_delete,
    'fs_exist': fs_exist
}

export const analysis = (h:Header | undefined) => {
    if (h == undefined){
        messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
        return;
    }
    if (h.message.length > 0){
        messager_log(`[來源資料解析] ${h.message}`)
    }
    if(typeMap.hasOwnProperty(h.name)){
        const castingFunc = typeMap[h.name]
        castingFunc(h.data)
    }else{
        messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${h.name}, meta: ${h.meta}`)
    }
}