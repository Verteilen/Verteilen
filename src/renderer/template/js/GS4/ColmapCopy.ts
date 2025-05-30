export const FUNIQUE_GS4_COLMAP_COPY_V2:string = `

// When colmap calculate finish
// Copy the colmap result to after folder
// Iframe or blend data prepare

root = env.getstring("root");
before = env.getstring("before");
after = env.getstring("after");
iframe_gap = env.getnumber("iframe_gap");
frame_size = env.getnumber("frameCount");
blend = env.getnumber("blend");
group_size = env.getnumber("group_size");

even = group_size % 2 == 0;
gap_p = 0;
gap_n = 0;
p_count = 1;
n_count = 1;
from = "";

// Calcuate the length of both direction
if (even){
    gap_p = group_size / 2;
    gap_n = group_size / 2 - 1;
} else {
    gap_p = (group_size - 1) / 2;
    gap_n = (group_size - 1) / 2;
}

env.setnumber("gop_positive", gap_p);
env.setnumber("gop_negative", gap_n);

copy_to_positive = (p_folder) => {
    to = \`\${p_folder}/\${p_count}\`;
    if (os.exist(from)){
        os.copydir(from, to);
    }
    p_count = p_count + 1;
}

copy_to_negative = (n_folder) => {
    to = \`\${n_folder}/\${p_count}\`;
    if (os.exist(from)){
        os.copydir(from, to);
    }
    n_count = n_count + 1;
}

// Copy the colmap folders to positive dataset in after folder
for(i = 0; i < blend; i++)
    // Folder name: DATASET_P_0, DATASET_P_5, DATASET_P_10
    p_folder = \`\${root}/\${after}/DATASET_P_\${i * iframe_gap}\`;
    os.createdir(p_folder);

    // 0 or 1
    starter = (i * iframe_gap) + 1;
    console.log(\`p_starter: \${starter}\`);
    p_count = starter;
    
    for(j = starter; i < frame_size; i++) {
        from = \`\${root}/\${before}/\${j}\`;
        gap = (j - (i * iframe_gap) - 1) % group_size + 1;

        if (gap <= (gap_p + 1)) {
            copy_to_positive(p_folder);
        }
    }
    // data_p_0 data_p_1 data_p_2
    env.setnumber(\`data_p_\${i}\`, p_count - 1)
end

// Copy the colmap folders to negative dataset in after folder
for(i = 0; i < blend; i++)
    // Folder name: DATASET_N_0, DATASET_N_5, DATASET_N_10
    n_folder = \`\${root}/\${after}/DATASET_N_\${i * iframe_gap}\`;
    os.createdir(n_folder);

    // 0 or 1
    starter = (i * iframe_gap) + 1;
    console.log(\`n_starter: \${starter}\`);
    hit = false;
    n_count = starter;

    for(k = 0; k < frame_size - (starter - 1); k++){
        j = frame_size - (k - 1)
        from = \`\${root}/\${before}/\${j}\`
        gap = (j - (i * iframe_gap) - 1 - 1) % group_size + 1

        if (gap == 1){
            hit = true;
        }

        if (gap > (gap_p) && hit) {
            copy_to_negative(n_folder);
        }
    }
    // data_n_0 data_n_1 data_n_2
    env.setnumber(\`data_n_\${i}\`, n_count)
}
`