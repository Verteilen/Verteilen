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
local p_count = 1
local n_count = 1
local from = ""
local xx = 1

if start_at_zero then
    xx = 0
    p_count = 0
    n_count = 0
end

if even then
    gap_p = group_size / 2
    gap_n = group_size / 2 - 1
else
    gap_p = (group_size - 1) / 2
    gap_n = (group_size - 1) / 2
end

env.setnumber("gop_positive", gap_p)
env.setnumber("gop_negative", gap_n)

function copy_to_positive(p_folder)
    local to = p_folder.."/"..tostring(p_count)
    o.copydir(from, to)
    p_count = p_count + 1
end

function copy_to_negative(n_folder)
    local to = n_folder.."/"..tostring(n_count)
    o.copydir(from, to)
    n_count = n_count + 1
end

for i=1,blend,1 do
    -- Folder name: DATASET_P_0, DATASET_P_5, DATASET_P_10
    local p_folder = root.."/"..after.."/".."DATASET_P_"..tostring( (i-1) * iframe_gap)    
    o.createdir(p_folder)

    -- 0 or 1
    local starter = ((i - 1) * iframe_gap) + xx
    m.messager("p_starter: "..tostring(starter))
    p_count = starter
    
    for j=starter,frame_size,1 do
        from = root.."/"..before.."/"..tostring(j)
        local gap = (j - ((i - 1) * iframe_gap) - xx) % group_size + xx

        if gap <= (gap_p + 1) then
            copy_to_positive(p_folder)
        end
    end
    -- data_p_0 data_p_1 data_p_2
    env.setnumber("data_p_"..tostring(i), p_count - 1)
end

for i=1,blend,1 do
    -- Folder name: DATASET_N_0, DATASET_N_5, DATASET_N_10
    local n_folder = root.."/"..after.."/".."DATASET_N_"..tostring( (i-1) * iframe_gap)
    o.createdir(n_folder)

    -- 0 or 1
    local starter = ((i - 1) * iframe_gap) + xx
    m.messager("n_starter: "..tostring(starter))
    local hit = false
    n_count = starter

    for k=1,frame_size - (starter - xx),1 do
        local j = frame_size - (k - xx)
        from = root.."/"..before.."/"..tostring(j)
        local gap = (j - ((i - 1) * iframe_gap) - xx - 1) % group_size + xx

        if gap == xx then
            hit = true
        end

        if gap > (gap_p) and hit then
            copy_to_negative(n_folder)
        end
    end
    -- data_n_0 data_n_1 data_n_2
    env.setnumber("data_n_"..tostring(i), n_count - 1)
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

local gap_p = env.getnumber("gop_positive")
local gap_n = env.getnumber("gop_negative")

-- current value [1, 2, 3, 4]
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
    local index = (i - 1) * iframe_gap + xx
    local step = (i - 1) % blend
    -- start from 0
    local recur = math.floor((i - 1) / blend) 
    local foldername = tostring(index)
    local from = root.."/"..after_folder.."/GOP_20_I/checkpoint/"..foldername
    local to = ""
    local to_foldername = ""

    local delta = step * iframe_gap
    recur * gap_p

    -- Positive detect
    to_foldername = tostring((recur * gap_p) + delta + xx + (recur))
    to = root.."/"..after_folder.."/".."BLEND_"..tostring(step  * iframe_gap).."_IP/checkpoint/"..to_foldername
    o.copydir(from, to)

    if i <= blend then
        goto continue
    end

    -- Negative detect
    -- N0, N1, N2
    to_foldername = "N"..tostring(recur - 1)
    to = root.."/"..after_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint/"..to_foldername
    o.copydir(from, to)

    ::continue::
end

for i=1,blend,1 do
    local step = i-1
    local folder = root.."/"..after_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint/"
    local target_folder = split(o.listdir(folder), "\n")
    local count = #(target_folder)
    local delta = step * iframe_gap

    for key,value in pairs(target_folder) do
        local from = folder..value
        -- 0, 1, 2, 3
        local rindex = (count - tonumber(string.sub(value, 2))) - 1
        local to_foldername = (rindex * gap_n) + delta + xx + rindex
        local to = folder..to_foldername

        o.rename(from, to)
    end
end
`


// 將 Blend 結果弄成結果資料夾
// output/Sequence_0/1.ply
// output/Sequence_0/2.ply
export const FUNIQUE_GS4_V2_PLYDone:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local group_size = env.getnumber("group_size")
local output_folder = env.getstring("output")
local frame_size = env.getnumber("frameCount")

local start_at_zero = env.getboolean("start_at_0")
local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")

local gap_p = env.getnumber("gop_positive")
local gap_n = env.getnumber("gop_negative")

-- current value [1, 2, 3, 4]
local xx = 1

if start_at_zero then
    xx = 0
end

o.createdir(output_folder.."/final")
o.createdir(output_folder.."/trans")

function copyToTarget(src, output)
    local prefix = src.."/point_cloud/"
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
            o.copyfile(plyPaths[key2], output)
            count = count + 1
            goto finish
        end
    end
    ::finish::
end

for i=1,blend,1 do
    local output_folder_seq = output_folder.."/raw/Sequence_"..tostring( (i-1) * iframe_gap )
    local source_root_folder = root.."/"..after_folder
    local source_folder = ""
    local step = i - 1
    local allfolder = {}
    local starter = (step * iframe_gap) + xx
    o.createdir(output_folder_seq)
    local count = starter

    -- Positive
    source_folder = source_root_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IP/checkpoint"
    allfolder = split(o.listdir(source_folder), "\n")
    
    for key,value in pairs(allfolder) do
        local n = tonumber(value - step * iframe_gap)
        local rec = (n - xx) % (gap_p + 1)
        local times = math.ceil(n / (gap_p + 1))
        local r = tostring(group_size * (times - 1) + rec + xx + (step * iframe_gap))
        local src = source_root_folder.."/"..value
        local output = output_folder_seq.."/"..r..".ply"
        copyToTarget(src, output)
    end


    -- Negative
    source_folder = source_root_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint"
    allfolder = split(o.listdir(source_folder), "\n")
    local c_starter = math.floor((frame_size - 1) / 20) * group_size + xx + (step * iframe_gap)

    for key,value in pairs(allfolder) do
        local n = tonumber(value)
        local rec = (n - xx) % (gap_n + 1)
        local times = math.ceil(n / (gap_n + 1))
        local r = tostring( c_starter - ((n + (times - 1) * gap_p) - xx) )
        local src = source_root_folder.."/"..value
        local output = output_folder_seq.."/"..r..".ply"
        copyToTarget(src, output)
    end

    m.messager_log("Total file copy: "..tostring(count)..", to path: "..output_folder_seq)
end
`