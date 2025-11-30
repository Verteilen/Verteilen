import { Ref } from "vue"
import { 
    Database, 
    WebhookManager, 
    ExecutePair, 
    Library, 
    NodeTable, 
    Project, 
    Record
} from "verteilen-core/dist/interface"

export interface DATA {
    leftSize: number
    rightSize: number
    tag: number
    skipModal: boolean
    createModal: boolean
    updateWait: boolean
    queryWait: boolean
}
export interface PROPS {
    socket: WebhookManager | undefined
    execute: Array<ExecutePair>
    libs: Array<Library>
    projects: Array<Project>
    nodes: Array<NodeTable>
    databases: Array<Database>
}
export type EmitType = {
    (e: 'added', name:string, record:Record):void,
    (e: 'select', index:number):void
    (e: 'stop'):void
}

export class Util_COnsole {
    data: Ref<DATA>
    emits: EmitType

    constructor(
        data: Ref<DATA>,
        emits: EmitType
    ){
        this.data = data
        this.emits = emits
    }

    consoleAdded = (name:string, data:Record) => {
        this.emits('added', name, data)
    }

    createConsole = () => {
        this.data.value.createModal = true
    }
}