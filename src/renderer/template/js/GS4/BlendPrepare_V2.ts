export const FUNIQUE_GS4_BLEND_PREPARE_V2:string = `
root = env.getstring("root")
after_folder = env.getstring("after")
iframe_size = env.getnumber("iframe_size")
group_size = env.getnumber("group_size")
blend = env.getnumber("blend")
iframe_gap = env.getnumber("iframe_gap")

gap_p = env.getnumber("gop_positive")
gap_n = env.getnumber("gop_negative")

// current value [1, 2, 3, 4]

for(i = 0; i < blend; i++){
    // Folder name: BLEND_0_IP, BLEND_5_IP, BLEND_10_IP
    // Folder name: BLEND_0_IN, BLEND_5_IN, BLEND_10_IN
    path1 = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_IP/checkpoint\`
    path2 = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_IN/checkpoint\`
    m.messager(\`Create folder: \${path1}\`)
    m.messager(\`Create folder: \${path2}\`)
    o.createdir(path1)
    o.createdir(path2)
}

for(i = 0; i < iframe_size; i++){

}

for i=1,iframe_size,1 do
    local index = (i - 1) * iframe_gap + 1
    local step = (i - 1) % blend
    -- start from 0
    local recur = math.floor((i - 1) / blend) 
    local foldername = tostring(index)
    local from = root.."/"..after_folder.."/GOP_20_I/checkpoint/"..foldername
    local to = ""
    local to_foldername = ""

    local delta = step * iframe_gap

    -- Positive detect
    to_foldername = tostring((recur * gap_p) + delta + 1 + (recur))
    to = root.."/"..after_folder.."/".."BLEND_"..tostring(step  * iframe_gap).."_IP/checkpoint/"..to_foldername
    if o.exist(from) then
        o.copydir(from, to)
    end

    if i <= blend then
        goto continue
    end

    -- Negative detect
    -- N0, N1, N2
    to_foldername = "N"..tostring(recur - 1)
    to = root.."/"..after_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint/"..to_foldername
    if o.exist(from) then
        o.copydir(from, to)
    end

    ::continue::
end

for i=1,blend,1 do
    local step = i-1
    local folder = root.."/"..after_folder.."/".."BLEND_"..tostring(step * iframe_gap).."_IN/checkpoint/"
    local target_folder = split(o.listdir(folder), "\\n")
    local count = #(target_folder)
    local delta = step * iframe_gap

    for key,value in pairs(target_folder) do
        local from = folder..value
        -- 0, 1, 2, 3
        local rindex = (count - tonumber(string.sub(value, 2))) - 1
        local to_foldername = (rindex * gap_n) + delta + 1 + rindex
        local to = folder..to_foldername

        o.copydir(from, to)
        o.deletedir(from)
    end
end
`