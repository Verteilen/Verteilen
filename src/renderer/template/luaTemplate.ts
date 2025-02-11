export const DEFAULT = "// Enter your lua code here..."

export const FUNIQUE_GS4_PREPARE:string = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

m.messager("Env Init")

local root = env.getstring("root")
local prepare_folder = env.getstring("prepare")
local before_folder = env.getstring("before")
local after_folder = env.getstring("after")
local output_folder = env.getstring("output")

local CAM = env.getstring("CAM")
local images = env.getstring("images")
local sparse = env.getstring("sparse")

o.deletedir(root.."/"..before_folder)
o.deletedir(root.."/"..after_folder)
o.deletedir(output_folder)
o.createdir(root.."/"..before_folder)
o.createdir(root.."/"..after_folder)
o.createdir(output_folder)

m.messager("Get CAM list")
local prepare_folders = split(o.listdir(root.."/"..prepare_folder.."/"..CAM), "\\n")

local cam_size = #(prepare_folders)
m.messager("Get CAM count: "..cam_size)

local frame_size = 0
if cam_size > 0 then
    local f1_files = split(o.listfile(root.."/"..prepare_folder.."/"..CAM.."/"..prepare_folders[1]), "\\n")
    frame_size = #(f1_files)
end
m.messager("Get Frame count: "..frame_size)

m.messager("Copy sparse folder")
o.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_folder.."/"..sparse)

for key=1,frame_size,1 do
    o.createdir(root.."/"..before_folder.."/"..tostring(key).."/images")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_folder.."/"..tostring(key).."/images/"..string.format("%04d", key2)..".jpg"
        o.copyfile(from, to)
    end
end

env.setnumber("frameCount", frame_size)

`

export const FUNIQUE_GS4_DENOISE:string = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

local root = env.getstring("root")
local after_folder = env.getstring("after")
local ck = env.getstring("ck")

local path = root.."/"..after_folder.."/GOP20_I/"..tostring(ck).."/point_cloud/iteration_7000/ascii.ply"
m.messager_log("Load: "..path)

local data = o.readfile(path)

`

export const FUNIQUE_GS4_IFRAMEFOLDER:string = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

local root = env.getstring("root")
local after_folder = env.getstring("after")

m.messager("Get CAM list")
local iframe_folders = split(o.listdir(root.."/"..after_folder.."/".."GOP20_I"), "\\n")

local iframeCount = #(iframe_folders)
m.messager("Get IFrame count: "..iframeCount)

for key,value in pairs(iframe_folders) do
    local from = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(value)
    local to = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(key)
    o.rename(from, to)
end

env.setnumber("iframeCount", iframeCount)

`

export const FUNIQUE_GS4_IFRAMEFOLDER_DONE:string = `function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

local root = env.getstring("root")
local after_folder = env.getstring("after")
local iframe_gap = env.getnumber("iframe_gap")

m.messager("Get CAM list")
local iframe_folders = split(o.listdir(root.."/"..after_folder.."/".."GOP20_I"), "\\n")

local iframeCount = #(iframe_folders)
m.messager("Get IFrame count: "..iframeCount)

for key,value in pairs(iframe_folders) do
    local from = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(value)
    local to = root.."/"..after_folder.."/"..tostring(key * iframe_gap)
    o.copydir(from, to)
end
o.deletedir(root.."/"..after_folder.."/".."GOP20_I")
`