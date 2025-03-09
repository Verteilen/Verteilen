// 把 Colmap 複製並且反過來擺
export const FUNIQUE_GS4_V2_COLMAP_COPY:string = `
local root = env.getstring("root")
local before = env.getstring("before")
local before_n = env.getstring("before_n")
local before_p = env.getstring("before_p")
local frame_size = env.getnumber("frameCount")

m.messager("Create before positive and negative folder")
o.createdir(root.."/"..before_n)
o.createdir(root.."/"..before_p)

`

// 分成 8 個資寮夾
export const FUNIQUE_GS4_V2_BLEND_PREPARE:string = `
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