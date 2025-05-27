export const FUNIQUE_GS4_PREPARE:string = `
console.log("Env Init");

root = env.getstring("root")
prepare_folder = env.getstring("prepare")
before_folder = env.getstring("before")
after_folder = env.getstring("after")
output_folder = env.getstring("output")

iframe_gap = env.getnumber("iframe_gap")
CAM = env.getstring("CAM")
images = env.getstring("images")
sparse = env.getstring("sparse")

o.deletedir(root.."/"..before_folder)
o.deletedir(root.."/"..after_folder)
o.deletedir(output_folder)
o.createdir(root.."/"..before_folder)
o.createdir(root.."/"..after_folder)
o.createdir(output_folder)

console.log("Get CAM list")
prepare_folders = split(o.listdir(root.."/"..prepare_folder.."/"..CAM), "\\n")

cam_size = #(prepare_folders)
console.log("Get CAM count: "..cam_size)

minus = 0

frame_size = 0
if (cam_size > 0){
    f1_files = split(o.listfile(root.."/"..prepare_folder.."/"..CAM.."/"..prepare_folders[1]), "\\n")
    frame_size = #(f1_files)
}
console.log("Get Frame count: "..frame_size)

console.log("Copy sparse folder")
o.copydir(root.."/"..prepare_folder.."/"..sparse, root.."/"..before_folder.."/"..sparse)

for (key = 1; key < frame_size; key++){
    o.createdir(root.."/"..before_folder.."/"..tostring(key - minus).."/images")
    for (key2 = 1; key2 < cam_size; key2++){
        from = root.."/"..prepare_folder.."/"..CAM.."/"..string.format("%04d", key2).."/"..string.format("%04d", key2).."_"..string.format("%06d", key)..".jpg"
        to = root.."/"..before_folder.."/"..tostring(key - minus).."/images/"..string.format("%04d", key2)..".jpg"
        o.copyfile(from, to)
        console.log_log("Copy file: '"..from.."'   to  '"..to.."'")
    }
}

env.setnumber("frameCount", frame_size)
env.setnumber("iframe_size", math.ceil(frame_size / iframe_gap))
`