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
