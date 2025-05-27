import fs from 'fs';
import path from 'path';
import * as vm from 'vm';
import { DataType, JavascriptLib, Job, Libraries, Messager, Messager_log, Parameter } from '../interface';
import { ClientJobParameter } from './job_parameter';
import { ClientOS } from './os';

const safeEval = (code:string, context?:any, opts?:vm.RunningCodeInNewContextOptions | string) => {
    let sandbox = {}
    let resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000)
    sandbox[resultKey] = {}
    var clearContext = `
        (function(){
            Function = undefined;
            const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
            keys.forEach((key) => {
            const item = this[key];
            if(!item || typeof item.constructor !== 'function') return;
            this[key].constructor = undefined;
            });
        })();
    `
    code = clearContext + resultKey + '=' + code
    if (context != undefined) {
        Object.keys(context).forEach(function (key) {
            sandbox[key] = context[key]
        })
    }
    vm.runInNewContext(code, sandbox, opts)
    return sandbox[resultKey]
}

type Getlib = () => Libraries | undefined
type Getpara = () => Parameter | undefined
type Getjob = () => Job | undefined

let getlib:Getlib | undefined = undefined
let getpara:Getpara | undefined = undefined
let getjob:Getjob | undefined = undefined
let messager: Messager
let messager_log: Messager_log
let clientos:ClientOS | undefined
let para:ClientJobParameter | undefined = undefined


const tag = () => getjob!?.()?.uuid ?? 'unknown'
const runtime = () => getjob!?.()?.runtime_uuid ?? 'unknown'


//#region Parameters
async function wait(time:number){
    return new Promise((resolve) => setTimeout(resolve, time * 1000))
}
async function sleep(n:number){
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n*1000);
}
function hasboolean(key:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return false
    return p.containers.findIndex(x => x.name == key && x.type == DataType.Boolean) != -1
}
function hasnumber(key:string){
    if(key == 'ck') return true
    const p = getpara?.() ?? undefined
    if(p == undefined) return false
    return p.containers.findIndex(x => x.name == key && x.type == DataType.Number) != -1
}
function hasstring(key:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return false
    return p.containers.findIndex(x => x.name == key && x.type == DataType.String) != -1
}
function getboolean(key:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return false
    return p.containers.find(x => x.name == key && x.type == DataType.Boolean)?.value ?? false
}
function getnumber(key:string){
    if(key == 'ck'){
        return getjob?.()?.index
    }
    const p = getpara?.() ?? undefined
    if(p == undefined) return 0
    return p.containers.find(x => x.name == key && x.type == DataType.Number)?.value ?? 0
}
function getstring(key:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return ""
    return p.containers.find(x => x.name == key && x.type == DataType.String)?.value ?? ""
}
function setboolean(key:string, value:boolean){
    const p = getpara?.() ?? undefined
    if(p == undefined) return
    const target = p.containers.find(x => x.name == key && x.type == DataType.Boolean)
    if(target == undefined && !p.canWrite) return
    if(target != undefined) target.value = value
    
    messager_log(`[Boolean feedback] ${key} = ${value}`, tag(), runtime())
    para?.feedbackboolean({key:key,value:value})
}
function setnumber(key:string, value:number){
    if(key == 'ck') {
        messager_log("Trying to set a constant ck...", tag(), runtime())
        return
    }
    const p = getpara?.() ?? undefined
    if(p == undefined) return
    const target = p.containers.find(x => x.name == key && x.type == DataType.Number)
    if(target == undefined && !p.canWrite) return
    if(target != undefined) target.value = value
    messager_log(`[Number feedback] ${key} = ${value}`, tag(), runtime())
    para?.feedbacknumber({key:key,value:value})
}
function setstring(key:string, value:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return
    const target = p.containers.find(x => x.name == key && x.type == DataType.String)
    if(target == undefined && !p.canWrite) return
    if(target != undefined) target.value = value
    messager_log(`[String feedback] ${key} = ${value}`, tag(), runtime())
    para?.feedbackstring({key:key,value:value})
}
//#endregion
//#endregion
//#region Http
async function httpGet(url:string, p: any){
    return httpGo('GET', url, p.toObject())
}
async function httpPost(url:string, p: any){
    return httpGo('POST', url, p.toObject())
}
async function httpDelete(url:string, p: any){
    return httpGo('DELETE', url, p.toObject())
}
async function httpPatch(url:string, p: any){
    return httpGo('PATCH', url, p.toObject())
}
async function httpPut(url:string, p: any){
    return httpGo('PUT', url, p.toObject())
}
async function httpGo(method:string, url:string, p: any) {
    return fetch(url, {
        method: method,
        body: p
    })
}
//#endregion


export class ClientJavascript {

    os:any
    env:any
    message:any
    http:any

    constructor(_messager: Messager, _messager_log: Messager_log, _getjob:Getjob) {
        messager = _messager
        messager_log = _messager_log
        this.os = {
            "sleep": sleep,
            "copyfile": this.copyfile,
            "copydir": this.copydir,
            "deletefile": this.deletefile,
            "deletedir": this.deletedir,
            "exist": this.exist,
            "listfile": this.listfile,
            "listdir": this.listdir,
            "createdir": this.createdir,
            "writefile": this.writefile,
            "readfile": this.readfile,
            "rename": this.rename,
        }
        
        this.env = {
            "wait": wait,
            "hasboolean": hasboolean, 
            "getboolean": getboolean, 
            "setboolean": setboolean,

            "hasnumber": hasnumber, 
            "getnumber": getnumber, 
            "setnumber": setnumber,

            "hasstring": hasstring, 
            "getstring": getstring, 
            "setstring": setstring,
        }
        
        this.message = {
            "messager": (m:any) => messager(m.toString(), tag()), 
            "messager_log": (m:any) => messager_log(m.toString(), tag(), runtime()),
        }
        
        this.http = {
            "get": httpGet,
            "post": httpPost,
            "put": httpPut,
            "delete": httpDelete,
            "patch": httpPatch,
        }
    }

    /**
     * Before running the lua scripts, We must init first.\
     * ! Otherwise it won't work or throw error
     * @param _messager Message habndle
     * @param _messager_log Message habndle with print on screen feature
     * @param _clientos OS worker
     * @param _para Parameter worker
     * @param _getlib library getter method
     * @param _getpara Parameter getter method
     * @param _getjob Job getter method
     */
    static Init = (_messager: Messager, _messager_log: Messager, _clientos:ClientOS, _para:ClientJobParameter, _getlib:Getlib, _getpara:Getpara, _getjob:Getjob) => {
        messager = _messager
        messager_log = _messager_log
        clientos = _clientos
        para = _para
        getlib = _getlib
        getpara = _getpara
        getjob = _getjob
    }

    /**
     * Running lua\
     * With reference libraries\
     * @param lua Lua script text
     * @param libs Libraries header names
     * @returns Calcuate result
     */
    JavascriptExecuteWithLib = (javascript:string, libs:Array<string>) => {
        const context = this.getJavascriptEnv()
        let script = ''

        const p = getlib?.() ?? undefined
        if(p != undefined){
            libs.forEach(x => {
                const t = p.libs.find(y => y.name == x)
                if(t != undefined) script += ("\n" + t.content + "\n")
            })
        }
        
        script += ('\n' + javascript)
        const r = safeEval(script, context)
        return r
    }

    /**
     * Running lua
     * @param lua Lua script text
     * @returns Calcuate result
     */
    JavascriptExecute = (javascript:string) => {
        const context = this.getJavascriptEnv(JavascriptLib.OS | JavascriptLib.MESSAGE | JavascriptLib.HTTP)
        const r = safeEval(javascript, context)
        return r
    }

    private getJavascriptEnv(flags:JavascriptLib = JavascriptLib.ALL){
        const isbin = process.cwd().endsWith('bin')
        const root = isbin ? path.join(process.cwd(), 'lua') : path.join(process.cwd(), 'bin', 'lua')
        if (!fs.existsSync(root)) fs.mkdirSync(root)
        let javascriptEnv = {}
        if((flags & JavascriptLib.OS) == JavascriptLib.OS) javascriptEnv = Object.assign(javascriptEnv, { o: this.os })
        if((flags & JavascriptLib.ENV) == JavascriptLib.ENV) javascriptEnv = Object.assign(javascriptEnv, { env: this.env })
        if((flags & JavascriptLib.MESSAGE) == JavascriptLib.MESSAGE) javascriptEnv = Object.assign(javascriptEnv, { m: this.message })
        if((flags & JavascriptLib.HTTP) == JavascriptLib.HTTP) javascriptEnv = Object.assign(javascriptEnv, { http: this.http })
        javascriptEnv = Object.assign(javascriptEnv, {console: { log: this.message['messager_log'] }})
        return javascriptEnv
    }
    private copyfile(from:string, to:string){
        clientos?.file_copy({from:from,to:to})
    }
    private copydir(from:string, to:string){
        clientos?.dir_copy({from:from,to:to})
    }
    private deletefile(path:string){
        clientos?.file_delete({path:path})
    }
    private deletedir(path:string){
        clientos?.dir_delete({path:path})
    }
    private rename(from:string, to:string){
        return clientos?.rename({from:from, to:to})
    }
    private exist(path:string){
        return clientos?.fs_exist({path:path})
    }
    private listfile(path:string){
        return clientos?.dir_files({path:path}).join('\n')
    }
    private listdir(path:string){
        return clientos?.dir_dirs({path:path}).join('\n')
    }
    private createdir(path:string){
        clientos?.dir_create({path:path})
    }
    private writefile(path:string, data:string){
        clientos?.file_write({ from: path, to: data })
    }
    private readfile(path:string){
        return clientos?.file_read({path:path})
    }
}