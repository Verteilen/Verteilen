import { AppConfig } from "./interface";
import { checkifElectron, checkIfExpress } from "./platform";


export class BackendProxy {
    config:AppConfig
    is_init: boolean

    constructor(){
        this.config = {
            isElectron: checkifElectron(),
            isExpress: false,
            haveBackend: false
        }
        this.is_init = false
    }

    init = () => {
        return new Promise<void>((resolve) => {
            checkIfExpress((e) => {
                this.config.isExpress = e
                this.is_init = true
                this.config.haveBackend = this.config.isElectron || this.config.isExpress
                resolve()
            })
        })   
    }

    wait_init = () => {
        return new Promise<void>((resolve) => {
            let timer:any
            timer = setInterval(() => {
                if(this.is_init){
                    clearInterval(timer)
                    resolve()
                }
            }, 5);
        })
        
    }

    send = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
        if(this.config.isElectron){
            window.electronAPI.send(key, ...args)
        }
        if(this.config.isExpress){
            fetch(key, { body: JSON.stringify([...args]) })
        }
    }

    invoke = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
        if(this.config.isElectron){
            return window.electronAPI.invoke(key, ...args)
        }
        if(this.config.isExpress){
            const p = await fetch(key, { body: JSON.stringify([...args]) })
            return p.text()
        }
    }

    eventOn = (channel: string, listener: (...args: any[]) => void) => {
        if(!this.config.haveBackend) return
        if(this.config.isElectron){
            window.electronAPI.eventOn(channel, (e, ...aargs) => listener(...aargs))
        }
    }

    eventOff = (channel: string, listener: (...args: any[]) => void) => {
        if(!this.config.haveBackend) return
        if(this.config.isElectron){
            window.electronAPI.eventOn(channel, (e, ...aargs) => listener(...aargs))
        }
    }
}