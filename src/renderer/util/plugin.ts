import { BuildinAssets } from "../interface"


export interface DATA {
    pluginBuildinModal: boolean
    templateBuildinModal: boolean
    pluginModal: boolean
    templateModal: boolean
    pluginDeleteModal: boolean
    templateDeleteModal: boolean
    pluginDeleteData: string
    templateDeleteData: string
    buildin_select_plugin: number
    buildin_select_template: number
    pluginData: { name: string, url: string }
    templateData: { name: string, url: string }
    errorMessage: string
    loading_plugin: boolean
    loading_template: boolean
    buildIn_plugin: BuildinAssets | undefined
    buildIn_template: BuildinAssets | undefined
    buildin_url: {
        plugin: string
        template: string
    }
}