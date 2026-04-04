import { reactive } from "vue";
import { ConsoleManager, Listener, AppConfig, RawSend, UserProfileClient, UserType, BackendType, EmitterProxy, BusType } from "verteilen-core/dist/interface";
import { checkExpressType, checkIfExpress } from "./platform";
import Cookies from 'js-cookie'
import { messager_log } from "./debugger";

/**
 * **Data Backend Controller**\
 * The proxy middleware that connect the function call to express backend or electron backend 
 */
export class BackendProxy {
    /**
     * **Application Configuration**\
     * Show current state of the app
     */
    config:AppConfig
    /**
     * **Console Hoster**\
     * 
     */
    consoleM: ConsoleManager | undefined
    is_init: boolean
    user: UserProfileClient = reactive({
        picture_url: false,
        name: "",
        type: UserType.GUEST,
        permission: undefined,
        
    })

    constructor(){
        this.user = reactive(this.user)
        this.config = {
            setup: false,
            isAdmin: false,
            haveBackend: false,
            login: false,
            backendType: BackendType.NONE,
        }
        this.is_init = false
        this.consoleM = undefined
    }

    /**
     * Called when App is mount\
     * Start init process, this will detect the mode and save it in the {@link config}\
     */
    init = () => {
        this.is_init = false
        return new Promise<void>(async (resolve) => {
            const e = await checkIfExpress()
            Object.assign(this.user, e)
            this.user.permission = e?.permission
            this.config.isAdmin = e ? (e.type == UserType.ADMIN || e.type == UserType.ROOT) : false
            this.is_init = true
            this.config.haveBackend = e != undefined
            this.config.backendType = (await checkExpressType()) ?? BackendType.SERVER
            if(this.user != undefined){
                fetch('/pic').then(x => {
                    this.user!.picture_url = x.ok
                    resolve()
                }).catch(() => {
                    this.user!.picture_url = false
                    resolve()
                })
            } else resolve()
        })
    }
    /**
     * 
     * @param _url Http URL
     * @param _emitter The value which require by the ConsoleManager class
     * @returns 
     */
    create_console_host = (_url: string, _emitter: EmitterProxy<BusType>) => {
        if(!_url.endsWith("/")) _url += "/"
        _url += "test"
        return new Promise<boolean>((resolve, reject) => {
            fetch(_url).then(async x => {
                if(x.status != 200){
                    reject("test response is not 200")
                }
                let websocket_url = _url;
                websocket_url = websocket_url.replace("http", "ws").replace("https", "wss")
                this.config.http_url = _url
                this.config.websocket_url = websocket_url
                this.consoleM = new ConsoleManager(_url, messager_log, _emitter)
                while(this.consoleM?.readyState != "opening") {}
                resolve(this.consoleM.connected)
            }).catch(err => {
                reject(err)
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

    getCookie = (name:string) => {
        return Cookies.get(name)
    }

    removeCookie = (name:string) => {
        Cookies.remove(name)
    }

    /**
     * Send info to backend
     * @param key Header
     * @param args Data 
     */
    send = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
        const d:RawSend = {
            name: key,
            data: args
        }
        this.consoleM?.send(d)
    }

    /**
     * Invoke a call to backend
     * @param key Header
     * @param args Data
     * @returns Promise return
     */
    invoke = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend) return undefined
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

    /**
     * Register a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOn = (channel: string, listener: Listener) => {
        if(!this.config.haveBackend) return
        this.consoleM?.on(channel, listener)
    }

    /**
     * UnRegister a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOff = (channel: string, listener: Listener) => {
        if(!this.config.haveBackend) return
        this.consoleM?.off(channel, listener)
    }
}