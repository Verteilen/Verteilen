export const FUNIQUE_GS4_BLEND_PREPARE:string = `
root = env.getstring("root");
after_folder = env.getstring("after");
iframe_size = env.getnumber("iframe_size");
group_size = env.getnumber("group_size");
blend = env.getnumber("blend");
iframe_gap = env.getnumber("iframe_gap");

current = 1;

for(i = 0; i < blend; i++){
    // Folder name: BLEND_0_I, BLEND_5_I, BLEND_10_I
    path = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_I/checkpoint\`;
    m.messager(\`Create folder: \${path}\`);
    o.createdir(path);
}

for(i = 1; i < iframe_size; i++){
    foldername = (i * iframe_gap + 1).toString()
    from = \`\${root}/\${after_folder}/GOP_20_I/checkpoint/\${foldername}\`;
    to = \`\${root}/\${after_folder}/BLEND_\${(current - 1) * iframe_gap}_I/checkpoint/\${foldername}\`;
    o.copydir(from, to);

    current = current + 1;
    if (current > blend){
        current = 1;
    }
}
`