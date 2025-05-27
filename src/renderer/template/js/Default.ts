export const DEFAULT_JsExample:string = `
console.log("Hello World!")
`

export const DEFAULT_JsCronMultiExample:string = `
let id = env.getnumber('ck')
console.log(\`Hello World from \${id}\`)
`

export const DEFAULT_JsSaveExample:string = `
let id = env.getnumber('ck')

let key = "KEY_" + id.tostring()
let r = id * 5

env.setnumber(key, r)

console.log(\`Set keyvalue: [\${key.tostring()}, \${r.tostring()}]\`)
`

export const DEFAULT_JsPrintExample:string = `
let id = env.getnumber('ck')

let key = "KEY_" + id.tostring()

let value = env.getnumber(key)

console.log(\`Set keyvalue: [\${key.tostring()}, \${value.tostring()}]\`)
`