// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { BusAnalysis, CronJobState, DataType, ExecuteState, FeedBack, Header, Setter, Single, WebsocketPack, WorkState } from "../../interface"
import { ExecuteManager_Base } from "./base"

/**
 * Recevied the information from the nodes\
 * This include job feedback and error feedback and pong and other stuff
 */
export class ExecuteManager_Feedback extends ExecuteManager_Base{
    /**
     * The analysis method for decoding the information where the nodes is sending
     * @param d Package info
     */
    Analysis = (d:BusAnalysis) => {
        const targetn = this.current_nodes.find(x => x.uuid == d.c?.uuid)
        if(targetn == undefined) {
            this.messager_log("Not inside")
            return
        }
        const typeMap:{ [key:string]:Function } = {
            'feedback_message': this.feedback_message,
            'feedback_job': this.feedback_job,
            'feedback_string': this.feedback_string,
            'feedback_boolean': this.feedback_boolean,
            'feedback_number': this.feedback_number,
            'feedback_object': this.feedback_object,
        }
        if(typeMap.hasOwnProperty(d.name)){
            const castingFunc = typeMap[d.h.name]
            castingFunc(d.h.data, targetn, d.h.meta)
        }else{
            this.messager_log(`[Source Data Analysis] Decode failed, Unknowed header, name: ${d.name}, meta: ${d.h.meta}`)
        }
    }

    //#region Feedback
    /**
     * Print information, sended by the node worker
     * @param data feedback data, any type
     * @param source The node target
     */
    private feedback_message = (data:Single, source:WebsocketPack | undefined, meta:string | undefined) => {
        if(source == undefined) {
            this.messager_log("[Server Feedback Warn] source is none")
            return
        }
        if(this.state == ExecuteState.NONE) {
            this.messager_log("[Server Feedback Warn] state is none, should not received feedback")
            return
        }
        this.messager_log(`[Execute] Single Received data: ${data.data}, cron length: ${this.current_cron.length}`)
        let index = 0
        if(this.current_cron.length > 0 && meta != undefined){
            const r = this.GetCronAndWork(meta, source)
            const cron:CronJobState | undefined = r[0]
            const work:WorkState | undefined = r[1]
            if(cron != undefined && work != undefined){
                index = cron.id
            }
        }
        const d:FeedBack = { 
            node_uuid: source.uuid,
            index: index,
            job_uuid: '',
            runtime_uuid: '',
            meta: 0,
            message: data.data
        }
        this.proxy?.feedbackMessage(d)
    }
    /**
     * The job has been finish executing, sended by the node worker
     * @param data feedback data
     * @param source The node target
     */
    private feedback_job = (data:FeedBack, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        this.jobstack = Math.max(this.jobstack - 1, 0)
        if(this.current_t == undefined) {
            console.error("Cannot feedback when task is null")
            return
        }
        this.messager_log(`[Execute] Job Feedback: ${data.job_uuid} ${data.runtime_uuid} ${data.message} ${data.meta}`)
        // If it's a single type work
        
        if(this.current_job.length > 0){
            const work = this.current_job.find(x => x.uuid == source.uuid && x.state == ExecuteState.RUNNING)
            if(work == undefined) {
                console.error("Cannot find the feedback container, work", work)
                return
            }
            data.index = 0
            this.proxy?.executeJobFinish([work.job, 0, source.uuid, data.meta])
            work.state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            if(this.check_single_end()){
                this.proxy?.executeSubtaskFinish([this.current_t!, 0, source.uuid])
                this.messager_log(`[Execute] Subtask finish: ${this.current_t!.uuid}`)
            }
        }
        // If it's a cronjob type work
        else if(this.current_cron.length > 0){
            const r = this.GetCronAndWork(data.runtime_uuid, source)
            const cron:CronJobState | undefined = r[0]
            const work:WorkState | undefined = r[1]
            if(cron == undefined || work == undefined) {
                console.error("Cannot find the feedback container, cron or work", data.runtime_uuid, cron, work)
                console.error("Full current cron instance", this.current_cron)
                return
            }

            this.proxy?.executeJobFinish([work.job, cron.id, source.uuid, data.meta])
            data.index = cron.id
            work.state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            if(this.check_cron_end(cron)){
                this.proxy?.executeSubtaskFinish([this.current_t, cron.id, cron.uuid ])
                this.messager_log(`[Execute] Subtask finish: ${this.current_t!.uuid}`)
                cron.uuid = ''
            }
        }
        // Reset the state of the node
        const index = source.current_job.findIndex(x => x == data.runtime_uuid)
        if(index == -1){
            this.messager_log(`[Execute] Cannot find runtime uuid: ${data.runtime_uuid} in websocket pack source: ${source.uuid}`)
        }else{
            source.current_job.splice(index, 1)
        }
        data.node_uuid = source.uuid
        this.proxy?.feedbackMessage(data)
    }
    /**
     * When one of the node decide to change the parameter of string value
     * @param data The assigner
     */
    private feedback_string = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.localPara!.containers.findIndex(x => x.name == data.key && x.type == DataType.String)
        if(index != -1) this.localPara!.containers[index].value = data.value
        else this.localPara!.containers.push({ name: data.key, value: data.value, type: DataType.String, hidden: true, runtimeOnly: true })
        this.messager_log(`[String Feedback] ${data.key} = ${data.value}`)
        // Sync to other
        const d:Header = { name: 'set_parameter', data: this.localPara!}
        this.current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }
    /**
     * When one of the node decide to change the parameter of number value
     * @param data The assigner
     */
    private feedback_number = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.localPara!.containers.findIndex(x => x.name == data.key && x.type == DataType.Number)
        if(index != -1) this.localPara!.containers[index].value = data.value
        else this.localPara!.containers.push({ name: data.key, value: data.value, type: DataType.Number, hidden: true, runtimeOnly: true })
        this.messager_log(`[Number Feedback] ${data.key} = ${data.value}`)
        // Sync to other
        const d:Header = { name: 'set_parameter', data: this.localPara!}
        this.current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }
    /**
     * When one of the node decide to change the parameter of object value
     * @param data The assigner
     */
    private feedback_object = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.localPara!.containers.findIndex(x => x.name == data.key && x.type == DataType.Object)
        if(index != -1) this.localPara!.containers[index].value = data.value
        else this.localPara!.containers.push({ name: data.key, value: data.value, type: DataType.Object, hidden: true, runtimeOnly: true })
        this.messager_log(`[Object Feedback] ${data.key}`)
        // Sync to other
        const d:Header = { name: 'set_parameter', data: this.localPara!}
        this.current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }
    /**
     * When one of the node decide to change the parameter of boolean value
     * @param data The assigner
     */
    private feedback_boolean = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.localPara!.containers.findIndex(x => x.name == data.key && x.type == DataType.Boolean)
        if(index != -1) this.localPara!.containers[index].value = data.value
        else this.localPara!.containers.push({ name: data.key, value: data.value, type: DataType.Boolean, hidden: true, runtimeOnly: true })
        this.messager_log(`[Boolean Feedback] ${data.key} = ${data.value}`)
        // Sync to other
        const d:Header = { name: 'set_parameter', data: this.localPara!}
        this.current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }

    private GetCronAndWork = (runtime:string, source:WebsocketPack):[CronJobState | undefined, WorkState | undefined] => {
        let cron:CronJobState | undefined = undefined
        let work:WorkState | undefined = undefined
        const crons = this.current_cron.filter(x => x.uuid == source.uuid)
        for(let i = 0; i < crons.length; i++){
            const c = crons[i]
            const a = c.work.find(x => x.runtime == runtime)
            if(a != undefined) {
                cron = c
                work = a
                break
            }
        }
        return [cron, work]
    }
    //#endregion
}