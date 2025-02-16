export const DEFAULT = "// Enter your lua code here..."

// 準備資料夾 跟製作準備 colmap 資料夾結構
export const FUNIQUE_GS4_PREPARE:string = `
m.messager("Env Init")

local root = env.getstring("root")
local prepare_folder = env.getstring("prepare")
local before_sort_folder = env.getstring("before_sort")
local before_p_folder = env.getstring("before_p")
local before_n_folder = env.getstring("before_n")
local after_folder = env.getstring("after")
local output_folder = env.getstring("output")

local CAM = env.getstring("CAM")
local images = env.getstring("images")
local sparse = env.getstring("sparse")

o.deletedir(root.."/"..before_sort_folder)
o.deletedir(root.."/"..before_p_folder)
o.deletedir(root.."/"..before_n_folder)
o.deletedir(root.."/"..after_folder)
o.deletedir(output_folder)
o.createdir(root.."/"..before_sort_folder)
o.createdir(root.."/"..before_p_folder)
o.createdir(root.."/"..before_n_folder)
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
o.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_sort_folder.."/"..sparse)

for key=1,frame_size,1 do
    o.createdir(root.."/"..before_sort_folder.."/"..tostring(key).."/images")
    for key2=1,cam_size,1 do
        local from = root.."/"..prepare_folder.."/"..CAM.."/C"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        local to = root.."/"..before_sort_folder.."/"..tostring(key).."/images/"..string.format("%04d", key2)..".jpg"
        o.copyfile(from, to)
    end
end

env.setnumber("frameCount", frame_size)
`

// 把 colmap 結果分成 正, 反 資料夾結構
export const FUNIQUE_GS4_COPY:string = `
local root = env.getstring("root")
local before_sort_folder = env.getstring("before_sort")
local before_p_folder = env.getstring("before_p")
local before_n_folder = env.getstring("before_n")
local iframe_gap = env.getnumber("iframe_gap")
local frame_count = env.getnumber("frameCount")
local group_size = env_getnumber("group_size")

local z = 1
local p = 1
local n = 1

m.messager("Copy dir to position or negative folder")
local from = ""
local to = ""
for i=1,frame_count,group_size do
    local step = ((group_size / 2) * (z - 1))

    from = root.."/"..before_sort_folder.."/"..tostring(i)
    to = root.."/"..before_p_folder....tostring(i - step)
    o.copydir(from, to)

    p = p + 1
    n = n + 1

    for j = 1,(group_size/2)-1,1 do
        if i + j > frame_count then 
            n = n - 1
            goto skip 
        end
        local r = j + p
        from = root.."/"..before_sort_folder.."/"..tostring(i+j)
        to = root.."/"..before_p_folder....tostring(r)
        o.copydir(from, to)
    end
    
    for j = 1,(group_size/2)-1,1 do
        if i + j > frame_count then 
            n = n - 1
            goto skip 
        end
        local nj = group_size/2 - j
        local r = nj + i - step
        from = root.."/"..before_sort_folder.."/"..tostring(i+j+9)
        to = root.."/"..before_p_folder....tostring(r)
        o.copydir(from, to)
    end

    from = root.."/"..before_sort_folder.."/"..tostring(i + group_size - 1)
    to = root.."/"..before_n_folder....tostring(i - step)
    o.copydir(from, to)

    z = z + 1
end

::skip::

env.setnumber("p_size", p - 1)
env.setnumber("n_size", n - 1)

`

// 計算有多少 IFrame 正, 反
export const FUNIQUE_GS4_IFRAMEFOLDER:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")

m.messager("Get CAM list")
local iframe_folders_p = split(o.listdir(root.."/"..after_folder.."/".."GOP_P20_I"), "\\n")
local iframe_folders_n = split(o.listdir(root.."/"..after_folder.."/".."GOP_N20_I"), "\\n")

local iframeCount_p = #(iframe_folders_p)
local iframeCount_n = #(iframe_folders_n)

m.messager("Get + IFrame count: "..iframeCount_p)
m.messager("Get - IFrame count: "..iframeCount_n)

env.setnumber("p_iframe_size", iframeCount_p)
env.setnumber("n_iframe_size", iframeCount_n)
`

// 將 Blend 結果弄成結果資料夾
export const FUNIQUE_GS4_PLYDone:string = `

`
