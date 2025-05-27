// 分成 4 個資寮夾
export const FUNIQUE_GS4_BLEND_PREPARE:string = `
local root = env.getstring("root")
local after_folder = env.getstring("after")
local iframe_size = env.getnumber("iframe_size")
local group_size = env.getnumber("group_size")
local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")

local current = 1


for i=1,blend,1 do
    -- Folder name: BLEND_0_I, BLEND_5_I, BLEND_10_I
    local path = root.."/"..after_folder.."/".."BLEND_"..tostring((i - 1) * iframe_gap).."_I/checkpoint"
    m.messager("Create folder: "..path)
    o.createdir(path)
end

for i=1,iframe_size,1 do
    local foldername = tostring((i - 1) * iframe_gap + 1)
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

local blend = env.getnumber("blend")
local iframe_gap = env.getnumber("iframe_gap")
local iframe_iteration = env.getnumber(iframe_iteration)
local finetune_iteration = env.getnumber(finetune_iteration)

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
            prefix.."iteration_"..tostring(iframe_iteration)..suffix, 
            prefix.."iteration_"..tostring(finetune_iteration)..suffix 
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

