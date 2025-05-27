export const FUNIQUE_GS4_PLYDone_V2:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local group_size = env.getnumber("group_size")
local output_folder = env.getstring("output")
local frame_size = env.getnumber("frameCount")

local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")

local gap_p = env.getnumber("gop_positive")
local gap_n = env.getnumber("gop_negative")

local iframe_iteration = env.getnumber("iframe_iteration")
local finetune_iteration = env.getnumber("finetune_iteration")

-- current value [1, 2, 3, 4]
o.createdir(output_folder.."/final")
o.createdir(output_folder.."/trans")

function copyToTarget(src, output)
    local prefix = src.."/point_cloud/"
    local suffix = "/point_cloud.ply"
    local plyPaths = { 
        prefix.."iteration_"..tostring(iframe_iteration)..suffix, 
        prefix.."iteration_"..tostring(finetune_iteration)..suffix 
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
    local starter = (step * iframe_gap) + 1
    o.createdir(output_folder_seq)
    local count = 0

    -- Positive
    source_folder = source_root_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IP/checkpoint"
    allfolder = split(o.listdir(source_folder), "\\n")
    m.messager_log("total file: "..tostring(#(allfolder)).." in "..source_folder)
    
    for key,value in pairs(allfolder) do
        if tonumber(value) ~= nil then
            local n = tonumber(value - step * iframe_gap)
            local rec = (n - 1) % (gap_p + 1)
            local times = math.ceil(n / (gap_p + 1))
            local r = tostring(group_size * (times - 1) + rec + 1 + (step * iframe_gap))
            local src = source_folder.."/"..value
            local output = output_folder_seq.."/"..r..".ply"
            copyToTarget(src, output)
            count = count + 1
        end
    end


    -- Negative
    source_folder = source_root_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint"
    allfolder = split(o.listdir(source_folder), "\\n")
    m.messager_log("total file: "..tostring(#(allfolder)).." in "..source_folder)
    local c_starter = math.floor((frame_size - 1) / group_size) * group_size + 1 + (step * iframe_gap)

    if c_starter > frame_size then
        c_starter = c_starter - group_size
    end

    for key,value in pairs(allfolder) do
        if tonumber(value) ~= nil then
            local n = tonumber(value - step * iframe_gap)
            local rec = (n - 1) % (gap_n + 1)
            local times = math.ceil(n / (gap_n + 1))
            local r = tostring( c_starter - ((n + (times - 1) * gap_p) - 1) )
            local src = source_folder.."/"..value
            local output = output_folder_seq.."/"..r..".ply"
            copyToTarget(src, output)
            count = count + 1
        end
    end

    m.messager_log("Total file copy: "..tostring(count)..", to path: "..output_folder_seq)
end
`