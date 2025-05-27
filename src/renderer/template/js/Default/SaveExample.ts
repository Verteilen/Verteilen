export const DEFAULT_JsSaveExample:string = `
id = env.getnumber('ck');
key = \`KEY_\${id}\`;
r = id * 5;
env.setnumber(key, r);
console.log(\`Set keyvalue: [\${key}, \${r}]\`);
`