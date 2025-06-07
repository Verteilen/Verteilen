import { AppConfig, RawSend, UserType } from "./interface";
import { checkifElectron, checkIfExpress } from "./platform";
import { ConsoleManager, Listener } from "./script/console_manager";

/**
 * The proxy middleware that connect the function call to express backend or electron backend 
 */
export class BackendProxy {
    config:AppConfig
    consoleM: ConsoleManager | undefined
    is_init: boolean

    constructor(){
        this.config = {
            isElectron: checkifElectron(),
            isExpress: false,
            isAdmin: false,
            haveBackend: false,
        }
        this.is_init = false
        this.consoleM = undefined
    }

    /**
     * Start init process, this will detect the mode and save it in the {@link config}
     */
    init = () => {
        return new Promise<void>((resolve) => {
            checkIfExpress((e) => {
                this.config.isExpress = e != -1
                this.config.isAdmin = e == UserType.ADMIN
                this.is_init = true
                this.config.haveBackend = this.config.isElectron || this.config.isExpress
                resolve()
            })
        })   
    }

    /**
     * Wait the init process to end
     */
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

    /**
     * Send info to backend
     * @param key Header
     * @param args Data 
     */
    send = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
        if(this.config.isElectron){
            window.electronAPI.send(key, ...args)
        }
        if(this.config.isExpress){
            const d:RawSend = {
                name: key,
                data: args
            }
            this.consoleM?.send(d)
        }
    }

    /**
     * Invoke a call to backend
     * @param key Header
     * @param args Data
     * @returns Promise return
     */
    invoke = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
        if(this.config.isElectron){
            return window.electronAPI.invoke(key, ...args)
        }
        if(this.config.isExpress){
            const d:RawSend = {
                name: key,
                data: args
            }
            return new Promise<any>((resolve) => {
                this.consoleM?.once(`${key}-feedback`, (...args:Array<any>) => {
                    if(args.length == 1) resolve(args[0])
                    else resolve(args)
                })
                this.consoleM?.send(d)
            })
        }
    }

    /**
     * Register a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOn = (channel: string, listener: Listener) => {
        if(!this.config.haveBackend) return
        if(this.config.isElectron){
            window.electronAPI.eventOn(channel, (e, ...aargs) => listener(...aargs))
        }
        if(this.config.isExpress){
            this.consoleM?.on(channel, listener)
        }
    }

    /**
     * UnRegister a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOff = (channel: string, listener: Listener) => {
        if(!this.config.haveBackend) return
        if(this.config.isElectron){
            window.electronAPI.eventOn(channel, (e, ...aargs) => listener(...aargs))
        }
        if(this.config.isExpress){
            this.consoleM?.off(channel, listener)
        }
    }
}