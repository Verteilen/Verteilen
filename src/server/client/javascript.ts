import * as vm from 'vm';
import { DataType, JavascriptLib, Job, Libraries, Messager, Messager_log, Parameter } from '../interface';
import { ClientJobParameter } from './job_parameter';
import { ClientOS } from './os';
import path from 'path';

export const safeEval = (code:string, context?:any, opts?:vm.RunningCodeInNewContextOptions | string) => {
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
type DatatypeChecker = (s:DataType) => boolean

let getlib:Getlib | undefined = undefined
let getpara:Getpara | undefined = undefined
let getjob:Getjob | undefined = undefined
let messager: Messager
let messager_log: Messager_log
let clientos:ClientOS | undefined
let para:ClientJobParameter | undefined = undefined


const tag = () => getjob!?.()?.uuid ?? 'unknown'
const runtime = () => getjob!?.()?.runtime_uuid ?? 'unknown'

export class ClientJavascript {

    path: any
    os:any
    env:any
    message:any
    http:any

    constructor(_messager: Messager, _messager_log: Messager_log, _getjob:Getjob) {
        messager = _messager
        messager_log = _messager_log
        this.path = {
            filename: this.filename,
            extname: this.extname,
            dirname: this.dirname,
        }
        this.os = {
            exec: this.exec,
            command: this.command,
            copyfile: this.copyfile,
            copydir: this.copydir,
            deletefile: this.deletefile,
            deletedir: this.deletedir,
            exist: this.exist,
            listfile: this.listfile,
            listdir: this.listdir,
            createdir: this.createdir,
            writefile: this.writefile,
            readfile: this.readfile,
            rename: this.rename,
        }
        
        this.env = {
            has: this.has,
            get: this.get,
            set: this.set,

            hasboolean: this.hasboolean, 
            getboolean: this.getboolean, 
            setboolean: this.setboolean,

            hasnumber: this.hasnumber, 
            getnumber: this.getnumber, 
            setnumber: this.setnumber,

            hasstring: this.hasstring, 
            getstring: this.getstring, 
            setstring: this.setstring,

            hasobject: this.hasobject, 
            getobject: this.getobject, 
            setobject: this.setobject,

            haslist: this.haslist, 
            getlist: this.getlist, 
            setlist: this.setlist,

            hasselect: this.hasselect, 
            getselect: this.getselect, 
            getsleectlength: this.getselectlendth,
            setselect: this.setselect,
        }
        
        this.message = {
            messager: (m:any) => _messager(m.toString(), tag()), 
            messager_log: (m:any) => _messager_log(m.toString(), tag(), runtime()),
        }
        
        this.http = {
            get: this.httpGet,
            post: this.httpPost,
            put: this.httpPut,
            delete: this.httpDelete,
            patch: this.httpPatch,
        }
    }

    /**
     * Before running the js scripts, We must init first.\
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
     * Running js\
     * With reference libraries\
     * @param js js script text
     * @param libs Libraries header names
     * @returns Calcuate result
     */
    JavascriptExecuteWithLib = (javascript:string, libs:Array<string>, log?:Messager) => {
        let context = this.getJavascriptEnv(JavascriptLib.ALL, log)
        let result = 0
        context = Object.assign(context, { result: result })
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
     * Running js
     * @param js js script text
     * @returns Calcuate result
     */
    JavascriptExecute = (javascript:string, log?:Messager) => {
        let context = this.getJavascriptEnv(JavascriptLib.OS | JavascriptLib.MESSAGE | JavascriptLib.HTTP | JavascriptLib.PATH, log)
        let result = 0
        context = Object.assign(context, { result: result })
        const r = safeEval(javascript, context)
        return r
    }

    private getJavascriptEnv(flags:JavascriptLib = JavascriptLib.ALL, log?:Messager){
        let javascriptEnv = {}
        if((flags & JavascriptLib.PATH) == JavascriptLib.PATH) javascriptEnv = Object.assign(javascriptEnv, { path: this.path })
        if((flags & JavascriptLib.OS) == JavascriptLib.OS) javascriptEnv = Object.assign(javascriptEnv, { os: this.os })
        if((flags & JavascriptLib.ENV) == JavascriptLib.ENV) javascriptEnv = Object.assign(javascriptEnv, { env: this.env })
        if((flags & JavascriptLib.MESSAGE) == JavascriptLib.MESSAGE) {
            if(log){
                javascriptEnv = Object.assign(javascriptEnv, {
                    messager: (m:any) => log(m.toString(), tag()), 
                    messager_log: (m:any) => log(m.toString(), tag()),
                })
            }else{
                javascriptEnv = Object.assign(javascriptEnv, { m: this.message })
            }
        }
        if((flags & JavascriptLib.HTTP) == JavascriptLib.HTTP) javascriptEnv = Object.assign(javascriptEnv, { http: this.http })
        javascriptEnv = Object.assign(javascriptEnv, {
            setTimeout: setTimeout,
            wait: this.wait,
            sleep: this.sleep,
            console: { log: log ? log : messager_log },
            JSON: {
                parse: JSON.parse,
                stringify: JSON.stringify
            }
        })
    
        return javascriptEnv
    }
    private filename(p:string, extension: boolean){
        if(extension){
            return path.basename(p)
        }else{
            return path.basename(p).replace(path.extname(p), "")
        }
    }
    private extname(p:string){
        return path.extname(p)
    }
    private dirname(p:string){
        return path.dirname(p)
    }
    private exec(command:string, args:string, cwd?:string){
        clientos?.command_exec(command, args, cwd)
    }
    private command(command:string, args:string, cwd?:string){
        clientos?.command_sync(command, args, cwd)
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
        return clientos?.dir_files({path:path})
    }
    private listdir(path:string){
        return clientos?.dir_dirs({path:path})
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

    //#region Parameters
    private async wait(time:number){
        return new Promise((resolve) => setTimeout(resolve, time * 1000))
    }
    private async sleep(n:number){
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n*1000);
    }
    
    private has(key:string, checker?:DatatypeChecker){
        const p = getpara?.() ?? undefined
        if(p == undefined) return false
        return p.containers.findIndex(x => x.name == key && (checker ? checker(x.type) : true )) != -1
    }
    private hasboolean(key:string){
        return this.has(key, (x) => x == DataType.Boolean)
    }
    private hasnumber(key:string){
        return this.has(key, (x) => x == DataType.Number || x == DataType.Expression)
    }
    private hasstring(key:string){
        return this.has(key, (x) => x == DataType.String || x == DataType.Textarea)
    }
    private hasobject(key:string){
        return this.has(key, (x) => x == DataType.Object)
    }
    private haslist(key:string){
        return this.has(key, (x) => x == DataType.List)
    }
    private hasselect(key:string){
        return this.has(key, (x) => x == DataType.Select)
    }

    private get(key:string, checker?:DatatypeChecker){
        const p = getpara?.() ?? undefined
        if(p == undefined) return undefined
        return p.containers.find(x => x.name == key && (checker ? checker(x.type) : true )) ?? undefined
    }
    private getboolean(key:string){
        return this.get(key, (x) => x == DataType.Boolean)?.value
    }
    private getnumber(key:string){
        if(key == 'ck'){
            const r = getjob?.()?.index
            if(r != undefined) return r
            return 0
        }
        return this.get(key, (x) => x == DataType.Number || x == DataType.Expression)?.value
    }
    private getstring(key:string){
        return this.get(key, (x) => x == DataType.String || x == DataType.Textarea)?.value
    }
    private getobject(key:string){
        return this.get(key, (x) => x == DataType.Object)?.value
    }
    private getlist(key:string){
        return this.get(key, (x) => x == DataType.List)?.value
    }
    private getselect(key:string){
        const s = this.get(key, (x) => x == DataType.Select)
        if(s?.meta == undefined) return undefined
        return s.meta[s.value]
    }
    private getselectlendth(key:string){
        const s = this.get(key, (x) => x == DataType.Select)
        if(s?.meta == undefined) return undefined
        return s.meta.length
    }
    private _set(key:string, checker?:DatatypeChecker){
        const p = getpara?.() ?? undefined
        if(p == undefined) return undefined
        if(!p.canWrite) return undefined
        return p.containers.find(x => x.name == key && (checker ? checker(x.type) : true ))
    }
    private set(key:string, value:any){
        const target = this._set(key)
        if(target == undefined) return undefined
        switch(target.type){
            case DataType.Boolean:
                this.setboolean(key, value)
                break
            case DataType.Number:
                this.setnumber(key, value)
                break
            case DataType.Textarea:
            case DataType.String:
                this.setstring(key, value)
                break
            case DataType.Object:
                this.setobject(key, value)
                break
            case DataType.List:
                this.setlist(key, value)
                break
            case DataType.Select:
                this.setselect(key, value)
                break
        }
    }
    private setboolean(key:string, value:boolean){
        const target = this._set(key, (x) => x == DataType.Boolean)
        if(target == undefined) return undefined

        target.value = value
        para?.feedbackboolean({key:key,value:value})
    }
    private setnumber(key:string, value:number){
        if(key == 'ck') {
            messager_log("Trying to set a constant ck...", tag(), runtime())
            return
        }
        const target = this._set(key, (x) => x == DataType.Number)
        if(target == undefined) return undefined

        target.value = value
        para?.feedbacknumber({key:key,value:value})
    }
    private setstring(key:string, value:string){
        const target = this._set(key, (x) => (x == DataType.String || x == DataType.Textarea))
        if(target == undefined) return undefined
        
        target.value = value
        para?.feedbackstring({key:key,value:value})
    }
    private setobject(key:string, value:any){
        const target = this._set(key, (x) => x == DataType.Object)
        if(target == undefined) return undefined
        
        target.value = value
        para?.feedbackobject({key:key,value:value})
    }
    private setlist(key:string, value:Array<string>){
        const target = this._set(key, (x) => x == DataType.List)
        if(target == undefined) return undefined
        
        target.value = value
        para?.feedbackobject({key:key,value:value})
    }
    private setselect(key:string, value:number){
        const target = this._set(key, (x) => x == DataType.Select)
        if(target == undefined) return undefined
        
        target.value = value
        para?.feedbackobject({key:key,value:value})
    }
    //#endregion
    //#endregion
    //#region Http
    private async httpGet(url:string, p: any){
        return this.httpGo('GET', url, p.toObject())
    }
    private async httpPost(url:string, p: any){
        return this.httpGo('POST', url, p.toObject())
    }
    private async httpDelete(url:string, p: any){
        return this.httpGo('DELETE', url, p.toObject())
    }
    private async httpPatch(url:string, p: any){
        return this.httpGo('PATCH', url, p.toObject())
    }
    private async httpPut(url:string, p: any){
        return this.httpGo('PUT', url, p.toObject())
    }
    private async httpGo(method:string, url:string, p: any) {
        return fetch(url, {
            method: method,
            body: p
        })
    }
    //#endregion
}