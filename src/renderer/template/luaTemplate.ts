

export const DEFAULT = "// Enter your lua code here..."

export const FUNIQUE_GS4_PREPARE:string = `
function split(s, sep)
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

os2.deletedir(root.."/"..before_folder)
os2.deletedir(root.."/"..after_folder)
os2.deletedir(root.."/"..output_folder)
os2.createdir(root.."/"..before_folder)
os2.createdir(root.."/"..after_folder)
os2.createdir(root.."/"..output_folder)

m.messager("Get CAM list")
local prepare_folders = split(os2.listdir(root.."/"..prepare_folder.."/"..CAM), "\\n")

local cam_size = #(prepare_folders)
m.messager("Get CAM count: "..cam_size)

local frame_size = 0
if cam_size > 0 then
    local f1_files = split(os2.listfile(root.."/"..prepare_folder.."/"..CAM.."/"..prepare_folders[1]), "\\n")
    frame_size = #(f1_files)
end
m.messager("Get Frame count: "..frame_size)

m.messager("Create Prepare folder: "..root.."/"..before_folder.."/"..CAM)
os2.createdir(root.."/"..before_folder.."/"..CAM)

m.messager("Copy sparse folder")
os2.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_folder.."/"..sparse)

for key=1,frame_size,1 do
    os2.createdir(root.."/"..before_folder.."/"..tostring(key - 1).."/images")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2 - 1).."/"..string.format("%04d", key2 - 1).."_"..string.format("%06d", key - 1)..".jpg"
        local to = root.."/"..before_folder.."/"..tostring(key - 1).."/images/"..string.format("%04d", key2)..".jpg"
        os2.copyfile(from, to)
    end
end

env.setnumber("frameCount", frame_size)

`

export const FUNIQUE_GS4_DENOISE:string = `

`

export const FUNIQUE_GS4_IFRAMEFOLDER:string = `
function split(s, sep)
    local fields = {}
    local sep = sep or " "
    local pattern = string.format("([^%s]+)", sep)
    string.gsub(s, pattern, function(c) fields[#fields + 1] = c end)
    return fields
end

local root = env.getstring("root")
local after_folder = env.getstring("after")

m.messager("Get CAM list")
local iframe_folders = split(os2.listdir(root.."/"..after_folder.."/".."GOP20_I"), "\\n")

local iframeCount = #(iframe_folders)
m.messager("Get IFrame count: "..iframeCount)

for key,value in pairs(iframe_folders) do
    local from = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(value)
    local to = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(key)
    os2.rename(from, to)
end

env.setnumber("iframeCount", iframeCount)

`

export const FUNIQUE_GS4_IFRAMEFOLDER_DONE:string = `
function split(s, sep)
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
local iframe_folders = split(os2.listdir(root.."/"..after_folder.."/".."GOP20_I"), "\\n")

local iframeCount = #(iframe_folders)
m.messager("Get IFrame count: "..iframeCount)

for key,value in pairs(iframe_folders) do
    local from = root.."/"..after_folder.."/".."GOP20_I".."/"..tostring(value)
    local to = root.."/"..after_folder.."/"..tostring(key * iframe_gap)
    os2.copydir(from, to)
end
os2.deletedir(root.."/"..after_folder.."/".."GOP20_I")
`