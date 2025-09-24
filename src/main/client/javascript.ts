// ========================
//                           
//      Share Codebase     
//                           
// ========================
import * as vm from 'vm';
import { DATA_FOLDER, DataType, JavascriptLib, Job, Libraries, Messager, Messager_log, Parameter, ParameterContainer } from '../interface';
import { ClientJobParameter } from './job_parameter';
import { ClientOS } from './os';
import * as path from 'path';
import * as os from 'os'

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
    code = clearContext + resultKey + `=(function(){\n${code}\n})();`
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
let waiting : number = 0

const tag = () => getjob!?.()?.uuid ?? 'unknown'
const runtime = () => getjob!?.()?.runtime_uuid ?? 'unknown'

//#region Global
function has(key:string, checker?:DatatypeChecker){
    const p = getpara?.() ?? undefined
    if(p == undefined) return false
    return p.containers.findIndex(x => x.name == key && (checker ? checker(x.type) : true )) != -1
}
function hasboolean(key:string){
    return has(key, (x) => x == DataType.Boolean)
}
function hasnumber(key:string){
    return has(key, (x) => x == DataType.Number || x == DataType.Expression)
}
function hasstring(key:string){
    return has(key, (x) => x == DataType.String || x == DataType.Textarea)
}
function hasobject(key:string){
    return has(key, (x) => x == DataType.Object)
}
function haslist(key:string){
    return has(key, (x) => x == DataType.List)
}
function hasselect(key:string){
    return has(key, (x) => x == DataType.Select)
}

function get(key:string, checker?:DatatypeChecker){
    const p = getpara?.() ?? undefined
    if(p == undefined) return undefined
    return p.containers.find(x => x.name == key && (checker ? checker(x.type) : true ))?.value ?? undefined
}
function getboolean(key:string){
    return get(key, (x) => x == DataType.Boolean)
}
function getnumber(key:string){
    if(key == 'ck'){
        const r = getjob?.()?.index
        if(r != undefined) return r
        return 0
    }
    return get(key, (x) => x == DataType.Number || x == DataType.Expression)
}
function getstring(key:string){
    return get(key, (x) => x == DataType.String || x == DataType.Textarea)
}
function getobject(key:string){
    return get(key, (x) => x == DataType.Object)
}
function getlist(key:string){
    return get(key, (x) => x == DataType.List)
}
function getselect(key:string){
    const s = get(key, (x) => x == DataType.Select)
    if(s?.meta == undefined) return undefined
    return s.meta[s.value]
}
function getselectlendth(key:string){
    const s = get(key, (x) => x == DataType.Select)
    if(s?.meta == undefined) return undefined
    return s.meta.length
}
function _set(key:string, checker?:DatatypeChecker, created:boolean = true):ParameterContainer | undefined{
    const p = getpara?.() ?? undefined
    if(p == undefined) return undefined
    if(!p.canWrite) return undefined
    return p.containers.find(x => x.name == key && (checker ? checker(x.type) : true ))
}
function set(key:string, value:any){
    const target = _set(key)
    if(target == undefined) return
    switch(target.type){
        case DataType.Boolean:
            setboolean(key, value)
            break
        case DataType.Number:
            setnumber(key, value)
            break
        case DataType.Textarea:
        case DataType.String:
            setstring(key, value)
            break
        case DataType.Object:
            setobject(key, value)
            break
        case DataType.List:
            setlist(key, value)
            break
        case DataType.Select:
            setselect(key, value)
            break
    }
}
function setboolean(key:string, value:boolean){
    let target = _set(key, (x) => x == DataType.Boolean)
    if(target == undefined) {
        target = { name: key, type: DataType.Boolean, hidden: false, runtimeOnly: true, value: value }
    }else{
        target.value = value
    }
    para?.feedbackboolean({key:key,value:value})
}
function setnumber(key:string, value:number){
    if(key == 'ck') {
        messager_log("Trying to set a constant ck...", tag(), runtime())
        return
    }
    let target = _set(key, (x) => x == DataType.Number)
    if(target == undefined) {
        target = { name: key, type: DataType.Number, hidden: false, runtimeOnly: true, value: value }
    }else{
        target.value = value
    }
    para?.feedbacknumber({key:key,value:value})
}
function setstring(key:string, value:string){
    let target = _set(key, (x) => x == DataType.String)
    if(target == undefined) {
        target = { name: key, type: DataType.String, hidden: false, runtimeOnly: true, value: value }
    }else{
        target.value = value
    }
    para?.feedbackstring({key:key,value:value})
}
function setobject(key:string, value:any){
    let target = _set(key, (x) => x == DataType.Object)
    if(target == undefined) {
        target = { name: key, type: DataType.Object, hidden: false, runtimeOnly: true, value: value }
    }else{
        target.value = value
    }
    para?.feedbackobject({key:key,value:value})
}
function setlist(key:string, value:Array<string>){
    let target = _set(key, (x) => x == DataType.List)
    if(target == undefined) {
        target = { name: key, type: DataType.List, hidden: false, runtimeOnly: true, value: value }
    }else{
        target.value = value
    }
    para?.feedbackobject({key:key,value:value})
}
function setselect(key:string, value:number){
    const target = _set(key, (x) => x == DataType.Select)
    if(target == undefined) return
    
    target.value = value
    para?.feedbackobject({key:key,value:value})
}
//#endregion

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
            plugin_exec: this.plugin_exec,
            plugin_command: this.plugin_command,
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
            has: has,
            get: get,
            set: set,

            hasboolean: hasboolean, 
            getboolean: getboolean, 
            setboolean: setboolean,

            hasnumber: hasnumber, 
            getnumber: getnumber, 
            setnumber: setnumber,

            hasstring: hasstring, 
            getstring: getstring, 
            setstring: setstring,

            hasobject: hasobject, 
            getobject: getobject, 
            setobject: setobject,

            haslist: haslist, 
            getlist: getlist, 
            setlist: setlist,

            hasselect: hasselect, 
            getselect: getselect, 
            getsleectlength: getselectlendth,
            setselect: setselect,
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
    JavascriptExecuteWithLib = (javascript:string, libs:Array<string>, log?:Messager):Promise<any> => {
        waiting = 0
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
        script += javascript
        const r = safeEval(script, context)

        let time = -1
        return new Promise<any>((resolve) => {
            let handle:any = undefined
            handle = setInterval(() => {
                if(waiting == 0 && time > 1){
                    clearInterval(handle)
                    resolve(r)
                }
                time = time +1
            }, 100);
        })
    }

    /**
     * Running js
     * @param js js script text
     * @returns Calcuate result
     */
    JavascriptExecute = (javascript:string, log?:Messager):Promise<any> => {
        waiting = 0
        let context = this.getJavascriptEnv(JavascriptLib.OS | JavascriptLib.MESSAGE | JavascriptLib.HTTP | JavascriptLib.PATH, log)
        let result = 0
        context = Object.assign(context, { result: result })
        let script = ''
        script += javascript
        const r = safeEval(script, context)

        let time = -1
        return new Promise<any>((resolve) => {
            let handle:any = undefined
            handle = setInterval(() => {
                if(waiting == 0 && time > 1){
                    clearInterval(handle)
                    resolve(r)
                }
                time = time +1
            }, 100);
        })
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
            },
            math: {
                floor: Math.floor,
                abs: Math.abs,
                round: Math.round,
                ceil: Math.ceil,
                PI: Math.PI,
                E: Math.E,
                pow: Math.pow,
                random: Math.random,
                max: Math.max,
                min: Math.min,
                trunc: Math.trunc,
                log: Math.log,
                log10: Math.log10,
                log2: Math.log2,
                exp: Math.exp,
                expm1: Math.expm1,
                sin: Math.sin,
                sinh: Math.sinh,
                cos: Math.cos,
                cosh: Math.cosh,
                tan: Math.tan,
                tanh: Math.tanh,
                asin: Math.asin,
                asinh: Math.asinh,
                acos: Math.acos,
                acosh: Math.acosh,
                atan: Math.atan,
                atanh: Math.atanh,
                atan2: Math.atan2,
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
        waiting += 1
        clientos?.command_exec(command, args, cwd)
        waiting -= 1
    }
    private command(command:string, args:string, cwd?:string){
        waiting += 1
        return clientos?.command_sync(command, args, cwd).then(() => {
            waiting -= 1
        }).catch(() => {
            waiting -= 1
        })
    }
    private plugin_exec(command:string, args:string){
        waiting += 1
        const cwd = path.join(os.homedir(), DATA_FOLDER, 'exe')
        const cc = process.platform == "win32" ? command : "./" + command
        clientos?.command_exec(cc, args, cwd)
        waiting -= 1
    }
    private plugin_command(command:string, args:string){
        waiting += 1
        const cwd = path.join(os.homedir(), DATA_FOLDER, 'exe')
        const cc = process.platform == "win32" ? command : "./" + command
        return clientos?.command_sync(cc, args, cwd).then(() => {
            waiting -= 1
        }).catch(() => {
            waiting -= 1
        })
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
        return clientos?.fs_exist({path:path}) ?? false
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