export const FUNIQUE_GS4_COLMAP_COPY_V2:string = `
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
    if o.exist(from) then
        o.copydir(from, to)
    end
    p_count = p_count + 1
end

function copy_to_negative(n_folder)
    local to = n_folder.."/"..tostring(n_count)
    if o.exist(from) then
        o.copydir(from, to)
    end
    n_count = n_count + 1
end

for i=1,blend,1 do
    -- Folder name: DATASET_P_0, DATASET_P_5, DATASET_P_10
    local p_folder = root.."/"..after.."/".."DATASET_P_"..tostring( (i-1) * iframe_gap)    
    o.createdir(p_folder)

    -- 0 or 1
    local starter = ((i - 1) * iframe_gap) + 1
    m.messager("p_starter: "..tostring(starter))
    p_count = starter
    
    for j=starter,frame_size,1 do
        from = root.."/"..before.."/"..tostring(j)
        local gap = (j - ((i - 1) * iframe_gap) - 1) % group_size + 1

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
    local starter = ((i - 1) * iframe_gap) + 1
    m.messager("n_starter: "..tostring(starter))
    local hit = false
    n_count = starter

    for k=1,frame_size - (starter - 1),1 do
        local j = frame_size - (k - 1 - 1)
        from = root.."/"..before.."/"..tostring(j)
        local gap = (j - ((i - 1) * iframe_gap) - 1 - 1) % group_size + 1

        if gap == 1 then
            hit = true
        end

        if gap > (gap_p) and hit then
            copy_to_negative(n_folder)
        end
    end
    -- data_n_0 data_n_1 data_n_2
    env.setnumber("data_n_"..tostring(i), n_count)
end
`