export const DEFAULT_JsPrintExample:string = `
id = env.getnumber('ck');
key = \`KEY_\${id}\`;
value = env.getnumber(key);
console.log(\`Set keyvalue: [\${key}, \${value}]\`);
`