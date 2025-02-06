import { messager_log } from "../debugger";
import { FeedBack, Header } from "../interface";

export const job_feedback = (data:FeedBack) => {

}

const typeMap = {
    'job_feedback': job_feedback
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