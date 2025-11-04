import { Ref } from "vue"
import { BuildinAssets, PluginPageData } from "../../interface"

//#region Data
export interface DATA {
    pluginBuildinModal: boolean
    pluginModal: boolean
    pluginDeleteModal: boolean
    pluginDeleteData: string
    buildin_select_plugin: number
    pluginData: { name: string, url: string }
    errorMessage: string
    loading_plugin: Array<string>
    buildIn_plugin: BuildinAssets | undefined
    buildin_url: string
    default_plugin_thumbnail: string
}

export interface PROP {
    plugin: PluginPageData
}

export type EmitType = {
    (e: 'added-plugin', name:string, url:string): void
    (e: 'delete-plugin', name:string): void
}
//#endregion

export class Util_Plugin {
    data: Ref<DATA>
    emits: EmitType

    constructor(
        data: Ref<DATA>,
        emits: EmitType
    ) {
        this.data = data    
        this.emits = emits
    }

    importPlugin = () => {
        this.data.value.pluginModal = true
        this.data.value.errorMessage = ''
        this.data.value.pluginData = { name: '', url: '' }
    }

    importPluginBuildin = () => {
        this.data.value.pluginBuildinModal = true
        this.data.value.errorMessage = ''
        this.data.value.pluginData = { name: '', url: '' }
    }
}