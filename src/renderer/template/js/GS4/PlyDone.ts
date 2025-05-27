export const FUNIQUE_GS4_PLYDone:string = `
root = env.getstring("root");
after_folder = env.getstring("after");
output_folder = env.getstring("output");
blend = env.getnumber("blend");

iframe_gap = env.getnumber("iframe_gap");
iframe_iteration = env.getnumber(iframe_iteration);
finetune_iteration = env.getnumber(finetune_iteration);

o.createdir(\`\${output_folder}/final\`);
o.createdir(\`\${output_folder}/trans\`);

for(i = 0; i < blend; i++){
    output_folder_seq = \`\${output_folder}/raw/Sequence_\${i * iframe_gap}\`;
    source_folder = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_I/checkpoint\`;
    o.createdir(output_folder_seq);

    allfolder = o.listdir(source_folder);
    count = 0;

    allfolder.forEach((value, key) => {
        prefix = \`\${source_folder}/\${value}/point_cloud/\`;
        suffix = "/point_cloud.ply";
        plyPaths = [ 
            \`\${prefix}iteration_\${iframe_iteration}suffix\`, 
            \`\${prefix}iteration_\${finetune_iteration}suffix\`
        ];
        exists = [
            o.exist(plyPaths[1]), 
            o.exist(plyPaths[2]) 
        ];
        exists.forEach((value2, key2) => {
            if (value2) {
                o.copyfile(plyPaths[key2], \`\${output_folder_seq}/\${value}.ply\`)
                count = count + 1
                return
            }
        })
    })

    m.messager_log(\`Total file copy: \${count}, to path: \${output_folder_seq}\`)
}
`
