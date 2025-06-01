export const FUNIQUE_GS4_BLEND_PREPARE_V2:string = `
root = env.getstring("root");
after_folder = env.getstring("after");
iframe_size = env.getnumber("iframe_size");
group_size = env.getnumber("group_size");
blend = env.getnumber("blend");
iframe_gap = env.getnumber("iframe_gap");

gap_p = env.getnumber("gop_positive");
gap_n = env.getnumber("gop_negative");

// current value [1, 2, 3, 4]
for(i = 0; i < blend; i++){
    // Folder name: BLEND_0_IP, BLEND_5_IP, BLEND_10_IP
    // Folder name: BLEND_0_IN, BLEND_5_IN, BLEND_10_IN
    path1 = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_IP/checkpoint\`;
    path2 = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_IN/checkpoint\`;
    m.messager(\`Create folder: \${path1}\`);
    m.messager(\`Create folder: \${path2}\`);
    os.createdir(path1);
    os.createdir(path2);
}

for(i = 1; i < iframe_size; i++){
    index = i * iframe_gap + 1;
    step = i % blend;
    // start from 0
    recur = math.floor(i / blend) ;
    foldername = index.toString();
    from = \`\${root}/\${after_folder}/GOP_20_I/checkpoint/\${foldername}\`;
    to = "";
    to_foldername = "";

    delta = step * iframe_gap;

    // Positive detect
    to_foldername = (recur * gap_p) + delta + 1 + recur.toString();
    to = \`\${root}/\${after_folder}/BLEND_\${(step * iframe_gap)}_IP/checkpoint/\${to_foldername}\`;

    if (os.exist(from)){
        os.copydir(from, to);
    }

    if (i <= blend){
        continue;
    }

    // Negative detect
    // N0, N1, N2
    to_foldername = \`N\${recur - 1}\`;
    to = \`\${root}/\${after_folder}/BLEND_\${step * iframe_gap}_IN/checkpoint/\${to_foldername}\`;
    if (os.exist(from)){
        os.copydir(from, to);
    }
}

for(i = 1; i < blend; i++){
    folder = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_IN/checkpoint/\`
    target_folder = os.listdir(folder);
    count = target_folder.length;
    delta = i * iframe_gap;

    target_folder.forEach((value, key) => {
        from = \`\${folder}\${value}\`;
        // 0, 1, 2, 3
        rindex = (count - Number(value.slice(1, value.length))) - 1;
        to_foldername = (rindex * gap_n) + delta + 1 + rindex;
        to = \`\${folder}\${to_foldername}\`;

        os.copydir(from, to)
        os.deletedir(from)
    })
}
`