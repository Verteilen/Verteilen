export const DEFAULT = "// Enter your lua code here.."

// 準備資料夾 跟製作準備 colmap 資料夾結構
export const FUNIQUE_GS4_PREPARE:string = `
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
    o.createdir(root.."/"..before_folder.."/"..tostring(key - 1).."/images")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_folder.."/"..tostring(key - 1).."/images/"..string.format("%04d", key2)..".jpg"
        o.copyfile(from, to)
        m.messager_log("Copy file: '"..from.."'   to  '"..to.."'")
    end
end

env.setnumber("frameCount", frame_size)
`

// 計算有多少 IFrame
export const FUNIQUE_GS4_IFRAMEFOLDER:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")

local p = root.."/"..after_folder.."/GOP_20_I/checkpoint"
local result = 0

m.messager("Get CAM list")
local iframe_folders = split(o.listdir(p), "\\n")
local iframeCount = #(iframe_folders)


for key,value in pairs(iframe_folders) do
    local e = root.."/"..value.."/point_cloud"
    local hasFolder = o.exist(e)
    if hasFolder then
        result = result + 1
    end
end

m.messager("Get IFrame count: "..tostring(result))
env.setnumber("iframe_size", result)
`

// 分成 4 個資寮夾
export const FUNIQUE_GS4_BLEND_PREPARE:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local iframe_size = env.getnumber("iframe_size")
local group_size = env.getnumber("group_size")
local blend = env.getnumber("blend")

local step = math.round(group_size / blend)
local current = 1

for i=1,step,1 do
    local path = root.."/"..after_folder.."/".."BLEND_"..string.format("%2d", (i - 1) * step).."_I"
    m.messager("Create folder: "..path)
    o.createdir(path)
end

for i=1,iframe_size,1 do
    local from = root.."/"..after_folder.."/GOP_20_I/"..tostring(i-1)
    local to = root.."/"..after_folder.."/".."BLEND_"..string.format("%2d", (current - 1) * step).."_I"
    o.copydir(from, to)

    current = current + 1
    if current > step then
        current = 1
    end
end
`

// 分正負
export const FUNIQUE_GS4_COPY:string = `
local root = env.getstring("root")
local before_sort_folder = env.getstring("before_sort")
local before_folder = env.getstring("before")
local iframe_gap = env.getnumber("iframe_gap")
local frame_count = env.getnumber("frameCount")
local group_size = env.getnumber("group_size")
local blend = env.getnumber("blend")

local z = 1
local p = 1
local n = 1

m.messager("Copy dir to position or negative folder")
local from = ""
local to = ""
for i=1,frame_count,group_size do
    local step = ((group_size / 2) * (z - 1))

    from = root.."/"..before_sort_folder.."/"..tostring(i)
    to = root.."/"..before_p_folder.."/"..tostring(i - step)
    o.copydir(from, to)

    p = p + 1
    n = n + 1

    for j = 1,(group_size/2)-1,1 do
        if i + j > frame_count then 
            n = n - 1
            goto skip 
        end
        local r = p
        from = root.."/"..before_sort_folder.."/"..tostring(i+j)
        to = root.."/"..before_p_folder.."/"..tostring(r)
        o.copydir(from, to)
        p = p + 1
    end
    
    for j = 1,(group_size/2)-1,1 do
        if i + j > frame_count then 
            n = n - 1
            goto skip 
        end
        local nj = group_size/2 - j
        local r = nj + i - step
        from = root.."/"..before_sort_folder.."/"..tostring(i+j+9)
        to = root.."/"..before_n_folder.."/"..tostring(r)
        o.copydir(from, to)
        n = n + 1
    end

    from = root.."/"..before_sort_folder.."/"..tostring(i + group_size - 1)
    to = root.."/"..before_n_folder.."/"..tostring(i - step)
    o.copydir(from, to)

    z = z + 1
end

::skip::

env.setnumber("p_size", p - 1)
env.setnumber("n_size", n - 1)

`

// 將 Blend 結果弄成結果資料夾
export const FUNIQUE_GS4_PLYDone:string = `

`
