import { ComputedRef, Ref } from "vue"
import { BusType, Preference } from "./interface"
import { BackendProxy } from "./proxy"
import { Emitter } from "mitt"
import { i18n } from "./plugins/i18n"
import { ThemeInstance } from "vuetify"
import { vuetify } from "./plugins/vuetify"

export interface DATA {
    settingModal: boolean
    defaultTransition: any
}

export class Util_App {
    data: Ref<DATA>
    theme: ThemeInstance
    emitter:Emitter<BusType>
    backend:Ref<BackendProxy>
    preference:Ref<Preference>
    token: ComputedRef<string | undefined>

    constructor(data: Ref<DATA>, theme: ThemeInstance, emitter:Emitter<BusType>, backend:Ref<BackendProxy>, preference:Ref<Preference>, token: ComputedRef<string | undefined>){
        this.data = data
        this.theme = theme
        this.emitter = emitter
        this.backend = backend
        this.preference = preference
        this.token = token
    }

    save_preference = (v:Preference) => {
        this.backend.value.send('save_preference', JSON.stringify(v, null, 4), this.token.value)
    }

    load_preference = (x:string) => {
        this.preference.value = JSON.parse(x)
        console.log(this.preference.value)
        this.update_preference(this.preference.value)
        this.backend.value.send('locate', this.preference.value.lan)  
    }

    update_preference = (v:Preference) => {
        Object.assign(this.preference.value, v)
        this.locate(this.preference.value.lan)
        this.theme.change(v.theme)
        // @ts-ignore
        vuetify.defaults.value!.global = v.animation ? {} : this.data.value.defaultTransition
    }

    locate = (v:string) => {
        const t = i18n.global
        // @ts-ignore
        t.locale.value = v
        this.preference.value.lan = v
        this.emitter.emit('updateLocate')
        this.save_preference(this.preference.value)
    }
}