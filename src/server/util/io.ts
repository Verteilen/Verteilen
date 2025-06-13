import fs from "fs";
import { Parameter, Project } from "../interface";
import path from "path";


export const ImportProject = () => {
    
}

export const ImportParameter = (data:string):boolean => {
    const p:Parameter = JSON.parse(data)
    const pa = path.join(__dirname, 'data', 'parameter')
    if(!fs.existsSync(pa)) fs.mkdirSync(pa);
    fs.writeFileSync(path.join(pa, p.uuid), JSON.stringify(p, null, 2))
    return true
}