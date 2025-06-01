export const FUNIQUE_GS4_PLYDone:string = `
root = env.getstring("root");
after_folder = env.getstring("after");
output_folder = env.getstring("output");
blend = env.getnumber("blend");

iframe_gap = env.getnumber("iframe_gap");
iframe_iteration = env.getnumber(iframe_iteration);
finetune_iteration = env.getnumber(finetune_iteration);

os.createdir(\`\${output_folder}/final\`);
os.createdir(\`\${output_folder}/trans\`);

for(i = 0; i < blend; i++){
    output_folder_seq = \`\${output_folder}/raw/Sequence_\${i * iframe_gap}\`;
    source_folder = \`\${root}/\${after_folder}/BLEND_\${i * iframe_gap}_I/checkpoint\`;
    os.createdir(output_folder_seq);

    allfolder = os.listdir(source_folder);
    count = 0;

    allfolder.forEach((value, key) => {
        prefix = \`\${source_folder}/\${value}/point_cloud/\`;
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
                os.copyfile(plyPaths[key2], \`\${output_folder_seq}/\${value}.ply\`);
                count = count + 1;
                return;
            }
        })
    })

    console.log(\`Total file copy: \${count}, to path: \${output_folder_seq}\`);
}
`
