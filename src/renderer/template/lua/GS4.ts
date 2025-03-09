// 準備資料夾 跟製作準備 colmap 資料夾結構
export const FUNIQUE_GS4_PREPARE:string = `
m.messager("Env Init")

local root = env.getstring("root")
local prepare_folder = env.getstring("prepare")
local before_folder = env.getstring("before")
local after_folder = env.getstring("after")
local output_folder = env.getstring("output")

local start_at_zero = env.getboolean("start_at_0")
local iframe_gap = env.getnumber("iframe_gap")
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

local minus = 0

if start_at_zero then
    minus = 1
end

local frame_size = 0
if cam_size > 0 then
    local f1_files = split(o.listfile(root.."/"..prepare_folder.."/"..CAM.."/"..prepare_folders[1]), "\\n")
    frame_size = #(f1_files)
end
m.messager("Get Frame count: "..frame_size)

m.messager("Copy sparse folder")
o.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_folder.."/"..sparse)

for key=1,frame_size,1 do
    o.createdir(root.."/"..before_folder.."/"..tostring(key - minus).."/images")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_folder.."/"..tostring(key - minus).."/images/"..string.format("%04d", key2)..".jpg"
        o.copyfile(from, to)
        m.messager_log("Copy file: '"..from.."'   to  '"..to.."'")
    end
end

env.setnumber("frameCount", frame_size)
env.setnumber("iframe_size", math.ceil(frame_size / iframe_gap))
`

// 分成 4 個資寮夾
export const FUNIQUE_GS4_BLEND_PREPARE:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local iframe_size = env.getnumber("iframe_size")
local group_size = env.getnumber("group_size")
local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")
local start_at_zero = env.getboolean("start_at_0")

local current = 1
local xx = 1

if start_at_zero then
    xx = 0
end

for i=1,blend,1 do
    -- Folder name: BLEND_0_I, BLEND_5_I, BLEND_10_I
    local path = root.."/"..after_folder.."/".."BLEND_"..tostring((i - 1) * iframe_gap).."_I/checkpoint"
    m.messager("Create folder: "..path)
    o.createdir(path)
end

for i=1,iframe_size,1 do
    local foldername = tostring((i - 1) * iframe_gap + xx)
    local from = root.."/"..after_folder.."/GOP_20_I/checkpoint/"..foldername
    local to = root.."/"..after_folder.."/".."BLEND_"..tostring((current - 1) * iframe_gap).."_I/checkpoint/"..foldername
    o.copydir(from, to)

    current = current + 1
    if current > blend then
        current = 1
    end
end
`

// 將 Blend 結果弄成結果資料夾
// output/Sequence_0/1.ply
// output/Sequence_0/2.ply
export const FUNIQUE_GS4_PLYDone:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local output_folder = env.getstring("output")

local start_at_zero = env.getboolean("start_at_0")
local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")

o.createdir(output_folder.."/final")
o.createdir(output_folder.."/trans")

for i=1,blend,1 do
    local output_folder_seq = output_folder.."/raw/Sequence_"..tostring( (i-1) * iframe_gap )
    local source_folder = root.."/"..after_folder.."/".."BLEND_"..tostring((i - 1) * iframe_gap).."_I/checkpoint"
    o.createdir(output_folder_seq)

    local allfolder = split(o.listdir(source_folder), "\\n")
    local count = 0

    for key,value in pairs(allfolder) do
        local prefix = source_folder.."/"..value.."/point_cloud/"
        local suffix = "/point_cloud.ply"
        local plyPaths = { 
            prefix.."iteration_7000"..suffix, 
            prefix.."iteration_500"..suffix 
        }
        local exists = { 
            o.exist(plyPaths[1]), 
            o.exist(plyPaths[2]) 
        }
        for key2,value2 in pairs(exists) do
            if value2 then
                o.copyfile(plyPaths[key2], output_folder_seq.."/"..value..".ply")
                count = count + 1
                goto finish
            end
        end
        ::finish::
    end

    m.messager_log("Total file copy: "..tostring(count)..", to path: "..output_folder_seq)
end
`

