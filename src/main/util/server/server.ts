import { Task, ExecuteProxy, Project, ExecuteState, Job, FeedBack, Parameter, ExecuteRecord, Log, Libraries, AppConfig, Preference } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"
import { WebsocketManager } from "../../script/socket_manager"
import { Util_Server_Console } from "./console_handle"
import { BackendEvent } from "../../event"

export type save_and_update = () => void

export class Util_Server {
    websocket_manager: WebsocketManager | undefined
    execute_manager: Array<[ExecuteManager, ExecuteRecord]> = []

    libs:Libraries = {libs: []}
    logs: Log = {logs: []}

    backend: BackendEvent
    console:Util_Server_Console
    preference:Preference | undefined
    config:AppConfig | undefined

    constructor(backend:BackendEvent){
        this.backend = backend
        this.console = new Util_Server_Console(this.update)
    }

    private update = () => {
        
    }

    CombineProxy = (eps:Array<ExecuteProxy>) => {
        const p:ExecuteProxy = {
            executeProjectStart: (data:Project):void => { eps.forEach(x => x.executeProjectStart(JSON.parse(JSON.stringify(data)))) },
            executeProjectFinish: (data:Project):void => { eps.forEach(x => x.executeProjectFinish(JSON.parse(JSON.stringify(data)))) },
            executeTaskStart: (data:[Task, number]):void => { eps.forEach(x => x.executeTaskStart(JSON.parse(JSON.stringify(data)))) },
            executeTaskFinish: (data:Task):void => { eps.forEach(x => x.executeTaskFinish(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskStart: (data:[Task, number, string]):void => { eps.forEach(x => x.executeSubtaskStart(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { eps.forEach(x => x.executeSubtaskUpdate(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskFinish: (data:[Task, number, string]):void => { eps.forEach(x => x.executeSubtaskFinish(JSON.parse(JSON.stringify(data)))) },
            executeJobStart: (data:[Job, number, string]):void => { eps.forEach(x => x.executeJobStart(JSON.parse(JSON.stringify(data)))) },
            executeJobFinish: (data:[Job, number, string, number]):void => { eps.forEach(x => x.executeJobFinish(JSON.parse(JSON.stringify(data)))) },
            feedbackMessage: (data:FeedBack):void => { eps.forEach(x => x.feedbackMessage(JSON.parse(JSON.stringify(data)))) },
            updateParameter: (data:Parameter):void => { eps.forEach(x => x.updateParameter(JSON.parse(JSON.stringify(data)))) },
        }
        return p
    }
}