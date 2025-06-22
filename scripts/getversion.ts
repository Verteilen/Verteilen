import { readFileSync } from 'fs'
import path from 'path'

const a = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json')).toString())
console.log(a.version)