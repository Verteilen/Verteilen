export const FUNIQUE_GS4_PLYDone_V2:string = `
root = env.getstring("root");
after_folder = env.getstring("after");
group_size = env.getnumber("group_size");
output_folder = env.getstring("output");
frame_size = env.getnumber("frameCount");

blend = env.getnumber("blend");
iframe_gap = env.getnumber("iframe_gap");

gap_p = env.getnumber("gop_positive");
gap_n = env.getnumber("gop_negative");

iframe_iteration = env.getnumber("iframe_iteration");
finetune_iteration = env.getnumber("finetune_iteration");

// current value [1, 2, 3, 4]
os.createdir(\`\${output_folder}/final\`);
os.createdir(\`\${output_folder}/trans\`);

copyToTarget = (src, output) => {
    prefix = \`\${src}/point_cloud/\`;
    suffix = "/point_cloud.ply";
    plyPaths = [
        \`\${prefix}iteration_\${iframe_iteration}suffix\`, 
        \`\${prefix}iteration_\${finetune_iteration}suffix\`
    ];
    exists = [
        os.exist(plyPaths[1]), 
        os.exist(plyPaths[2]) 
    ];
    exists.forEach((value2, key2) => {
        if (value2) {
            os.copyfile(plyPaths[key2], output);
            count = count + 1;
            return;
        }
    })
}

for(i = 0; i < blend; i++){
    output_folder_seq = \`\${output_folder}/raw/Sequence_\${i * iframe_gap}\`;
    source_root_folder = \`\${root}/\${after_folder}\`;
    source_folder = "";
    starter = ((i+1) * iframe_gap) + 1;
    count = 0;
    os.createdir(output_folder_seq);

    // Positive
    source_folder = \`\${source_root_folder}/BLEND_\${i * iframe_gap}_IP/checkpoint\`;
    allfolder = os.listdir(source_folder);
    console.log(\`total file: \${allfolder.length} in \${source_folder}\`);
    
    allfolder.forEach((value, key) => {
        if (Number(value) != Number.NaN) {
            n = Number(value - i * iframe_gap);
            rec = (n - 1) % (gap_p + 1);
            times = Math.ceil(n / (gap_p + 1));
            r = tostring(group_size * (times - 1) + rec + 1 + (i * iframe_gap));
            src = \`\${source_folder}/\${value}\`;
            output = \`\${output_folder_seq}/\${r}.ply\`;
            copyToTarget(src, output);
            count = count + 1;
        }
    })

    // Negative
    source_folder = \`\${source_root_folder}/BLEND_\${i * iframe_gap}_IN/checkpoint\`
    allfolder = os.listdir(source_folder);
    console.log(\`total file: \${allfolder.length} in \${source_folder}\`);
    c_starter = Math.floor((frame_size - 1) / group_size) * group_size + 1 + (i * iframe_gap)

    if (c_starter > frame_size) {
        c_starter = c_starter - group_size
    }

    allfolder.forEach((value, key) => {
        if (Number(value) != Number.NaN) {
            n = Number(value - i * iframe_gap);
            rec = (n - 1) % (gap_n + 1);
            times = math.ceil(n / (gap_n + 1));
            r = tostring( c_starter - ((n + (times - 1) * gap_p) - 1) );
            src = \`\${source_folder}/\${value}\`;
            output = \`\${output_folder_seq}/\${r}.ply\`;
            copyToTarget(src, output);
            count = count + 1;
        }
    }

    console.log(\`Total file copy: \${count}, to path: \${output_folder_seq}\`);
}
`