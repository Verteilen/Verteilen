import { ComputedRef, DefineProps, Ref } from "vue"
import { BackendProxy } from "../../proxy"
import { WebsocketManager, Header, NodeTable, Plugin, PluginPageData, PluginWithToken, Preference } from "verteilen-core/dist/interface"
import { v6 as uuid6 } from 'uuid';

export type LooseRequired<T> = {
    [P in keyof (T & Required<T>)]: T[P];
}

/**
 * **Node Page Data**
 */
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
    fields: Array<any>
}
/**
 * **Node Page Property**
 */
export interface PROPS {
    nodes: Array<NodeTable>
    manager: WebsocketManager | undefined
    plugin: PluginPageData
}

/**
 * **Node Page Local Logic Handler**
 */
export class Util_Node {
    props: DefineProps<LooseRequired<PROPS>, never>
    data:Ref<DATA>
    preference:Ref<Preference>
    backend:Ref<BackendProxy>

    pluginTarget: ComputedRef<NodeTable | undefined>
    selected_node_ids: ComputedRef<string[]>

    constructor(
        props: DefineProps<LooseRequired<PROPS>, never>, 
        data:Ref<DATA>, 
        preference:Ref<Preference>,
        backend:Ref<BackendProxy>, 
        pluginTarget: ComputedRef<NodeTable | undefined>,
        selected_node_ids: ComputedRef<string[]>)
    {
        this.props = props
        this.data = data
        this.preference = preference
        this.backend = backend
        this.pluginTarget = pluginTarget
        this.selected_node_ids = selected_node_ids
    }

    //#region Node Crud
    createNode = () => {
        this.data.value.connectionData = {url: '127.0.0.1:12080'}
        this.data.value.connectionModal = true
    }
    confirmConnection = () => {
        this.data.value.connectionModal = false
        if(this.backend.value.config.haveBackend){
            this.backend.value.send("node_add", `wss://${this.data.value.connectionData.url}`, uuid6())
        }else{
            this.props.manager?.server_start(`wss://${this.data.value.connectionData.url}`, uuid6())
        }
        this.data.value.connectionData = { url: '' }
    }
    deleteNode = () => {
        this.data.value.deleteModal = true
        this.data.value.deleteData = this.selected_node_ids.value
    }
    deleteConfirm = () => {
        this.data.value.deleteModal = false
        this.data.value.deleteData.forEach(x => {
            if(this.backend.value.config.haveBackend){
                this.backend.value.send('node_delete', x)
                this.backend.value.send('server_stop', x, 'Manually disconnect')
                this.backend.value.send('delete_node', x)
            }else{
                this.props.manager?.server_stop(x, 'Manually disconnect')
            }
        })
    }
    //#endregion
    
    //#region Modal Show
    showplugin = (uuid:string) => {
        this.data.value.pluginModal = true
        this.data.value.pluginUUID = uuid
    }
    showinfo = (uuid:string) => {
        this.data.value.infoModal = true
        this.data.value.infoUUID = uuid
    }
    showconsole = (uuid:string) => {
        this.data.value.consoleModal = true
        this.data.value.consoleUUID = uuid
        if(this.backend.value.config.haveBackend){
            this.backend.value.send('shell_open', uuid)
            this.backend.value.send('shell_folder', uuid, '')
        }else{
            this.props.manager?.shell_open(uuid)
            this.props.manager?.shell_folder(uuid, '')
        }
    }
    //#endregion

    //#region Plugin Event
    plugin_download = (plugin:Plugin) => {
        if(this.pluginTarget.value == undefined) return
        if(this.backend.value.config.haveBackend){
            this.backend.value.send("plugin_download", this.pluginTarget.value.uuid, JSON.stringify(plugin), this.preference.value.plugin_token.map(x => x.token).join(' '))
        }else{
            const p = this.props.manager?.targets.find(x => x.uuid == this.pluginTarget.value?.uuid)
            const p2:PluginWithToken = {...plugin, token: this.preference.value.plugin_token.map(x => x.token)}
            const h:Header = { name: 'plugin_download', data: plugin }
            p?.socket.send(JSON.stringify(h))
        }
    }
    plugin_remove = (plugin:Plugin) => {
        if(this.pluginTarget.value == undefined) return
        if(this.backend.value.config.haveBackend){
            this.backend.value.send("plugin_remove", this.pluginTarget.value.uuid, JSON.stringify(plugin))
        }else{
            const p = this.props.manager?.targets.find(x => x.uuid == this.pluginTarget.value?.uuid)
            const h:Header = { name: 'plugin_remove', data: plugin }
            p?.socket.send(JSON.stringify(h))
        }
    }
    //#endregion
}