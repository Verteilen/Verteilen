export const FFMPEG_CONCAT_SCRIPT:string = `
let root = env.getstring('root');
let concat = env.getobject('Concat');
let text = '# videos output belows\\n';
for(i = 0; i < concat.videos.length; i++){
    text += concat.videos[i];
    text += "\\n";
}
os.writefile(\`\${root}/concat.txt\`, text);
`