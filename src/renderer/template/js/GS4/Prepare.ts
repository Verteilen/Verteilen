export const FUNIQUE_GS4_PREPARE:string = `
console.log("Env Init");

// This get call at start of the process
// Colmap data prepare

root = env.getstring("root");
prepare_folder = env.getstring("prepare");
before_folder = env.getstring("before");
after_folder = env.getstring("after");
output_folder = env.getstring("output");
iframe_gap = env.getnumber("iframe_gap");

CAM = env.getstring("CAM");
images = env.getstring("images");
sparse = env.getstring("sparse");

// Handle folders
os.createdir(\`\${root}/\${before_folder}\`);
os.createdir(\`\${root}/\${after_folder}\`);
os.createdir(output_folder);

console.log("Get CAM list");
prepare_folders = os.listdir(\`\${root}/\${prepare_folder}/CAM\`);

cam_size = prepare_folders.length;
console.log(\`Get CAM count: \${cam_size}\`);

frame_size = 0;
if (cam_size > 0){
    f1_files = os.listfile(\`\${root}/\${prepare_folder}/CAM/\${prepare_folders[1]}\`);
    frame_size = f1_files.length;
}
console.log(\`Get Frame count: \${frame_size}\`);

console.log("Copy sparse folder");
os.copydir(\`\${root}/\${prepare_folder}/\${sparse}\`, \`\${root}/\${before_folder}/\${sparse}\`);

// Moving source folder content to prepare folder
// The content here means image files .jpg
for (key = 0; key < frame_size; key++){
    // root/before/0/images
    os.createdir(\`\${root}/\${before_folder}/\${key}/images\`);
    for (key2 = 0; key2 < cam_size; key2++){
        // from: root/prepare/CAM/0001/000001.jpg
        // to: root/before/0/images/0000.jpg
        from = \`\${root}/\${prepare_folder}/CAM/\${(key2 + 1).toString().padString(4, "0")}/\${(key + 1).toString().padString(6, "0")}.jpg\`;
        to = \`\${root}/\${before_folder}/\${key}/images/\${key2.toString().padString(4, "0")}.jpg\`;
        if (!os.exist(from)) {
            continue;
        }
        os.copyfile(from, to);
        console.log_log(\`Copy file: \${from}   to   \${to}\`);
    }
}

env.setnumber("frameCount", frame_size);
env.setnumber("iframe_size", Math.ceil(frame_size / iframe_gap));
`
