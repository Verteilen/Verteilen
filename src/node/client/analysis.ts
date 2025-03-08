import * as share from '../interface';
import { ClientExecute } from "./execute";

export class ClientAnalysis {
    messager_log: Function
    exec:ClientExecute

    constructor(_messager_log:Function, _exec:ClientExecute){
        this.exec = _exec
        this.messager_log = _messager_log
    }

    analysis = (h:share.Header | undefined) => {
        const typeMap = {
            'execute_job': this.exec.execute_job,
            'stop_job': this.exec.stop_job,
            'set_parameter': this.exec.set_parameter,
            'set_libs': this.exec.set_libs,
            'set_string': this.exec.set_string,
            'set_number': this.exec.set_number,
            'set_boolean': this.exec.set_boolean,
            'console': this.exec.console
        }

        if (h == undefined){
            this.messager_log('[Source Analysis] Analysis Failed, Value is undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return
        if(typeMap.hasOwnProperty(h.name)){
            const castingFunc = typeMap[h.name]
            castingFunc(h.data)
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }
}