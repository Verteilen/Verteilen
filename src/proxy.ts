import { reactive } from "vue";
import { ConsoleManager, Listener, AppConfig, RawSend, UserProfileClient, UserType, BackendType, EmitterProxy, BusType, FrontendState } from "verteilen-core/dist/interface";
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

    state = (): FrontendState => {
        if(this.config.haveBackend){
            if(this.config.backendType == BackendType.SERVER || this.config.backendType == BackendType.NONE){
                if(!this.config.setup) return FrontendState.SETUP_BACKEND
                if(this.config.login) return FrontendState.LOGIN_BACKEND
                else return FrontendState.LOGOUT_BACKEND
            }
            else if(this.config.backendType == BackendType.NODE) return FrontendState.NODE
            else if(this.config.backendType == BackendType.CLUSTER) return FrontendState.CLUSTER
            return FrontendState.NONE
        }
        if(this.config.login) return FrontendState.LOGIN_STATIC
        return FrontendState.LOGOUT_STATIC
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
            resolve()
        })
    }

    fetch_pic = () => {
        return new Promise<void>(async (resolve) => {
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
        let query_url = _url
        if(!query_url.endsWith("/")) query_url += "/"
        query_url += "test"
        return new Promise<boolean>(async (resolve, reject) => {
            fetch(query_url).then(async x => {
                if(x.status != 200){
                    reject("test response is not 200")
                }
                const res = JSON.parse(await x.text())
                let websocket_url = _url;
                websocket_url = websocket_url.replace("http", "ws").replace("https", "wss")
                this.config.http_url = _url
                this.config.websocket_url = websocket_url
                this.consoleM = new ConsoleManager(_url, messager_log, _emitter)
                let timer:any = undefined
                timer = setInterval(() => {
                    if(this.consoleM!.readyState != "opening"){
                        clearInterval(timer);
                        this.config.backendType = res.type ?? BackendType.NONE
                        this.config.setup = res.setup ?? true
                        resolve(this.consoleM!.connected)
                    }
                }, 50);
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