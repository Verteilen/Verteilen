import { BusAnalysis, DataType, ExecuteState, FeedBack, Header, NodeLoad, Setter, Single, SystemLoad, WebsocketPack } from "../../interface"
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
        const typeMap:{ [key:string]:Function } = {
            'feedback_message': this.feedback_message,
            'feedback_job': this.feedback_job,
            'feedback_string': this.feedback_string,
            'feedback_boolean': this.feedback_boolean,
            'feedback_number': this.feedback_number,
            'shell_reply': this.shell_reply,
            'system_info': this.system_info,
            'node_info': this.node_info,
            'pong': this.pong,
        }
        if(typeMap.hasOwnProperty(d.name)){
            const castingFunc = typeMap[d.h.name]
            castingFunc(d.h.data, d.c)
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
    private feedback_message = (data:Single, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        this.messager_log(`[Execute] Single Received data: ${data.data}`)
        const d:Setter = { key: source.uuid, value: data.data}
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
        this.messager_log(`[Execute] Job Feedback: ${data.job_uuid} ${data.message} ${data.meta}`)
        // If it's a single type work
        
        if(this.current_job.length > 0){
            const work = this.current_job.find(x => x.uuid == source.uuid && x.state == ExecuteState.RUNNING)
            if(work == undefined) {
                console.error("Cannot find the feedback container, work")
                return
            }

            this.proxy?.executeJobFinish([work.job, 0, source.uuid, data.meta])
            work.state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            console.log(this.current_job)
            if(this.check_single_end()){
                this.proxy?.executeSubtaskFinish([this.current_t!, 0, source.uuid])
                this.messager_log(`[Execute] Subtask finish: ${this.current_t!.uuid}`)
            }
        }
        // If it's a cronjob type work
        else if(this.current_cron.length > 0){
            const cron = this.current_cron.find(x => x.uuid == source.uuid)
            const work = cron?.work.find(x => x.uuid == data.job_uuid)
            if(cron == undefined || work == undefined) {
                console.error("Cannot find the feedback container, cron or work")
                return
            }

            this.proxy?.executeJobFinish([work.job, cron.id - 1, source.uuid, data.meta])
            work.state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            console.log(this.current_job)
            if(this.check_cron_end(cron)){
                this.proxy?.executeSubtaskFinish([this.current_t, cron.id - 1, cron.uuid ])
                this.messager_log(`[Execute] Subtask finish: ${this.current_t!.uuid}`)
                cron.uuid = ''
            }
        }
        // Reset the state of the node
        source.state = ExecuteState.NONE
        source.current_job = undefined
        const d:Setter = { key: data.job_uuid, value: data.message}
        this.proxy?.feedbackMessage(d)
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
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }
    /**
     * Recevied the shell text from client node
     */
    private shell_reply = (data:Single) => {
        this.proxy?.shellReply(data)
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
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
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
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
        this.proxy?.updateParameter(this.localPara!)
    }

    /**
     * Get the system information and assign to the node object
     * @param info Data
     * @param source The node target
     */
    private system_info = (info:SystemLoad, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        source.information = info
    }

    /**
     * Get the node information and assign to the node object
     * @param info Data
     * @param source The node target
     */
    private node_info = (info:NodeLoad, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        source.load = info
    }

    /**
     * Get the bouncing back function call\
     * THis method will calculate the time different and assign the node object
     * @param info Dummy number, nothing important, can be ignore
     * @param source The node target
     */
    private pong = (info:number, source:WebsocketPack | undefined) => {
        if(source == undefined || source.last == undefined) return
        source.ms = Date.now() - source.last
    }
    //#endregion
}