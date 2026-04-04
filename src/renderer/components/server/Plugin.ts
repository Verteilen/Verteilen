import { ComputedRef, Ref } from "vue"
import { BuildinAssets, PluginContainer, PluginPageData } from "verteilen-core/dist/interface"
import { i18n } from "../../plugins/i18n"

//#region Data
export interface DATA {
    pluginBuildinModal: boolean
    pluginModal: boolean
    pluginDeleteModal: boolean
    pluginInfoModal: boolean
    pluginDeleteData: string
    pluginData: { name: string, url: string }
    errorMessage: string
    loading_plugin: Array<string>
    available_update: Array<string>
    buildIn_plugin: BuildinAssets
    buildin_url: string
    default_plugin_thumbnail: string
    selection: PluginContainer | undefined
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
    plugins: ComputedRef<PluginContainer[]>

    constructor(
        data: Ref<DATA>,
        emits: EmitType,
        plugins: ComputedRef<PluginContainer[]>
    ) {
        this.data = data    
        this.emits = emits
        this.plugins = plugins
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

    update_tick = async () => {
        const fs = this.plugins.value.filter(x => x.url != undefined).map(x => {
            return fetch(x.url!)
        })
        const res = await Promise.all(fs)
        const as = res.map(x => x.text())
        const res2 = await Promise.all(as)
        this.data.value.available_update = []
        res2.forEach(x => {
            const buffer:PluginContainer = JSON.parse(x)
            const target = this.plugins.value.find(x => x.title == buffer.title && x.owner == buffer.owner)
            if(target?.version != buffer.version){
                this.data.value.available_update.push(buffer.title!)
            }
        })
    }

    /**
     * Pull the data from the buildin URL\
     * Translate the name and description base on manifest.json from all plugins
     */
    pull_buildin = async () => {
        const res = await fetch(this.data.value.buildin_url)
        const text = await res.text()
        this.data.value.buildIn_plugin = JSON.parse(text)
        const allf = this.data.value.buildIn_plugin!.data.map(x => fetch(x.url))
        const allfres = await Promise.all(allf)
        const alltextp = allfres.map(x => x.text())
        const alltext = await Promise.all(alltextp)
        alltext.forEach((tdata, index) => {
            try{
                const pdata:PluginContainer = JSON.parse(tdata)
                const target = pdata.i18n.find(x => i18n.global.locale.value == x.key)
                if(target === undefined) return
                const keys = Object.keys(target.value)
                if(pdata.title != undefined && keys.includes(pdata.title)){
                    this.data.value.buildIn_plugin!.data[index].name = target.value[pdata.title]
                }
                if(pdata.description != undefined && keys.includes(pdata.description)){
                    this.data.value.buildIn_plugin!.data[index].description = target.value[pdata.description]
                }
            }catch(e){
                console.error(e)
            }
        })
        console.log("Update buildin plugin", this.data.value.buildIn_plugin)
    }
}