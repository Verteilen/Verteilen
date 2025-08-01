export const DEFAULT_JsSaveExample:string = `
id = env.getnumber('ck');
console.log(\`Current ck: \${id}\`);
key = \`KEY_\${id}\`;
r = id * 5;
console.log(JSON.stringify(env, null, 2));
env.setnumber(key, r);
console.log(\`Set keyvalue: [\${key}, \${r}]\`);
`