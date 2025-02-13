import * as luainjs from 'lua-in-js';
import { messager, messager_log } from './debugger';
import { parameter } from './execute';
import { dir_copy, dir_create, dir_delete, dir_dirs, dir_files, file_copy, file_delete, file_read, file_write, fs_exist, rename as re } from './os';
import { feedbackboolean, feedbacknumber, feedbackstring } from './parameter';

function copyfile(from:string, to:string){
    file_copy({from:from,to:to})
}
function copydir(from:string, to:string){
    dir_copy({from:from,to:to})
}
function deletefile(path:string){
    file_delete({path:path})
}
function deletedir(path:string){
    dir_delete({path:path})
}
function rename(from:string, to:string){
    return re({from:from, to:to})
}
function exist(path:string){
    return fs_exist({path:path})
}
function listfile(path:string){
    return dir_files({path:path}).join('\n')
}
function listdir(path:string){
    return dir_dirs({path:path}).join('\n')
}
function createdir(path:string){
    dir_create({path:path})
}
function writefile(path:string, data:string){
    file_write({ from: path, to: data })
}
function readfile(path:string){
    return file_read({path:path})
}
function hasboolean(key:string){
    if(parameter == undefined) return false
    return parameter.booleans.findIndex(x => x.name == key) != -1
}
function hasnumber(key:string){
    if(parameter == undefined) return false
    return parameter.numbers.findIndex(x => x.name == key) != -1
}
function hasstring(key:string){
    if(parameter == undefined) return false
    return parameter.strings.findIndex(x => x.name == key) != -1
}
function getboolean(key:string){
    if(parameter == undefined) return false
    return parameter.booleans.find(x => x.name == key)?.value ?? false
}
function getnumber(key:string){
    if(parameter == undefined) return 0
    return parameter.numbers.find(x => x.name == key)?.value ?? 0
}
function getstring(key:string){
    if(parameter == undefined) return ""
    return parameter.strings.find(x => x.name == key)?.value ?? ""
}
function setboolean(key:string, value:boolean){
    if(parameter == undefined) return
    const target = parameter.booleans.find(x => x.name == key)
    if(target == undefined) return
    target.value = value
    messager_log(`[布林參數回饋] ${key} = ${value}`)
    feedbackboolean({key:key,value:value})
}
function setnumber(key:string, value:number){
    if(parameter == undefined) return
    const target = parameter.numbers.find(x => x.name == key)
    if(target == undefined) return
    target.value = value
    messager_log(`[數字參數回饋] ${key} = ${value}`)
    feedbacknumber({key:key,value:value})
}
function setstring(key:string, value:string){
    if(parameter == undefined) return
    const target = parameter.strings.find(x => x.name == key)
    if(target == undefined) return
    target.value = value
    messager_log(`[字串參數回饋] ${key} = ${value}`)
    feedbackstring({key:key,value:value})
}

const os = new luainjs.Table({
    copyfile,
    copydir,
    deletefile,
    deletedir,
    exist,
    listfile,
    listdir,
    createdir,
    writefile,
    readfile,
    rename,
})

const env = new luainjs.Table({
    hasboolean, getboolean, setboolean,
    hasnumber, getnumber, setnumber,
    hasstring, getstring, setstring,
})

const message = new luainjs.Table({
    messager, messager_log
})

const luaEnv = luainjs.createEnv()
luaEnv.loadLib('o', os)
luaEnv.loadLib('env', env)
luaEnv.loadLib('m', message)

export const LuaExecute = (lua:string) => {
    try {
        const execc = luaEnv.parse(lua)
        const r = execc.exec()
    }catch(err){
        throw err
    }
}