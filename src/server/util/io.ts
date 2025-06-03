import fs from "fs";
import { dialog } from "electron";
import { Parameter, Project } from "../interface";


export const ImportProject = () => {
    if(mainWindow == undefined) return;
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
    if(mainWindow == undefined) return;
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
    if(mainWindow == undefined) return;
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

export const ImportParameter = () => {
    if(mainWindow == undefined) return;
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'JSON', extensions: ['json'] },
        ]
    }).then(v => {
        if (v.canceled) return
        if(mainWindow == undefined) return;
        if(v.filePaths.length < 1) return;
        const p = JSON.parse(fs.readFileSync(v.filePaths[0]).toString())
        mainWindow.webContents.send('import_parameter_feedback', JSON.stringify(p))
    })
}

export const ExportParameter = (value:Parameter) => {
    if(mainWindow == undefined) return;
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