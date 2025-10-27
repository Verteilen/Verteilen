import { Ref } from "vue"

export interface DATA {
    deleteModal: boolean
    deleteData: Array<string>
    pluginModal: boolean
    pluginUUID: string
    infoModal: boolean
    infoUUID: string
    consoleModal: boolean
    consoleUUID: string
    connectionModal: boolean
    connectionData: { url: string }
    search: string
    isquery: boolean
    selection: Array<string>
}

export class Util_Node {
    data:Ref<DATA>

    constructor(data:Ref<DATA>){
        this.data = data
    }
}