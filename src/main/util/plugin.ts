import { ipcMain } from "electron"
import path from "path";
import fs from 'fs';
import { TemplateData, TemplateDataProject, Project, PluginList, PluginPageData, TemplateDataParameter, ParameterContainer } from "../interface"

const GetCurrentPlugin = ():PluginPageData => {
    const b:PluginPageData = {
        plugins: [],
        templates: []
    }
    const root = path.join("data", 'template')
    const config_folder = path.join(root, 'config')

    const files = fs.readdirSync(config_folder)
    const configs:Array<TemplateData> = files.map(file => {
        if(!file.endsWith('.json')) return;
        return JSON.parse(fs.readFileSync(path.join(config_folder, file), 'utf-8'))
    })
    configs.forEach((config, index) => {
        const ps = config.projects.map(x => ({
            value: -1,
            group: x.group,
            title: x.title
        }))
        const ps2 = config.parameters.map(x => ({
            value: -1,
            group: x.group,
            title: x.title
        }))
        b.templates.push({
            name: files[index].replace('.json', ''),
            project: ps,
            parameter: ps2
        })
    })
    return b
}

export const PluginInit = () => {
    ipcMain.handle('get_plugin', async () => {
        const root = path.join("data", 'template')
        const project_folder = path.join(root, 'project')
        const parameter_folder = path.join(root, 'parameter')
        const config_folder = path.join(root, 'config')
        if (!fs.existsSync(project_folder)) fs.mkdirSync(project_folder, {recursive: true});
        if (!fs.existsSync(parameter_folder)) fs.mkdirSync(parameter_folder, {recursive: true});
        if (!fs.existsSync(config_folder)) fs.mkdirSync(config_folder, {recursive: true});

        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_template', async (event, name:string, url:string, token?:string) => {
        const root = path.join("data", 'template')
        const project_folder = path.join(root, 'project')
        const parameter_folder = path.join(root, 'parameter')
        const config_folder = path.join(root, 'config')
        if (!fs.existsSync(project_folder)) fs.mkdirSync(project_folder, {recursive: true});
        if (!fs.existsSync(parameter_folder)) fs.mkdirSync(parameter_folder, {recursive: true});
        if (!fs.existsSync(config_folder)) fs.mkdirSync(config_folder, {recursive: true});
        const req:RequestInit = {
            method: 'GET',
            headers: {
                "Authorization": token ? `Bearer ${token}` : ''
            }
        }

        const res = await fetch(url, req)
        const tex = await res.text()
        const ob:TemplateData = JSON.parse(tex)
        fs.writeFileSync(path.join(config_folder, name + '.json'), JSON.stringify(ob, null, 4))
        const folder = url.substring(0, url.lastIndexOf('/'))
        const project_calls:Array<Promise<Response>> = []
        const parameter_calls:Array<Promise<Response>> = []

        ob.projects.forEach((p:TemplateDataProject) => {
            project_calls.push(fetch(folder + "/" + p.title + '.json', req))
        })
        const pss = await Promise.all(project_calls)
        const project_calls2:Array<Promise<string>> = pss.map(x => x.text())
        const pss_result = await Promise.all(project_calls2)
        pss_result.forEach((text, index) => {
            try{
                const project:Project = JSON.parse(text)
                fs.writeFileSync(path.join(project_folder, ob.projects[index].title + '.json'), JSON.stringify(project, null, 4))
            }catch(e){
                console.log("Parse error:\n", text)
            }
        })

        ob.parameters.forEach((p:TemplateDataParameter) => {
            parameter_calls.push(fetch(folder + "/" + p.title + '.json', req))
        })
        const pss2 = await Promise.all(parameter_calls)
        const parameter_calls2:Array<Promise<string>> = pss2.map(x => x.text())
        const pss_result2 = await Promise.all(parameter_calls2)
        pss_result2.forEach((text, index) => {
            try{
                const parameter:Array<ParameterContainer> = JSON.parse(text)
                fs.writeFileSync(path.join(parameter_folder, ob.parameters[index].title + '.json'), JSON.stringify(parameter, null, 4))
            }catch(e){
                console.log("Parse error:\n", text)
            }
        })

        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_plugin', async (event, name:string, url:string, token?:string) => {
        const root = path.join("data", 'plugin')
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
        
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            }
        })
        const tex = await res.text()
        const ob:PluginList = JSON.parse(tex)
        fs.writeFileSync(path.join(root, name + '.json'), JSON.stringify(ob, null, 4))
        return JSON.stringify(GetCurrentPlugin())
    })
}