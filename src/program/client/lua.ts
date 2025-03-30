/**
 * Lua module cannot handle methods which in the class\
 * In order to crack this issue, I put everything in the global scope\
 * But spawn the thread on the cluster processes\
 * 
 * This might cost more resources to work, But it won't throw error... so
 */
import * as luainjs from 'lua-in-js';
import { DataType, Job, Libraries, LuaLib, Messager, Messager_log, Parameter } from '../interface';
import { ClientJobParameter } from './job_parameter';
import { ClientOS } from './os';

//#region Global
/**
 * The build-in methods for lua
 */
const lib = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end
`

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

const tag = () => getjob?.()?.uuid ?? 'unknown'
const runtime = () => getjob?.()?.runtime_uuid ?? 'unknown'

//#region Parameters
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

/**
 * The lua runner
 */
export class ClientLua {
    os:luainjs.Table
    env:luainjs.Table
    message:luainjs.Table

    constructor(_messager: Messager, _messager_log: Messager_log, _getjob:Getjob){
        this.os = new luainjs.Table({
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
        })
        
        this.env = new luainjs.Table({
            "hasboolean": hasboolean, 
            "getboolean": getboolean, 
            "setboolean": setboolean,

            "hasnumber": hasnumber, 
            "getnumber": getnumber, 
            "setnumber": setnumber,

            "hasstring": hasstring, 
            "getstring": getstring, 
            "setstring": setstring,
        })
        
        this.message = new luainjs.Table({
            "messager": (m:string) => _messager(m, tag()), 
            "messager_log": (m:string) => _messager_log(m, tag(), runtime())
        })
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
    LuaExecuteWithLib = (lua:string, libs:Array<string>) => {
        const luaEnv = this.getLuaEnv()
        let script = lib + '\n'

        const p = getlib?.() ?? undefined
        if(p != undefined){
            libs.forEach(x => {
                const t = p.libs.find(y => y.name == x)
                if(t != undefined) script += ("\n" + t.content + "\n")
            })
        }
        
        script += ('\n' + lua)
        const execc = luaEnv.parse(script)
        const r = execc.exec()
        return r
    }

    /**
     * Running lua
     * @param lua Lua script text
     * @returns Calcuate result
     */
    LuaExecute = (lua:string) => {
        const luaEnv = this.getLuaEnv(LuaLib.OS | LuaLib.MESSAGE)
        let script = lib + '\n' + lua
        const execc = luaEnv.parse(script)
        const r = execc.exec()
        return r
    }

    private getLuaEnv(flags:LuaLib = LuaLib.ALL){
        const luaEnv = luainjs.createEnv()
        if((flags & LuaLib.OS) == LuaLib.OS) luaEnv.loadLib('o', this.os)
        if((flags & LuaLib.ENV) == LuaLib.ENV) luaEnv.loadLib('env', this.env)
        if((flags & LuaLib.MESSAGE) == LuaLib.MESSAGE) luaEnv.loadLib('m', this.message)
        return luaEnv
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
