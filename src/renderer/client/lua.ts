import * as luainjs from 'lua-in-js';
import { DataType, Job, Libraries, LuaLib, Messager, Parameter } from '../interface';
import { ClientOS } from './os';
import { ClientParameter } from './parameter';

//#region Global
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
let messager_log: Messager
let clientos:ClientOS | undefined
let para:ClientParameter | undefined = undefined

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
    
    messager_log(`[Boolean feedback] ${key} = ${value}`, getjob?.()?.uuid ?? '')
    para?.feedbackboolean({key:key,value:value})
}
function setnumber(key:string, value:number){
    if(key == 'ck') {
        messager_log("Trying to set a constant ck...", getjob?.()?.uuid ?? '')
        return
    }
    const p = getpara?.() ?? undefined
    if(p == undefined) return
    const target = p.containers.find(x => x.name == key && x.type == DataType.Number)
    if(target == undefined && !p.canWrite) return
    if(target != undefined) target.value = value
    messager_log(`[Number feedback] ${key} = ${value}`, getjob?.()?.uuid ?? '')
    para?.feedbacknumber({key:key,value:value})
}
function setstring(key:string, value:string){
    const p = getpara?.() ?? undefined
    if(p == undefined) return
    const target = p.containers.find(x => x.name == key && x.type == DataType.String)
    if(target == undefined && !p.canWrite) return
    if(target != undefined) target.value = value
    messager_log(`[String feedback] ${key} = ${value}`, getjob?.()?.uuid ?? '')
    para?.feedbackstring({key:key,value:value})
}
//#endregion

export class ClientLua {
    os:luainjs.Table
    env:luainjs.Table
    message:luainjs.Table

    constructor(_messager: Messager, _messager_log: Messager, _getjob:Getjob){
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
            "messager": (m, t) => _messager(m, _getjob()?.uuid), 
            "messager_log": (m, t) => _messager_log(m, _getjob()?.uuid)
        })
    }

    static Init = (_messager: Messager, _messager_log: Messager, _clientos:ClientOS, _para:ClientParameter, _getlib:Getlib, _getpara:Getpara, _getjob:Getjob) => {
        messager = (m, t) => _messager(m, _getjob()?.uuid)
        messager_log = (m, t) => _messager_log(m, _getjob()?.uuid)
        clientos = _clientos
        para = _para
        getlib = _getlib
        getpara = _getpara
        getjob = _getjob
    }

    LuaExecuteWithLib = (lua:string, libs:Array<string>) => {
        const luaEnv = this.getLuaEnv()
        try {
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
        }catch(err){
            throw err
        }
    }

    LuaExecute = (lua:string) => {
        const luaEnv = this.getLuaEnv(LuaLib.OS | LuaLib.MESSAGE)
        try {
            let script = lib + '\n' + lua
            const execc = luaEnv.parse(script)
            const r = execc.exec()
            return r
        }catch(err){
            throw err
        }
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
