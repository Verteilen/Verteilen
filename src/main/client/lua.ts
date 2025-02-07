import * as luainjs from 'lua-in-js';
import { messager_log } from '../debugger';
import { Job, Parameter } from '../interface';
import { dir_copy, dir_create, dir_delete, dir_dirs, dir_files, file_copy, file_delete, fs_exist } from './os';
import { feedbackboolean, feedbacknumber, feedbackstring } from './parameter';

let buffer:Job | undefined = undefined
let parameter:Parameter | undefined = undefined

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
function exist(path:string){
    return fs_exist({path:path})
}
function listfile(path:string){
    return dir_files({path:path})
}
function listdir(path:string){
    return dir_dirs({path:path})
}
function createdir(path:string){
    dir_create({path:path})
}
function hasboolean(key:string){
    if(parameter == undefined) return
    return parameter.booleans.findIndex(x => x.name == key) != -1
}
function hasnumber(key:string){
    if(parameter == undefined) return
    return parameter.numbers.findIndex(x => x.name == key) != -1
}
function hasstring(key:string){
    if(parameter == undefined) return
    return parameter.strings.findIndex(x => x.name == key) != -1
}
function getboolean(key:string){
    if(parameter == undefined) return
    return parameter.booleans.find(x => x.name == key)
}
function getnumber(key:string){
    if(parameter == undefined) return
    return parameter.numbers.find(x => x.name == key)
}
function getstring(key:string){
    if(parameter == undefined) return
    return parameter.strings.find(x => x.name == key)
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
})

const env = new luainjs.Table({
    hasboolean, getboolean, setboolean,
    hasnumber, getnumber, setnumber,
    hasstring, getstring, setstring,
})

const luaEnv = luainjs.createEnv()
luaEnv.loadLib('os', os)
luaEnv.loadLib('env', env)