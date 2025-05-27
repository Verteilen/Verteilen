export const DEFAULT_JsExample:string = `
console.log("Hello World!");
`

export const DEFAULT_JsCronMultiExample:string = `
id = env.getnumber('ck');
console.log(\`Hello World from \${id}\`);
`

export const DEFAULT_JsSaveExample:string = `
id = env.getnumber('ck');
key = \`KEY_\${id}\`;
r = id * 5;
env.setnumber(key, r);
console.log(\`Set keyvalue: [\${key}, \${r}]\`);
`

export const DEFAULT_JsPrintExample:string = `
id = env.getnumber('ck');
key = \`KEY_\${id}\`;
value = env.getnumber(key);
console.log(\`Set keyvalue: [\${key}, \${value}]\`);
`