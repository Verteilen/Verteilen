import { reactive } from "vue";
import { AppConfig, RawSend, UserProfileClient, UserType, BackendType, EmitterProxy, BusType, FrontendState, ServerSetting, Login } from "verteilen-core/dist/interface";
import { checkExpressType, checkIfExpress } from "./platform";
import Cookies from 'js-cookie'
import { messager_log } from "./debugger";
import { ConsoleManager, Listener } from "./script/console_manager";

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
    setting: ServerSetting | undefined
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
                fetch('/api/pic').then(x => {
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
    create_console_host = (_url: string, _emitter: EmitterProxy<BusType>):Promise<boolean> => {
        let query_url = _url
        if(!query_url.endsWith("/")) query_url += "/"
        query_url += "api/test"
        return new Promise<boolean>(async (resolve, reject) => {
            fetch(query_url).then(async x => {
                if(x.status != 200){
                    reject("test response is not 200")
                }
                const res = JSON.parse(await x.text())
                this.config.http_url = _url.replace("ws", "http").replace("wss", "https")
                this.config.websocket_url = _url.replace("http", "ws").replace("https", "wss")
                this.consoleM = new ConsoleManager(this.config.websocket_url, messager_log, _emitter)
                let timer:any = undefined
                timer = setInterval(() => {
                    if(this.consoleM!.readyState != "opening"){
                        clearInterval(timer);
                        this.config.backendType = res.type ?? BackendType.NONE
                        this.config.setup = res.setup ?? true
                        this.setting = res.setting ?? undefined
                        console.debug("[Debug] this.consoleM!.connected", this.consoleM!.connected)
                        if(this.consoleM!.connected){
                            console.debug("[Debug] Id: ", this.consoleM!.Id)
                        }
                        resolve(this.consoleM!.connected)
                    }
                }, 50);
            }).catch(err => {
                console.error(err)
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
        if(!this.config.haveBackend && !this.consoleM?.connected) return undefined
        if(this.consoleM == undefined) return
        const d:RawSend = {
            name: key,
            data: args
        }
        this.consoleM!.send(d)
    }

    /**
     * Invoke a call to backend
     * @param key Header
     * @param args Data
     * @returns Promise return
     */
    invoke = async (key:string, ...args:Array<any>) => {
        if(!this.config.haveBackend && !this.consoleM?.connected) return undefined
        if(this.consoleM == undefined) return undefined
        const d:RawSend = {
            name: key,
            data: args.length == 1 ? args[0] : args
        }
        return new Promise<any>((resolve) => {
            this.consoleM!.once(`${key}-feedback`, (...args2:Array<any>) => {
                if(args2.length == 1) {
                    console.debug(`[Debug Proxy Invoke Feedback] ${key}`, args2[0])
                    resolve(args2[0])
                }
                else {
                    console.debug(`[Debug Proxy Invoke Feedback] ${key}`, args2)
                    resolve(args2)
                }
            })
            this.consoleM!.send(d)
            console.debug(`[Debug Proxy Invoke] ${key}`, args)
        })
    }

    /**
     * Register a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOn = (channel: string, listener: Listener) => {
        if(!this.config.haveBackend && !this.consoleM?.connected) return
        if(this.consoleM == undefined) return
        this.consoleM!.on(channel, listener)
    }

    /**
     * UnRegister a event feedback
     * @param channel Header name
     * @param listener Feedback
     */
    eventOff = (channel: string) => {
        if(!this.config.haveBackend && !this.consoleM?.connected) return
        if(this.consoleM == undefined) return
        this.consoleM!.off(channel)
    }

    relogin = () => {
        this.config.login = false
        this.removeCookie('token')
    }

    login = (login:Login) => {
        let url = ""
        if(this.config.haveBackend){
        }
        url += "/api/login"
        fetch()
    }
}