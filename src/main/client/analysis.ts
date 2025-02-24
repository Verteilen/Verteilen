import { messager_log } from "../debugger";
import { Header } from "../interface";
import { execute_job, set_boolean, set_libs, set_number, set_parameter, set_string, stop_job } from "./execute";

const typeMap = {
    'execute_job': execute_job,
    'stop_job': stop_job,
    'set_parameter': set_parameter,
    'set_libs': set_libs,
    'set_string': set_string,
    'set_number': set_number,
    'set_boolean': set_boolean
}

export const analysis = (h:Header | undefined) => {
    if (h == undefined){
        messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
        return;
    }
    if (h.message != undefined && h.message.length > 0){
        messager_log(`[來源資料解析] ${h.message}`)
    }
    if (h.data == undefined) return
    if(typeMap.hasOwnProperty(h.name)){
        const castingFunc = typeMap[h.name]
        castingFunc(h.data)
    }else{
        messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${h.name}, meta: ${h.meta}`)
    }
}