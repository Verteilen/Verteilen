// 把 Colmap 複製成 blend * 2 正負序列
export const FUNIQUE_GS4_V2_COLMAP_COPY:string = `
local root = env.getstring("root")
local before = env.getstring("before")
local after = env.getstring("after")
local iframe_gap = env.getnumber("iframe_gap")
local frame_size = env.getnumber("frameCount")
local blend = env.getnumber("blend")
local group_size = env.getnumber("group_size")

local even = group_size % 2 == 0
local gap_p = 0
local gap_n = 0
local p_count = 0
local n_count = 0
local from = ""
local xx = 1

if start_at_zero then
    xx = 0
end

if event then
    gap_p = group_size / 2
    gap_n = group_size / 2 - 1
else
    gap_p = (group_size - 1) / 2
    gap_n = (group_size - 1) / 2
end

function copy_to_positive()
    local to = p_folder.."/"..tostring(p_count)
    o.copydir(from, to)
    p_count = p_count + 1
end

function copy_to_negative()
    local to = n_folder.."/"..tostring(n_count)
    o.copydir(from, to)
    n_count = n_count + 1
end

for i=1,blend,1 do
    -- Folder name: DATASET_P_0, DATASET_P_5, DATASET_P_10
    local p_folder = root.."/"..after.."/".."DATASET_P_"..tostring( (i-1) * iframe_gap)    
    o.createdir(p_folder)

    local starter = ((i - 1) * iframe_gap) + xx
    p_count = starter
    
    for j=starter,frame_size,1 do
        from = root.."/"..before.."/"..tostring(j)
        local gap = j % group_size

        if gap <= (gap_p + 1) then
            copy_to_positive()
        end
    end
end

for i=1,blend,1 do
    -- Folder name: DATASET_N_0, DATASET_N_5, DATASET_N_10
    local n_folder = root.."/"..after.."/".."DATASET_N_"..tostring( (i-1) * iframe_gap)
    o.createdir(n_folder)

    local starter = ((i - 1) * iframe_gap) + xx
    bool hit = false
    n_count = starter

    for j=frame_size,starter,-1 do
        from = root.."/"..before.."/"..tostring(j)
        local gap = j % group_size

        if gap == 1 then
            hit = true
        end

        if gap > (gap_p + 1) and hit then
            copy_to_negative()
        end
    end
end
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

-- current value [1, 2, 3, 4]
local current = 1
local xx = 1

if start_at_zero then
    xx = 0
end

for i=1,blend,1 do
    -- Folder name: BLEND_0_IP, BLEND_5_IP, BLEND_10_IP
    -- Folder name: BLEND_0_IN, BLEND_5_IN, BLEND_10_IN
    local path1 = root.."/"..after_folder.."/".."BLEND_"..tostring((i - 1) * iframe_gap).."_IP/checkpoint"
    local path2 = root.."/"..after_folder.."/".."BLEND_"..tostring((i - 1) * iframe_gap).."_IN/checkpoint"
    m.messager("Create folder: "..path1)
    m.messager("Create folder: "..path2)
    o.createdir(path1)
    o.createdir(path2)
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