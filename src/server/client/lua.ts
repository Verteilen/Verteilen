import * as luainjs from 'lua-in-js';
import { ClientExecute } from './execute';
import { ClientOS } from './os';
import { ClientParameter } from './parameter';

const lib = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end
`

export class ClientLua {
    clientos:ClientOS
    para:ClientParameter
    os:luainjs.Table
    env:luainjs.Table
    message:luainjs.Table
    messager: Function
    messager_log: Function

    execute:ClientExecute | undefined

    constructor(_messager: Function, _messager_log: Function, _clientos:ClientOS, _para:ClientParameter){
        this.clientos = _clientos
        this.para = _para
        this.messager = _messager
        this.messager_log = _messager_log

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
            "hasboolean": this.hasboolean, 
            "getboolean": this.getboolean, 
            "setboolean": this.setboolean,

            "hasnumber": this.hasnumber, 
            "getnumber": this.getnumber, 
            "setnumber": this.setnumber,

            "hasstring": this.hasstring, 
            "getstring": this.getstring, 
            "setstring": this.setstring,
        })
        
        this.message = new luainjs.Table({
            "messager": this.messager, 
            "messager_log": this.messager_log
        })
    }

    LuaExecuteWithLib = (lua:string, libs:Array<string>) => {
        const luaEnv = this.getLuaEnv()
        try {
            let script = ""
            libs.forEach(x => {
                if(this.execute?.libraries == undefined) return
                const p = this.execute.libraries!.libs.find(y => y.name == x)
                if(p != undefined) script += ("\n" + p.content + "\n")
            })
            script = lib + lua
            const execc = luaEnv.parse(script)
            const r = execc.exec()
            return r
        }catch(err){
            throw err
        }
    }

    LuaExecute = (lua:string) => {
        const luaEnv = this.getLuaEnv()
        try {
            let script = lib + lua
            const execc = luaEnv.parse(script)
            const r = execc.exec()
            return r
        }catch(err){
            throw err
        }
    }

    private getLuaEnv(){
        const luaEnv = luainjs.createEnv()
        luaEnv.loadLib('o', this.os)
        luaEnv.loadLib('env', this.env)
        luaEnv.loadLib('m', this.message)
        return luaEnv
    }

    private copyfile(from:string, to:string){
        this.clientos.file_copy({from:from,to:to})
    }
    private copydir(from:string, to:string){
        this.clientos.dir_copy({from:from,to:to})
    }
    private deletefile(path:string){
        this.clientos.file_delete({path:path})
    }
    private deletedir(path:string){
        this.clientos.dir_delete({path:path})
    }
    private rename(from:string, to:string){
        return this.clientos.rename({from:from, to:to})
    }
    private exist(path:string){
        return this.clientos.fs_exist({path:path})
    }
    private listfile(path:string){
        return this.clientos.dir_files({path:path}).join('\n')
    }
    private listdir(path:string){
        return this.clientos.dir_dirs({path:path}).join('\n')
    }
    private createdir(path:string){
        this.clientos.dir_create({path:path})
    }
    private writefile(path:string, data:string){
        this.clientos.file_write({ from: path, to: data })
    }
    private readfile(path:string){
        return this.clientos.file_read({path:path})
    }
    private hasboolean(key:string){
        if(this.execute?.parameter == undefined) return false
        return this.execute.parameter.booleans.findIndex(x => x.name == key) != -1
    }
    private hasnumber(key:string){
        if(this.execute?.parameter == undefined) return false
        return this.execute.parameter.numbers.findIndex(x => x.name == key) != -1
    }
    private hasstring(key:string){
        if(this.execute?.parameter == undefined) return false
        return this.execute.parameter.strings.findIndex(x => x.name == key) != -1
    }
    private getboolean(key:string){
        if(this.execute?.parameter == undefined) return false
        return this.execute.parameter.booleans.find(x => x.name == key)?.value ?? false
    }
    private getnumber(key:string){
        if(this.execute?.parameter == undefined) return 0
        return this.execute.parameter.numbers.find(x => x.name == key)?.value ?? 0
    }
    private getstring(key:string){
        if(this.execute?.parameter == undefined) return ""
        return this.execute.parameter.strings.find(x => x.name == key)?.value ?? ""
    }
    private setboolean(key:string, value:boolean){
        if(this.execute?.parameter == undefined) return
        const target = this.execute.parameter.booleans.find(x => x.name == key)
        if(target == undefined) return
        target.value = value
        this.messager_log(`[布林參數回饋] ${key} = ${value}`)
        this.para.feedbackboolean({key:key,value:value})
    }
    private setnumber(key:string, value:number){
        if(this.execute?.parameter == undefined) return
        const target = this.execute.parameter.numbers.find(x => x.name == key)
        if(target == undefined) return
        target.value = value
        this.messager_log(`[數字參數回饋] ${key} = ${value}`)
        this.para.feedbacknumber({key:key,value:value})
    }
    private setstring(key:string, value:string){
        if(this.execute?.parameter == undefined) return
        const target = this.execute.parameter.strings.find(x => x.name == key)
        if(target == undefined) return
        target.value = value
        this.messager_log(`[字串參數回饋] ${key} = ${value}`)
        this.para.feedbackstring({key:key,value:value})
    }
}
