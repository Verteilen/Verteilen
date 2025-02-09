

export const DEFAULT = "// Enter your lua code here..."

export const FUNIQUE_GS4_V1:string = `
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

local CAM = env.getstring("CAM")
local images = env.getstring("images")
local sparse = env.getstring("sparse")

os2.deletedir(root.."/"..before_folder)

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
    os2.createdir(root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key))
    os2.createdir(root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key).."/".."out")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_folder.."/"..CAM.."/C"..string.format("%06d", key).."/"..string.format("%04d", key2)..".jpg"
        os2.copyfile(from, to)
    end
end

env.setnumber("frameCount", frame_size)

`