import fs from "fs";
import { dialog } from "electron";
import { Parameter, Project } from "../interface";
import path from "path";


export const ImportProject = () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'JSON', extensions: ['json'] },
        ]
    }).then(v => {
        if (v.canceled) return
        if(mainWindow == undefined) return;
        const p:Array<any> = []
        for(const x of v.filePaths){
            p.push(JSON.parse(fs.readFileSync(x).toString()))
        }
        mainWindow.webContents.send('import_project_feedback', JSON.stringify(p))
    })
}

export const ExportProject = (value:Project) => {
    dialog.showSaveDialog(mainWindow, {
        filters: [
            {
                name: "JSON",
                extensions: ['json']
            }
        ]
    }).then(v => {
        if (v.canceled || v.filePath.length == 0) return
        const path = v.filePath
        console.log("Export project to path: ", path)
        fs.writeFileSync(path, JSON.stringify(value, null, 4))
    })
}

export const ExportProjects = (value:Array<Project>) => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    }).then(v => {
        if (v.canceled || v.filePaths.length == 0) return
        if(mainWindow == undefined) return;
        const path = v.filePaths[0]
        for(var x of value){
            fs.writeFileSync(`${path}/${x.title}.json`, JSON.stringify(x, null, 4))
        }
    })
}

export const ImportParameter = (data:string):boolean => {
    const p:Parameter = JSON.parse(data)
    const pa = path.join(__dirname, 'data', 'parameter')
    if(!fs.existsSync(pa)) fs.mkdirSync(pa);
    fs.writeFileSync(path.join(pa, p.uuid), JSON.stringify(p, null, 2))
    return true
}

export const ExportParameter = (value:Parameter):string => {
    const uuid = value.uuid;
    const n = path.join(__dirname, "public", "parameter")
    if(!fs.existsSync(n)) fs.mkdirSync(n);
    fs.writeFileSync(path.join(n, uuid), JSON.stringify(value, null, 2))
    return path.join('parameter', uuid)
}