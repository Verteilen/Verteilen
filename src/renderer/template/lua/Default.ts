export const DEFAULT_LuaExample:string = `
m.messager_log("Hello World!")
`

export const DEFAULT_LuaCronMultiExample:string = `
local id = env.getnumber('ck')
m.messager_log("Hello World from "..tostring(id))
`

export const DEFAULT_LuaSaveExample:string = `
local id = env.getnumber('ck')

local key = "KEY_"..tostring(id)

env.setnumber(key, id * 5)

m.messager_log("Set keyvalue: ["..tostring(key)..", "..tostring(id*5).."]")
`

export const DEFAULT_LuaPrintExample:string = `
local id = env.getnumber('ck')

local key = "KEY_"..tostring(id)

local value = env.getnumber(key)

m.messager_log("Print keyvalue: ["..tostring(key)..", "..tostring(value).."]")
`