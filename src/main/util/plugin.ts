import { ipcMain } from "electron"
import path from "path";
import fs from 'fs';
import { TemplateData, TemplateDataProject, Project, PluginList, PluginPageData, TemplateDataParameter, ParameterContainer, TemplateGroup, TemplateGroup2 } from "../interface"

const GetCurrentPlugin = ():PluginPageData => {
    const b:PluginPageData = {
        plugins: [],
        templates: []
    }
    const root = path.join("data", 'template')
    const root2 = path.join("data", 'plugin')
    if(!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
    if(!fs.existsSync(root2)) fs.mkdirSync(root2, {recursive: true})

    const files = fs.readdirSync(root, { withFileTypes: true }).filter(x => x.isFile()).map(x => x.name).filter(x => x.endsWith('.json'));
    const configs:Array<TemplateData> = files.map(file => {
        return JSON.parse(fs.readFileSync(path.join(root, file), 'utf-8'))
    })
    configs.forEach((config, index) => {
        const ps:Array<TemplateGroup> = config.projects.map(x => ({
            value: -1,
            group: x.group,
            filename: x.filename,
            title: x.title
        }))
        const ps2:Array<TemplateGroup2> = config.parameters.map(x => ({
            value: -1,
            group: x.group,
            filename: x.filename,
            title: x.title
        }))
        b.templates.push({
            name: files[index].replace('.json', ''),
            project: ps,
            parameter: ps2
        })
    })

    const files2 = fs.readdirSync(root2, { withFileTypes: true }).filter(x => x.isFile()).map(x => x.name).filter(x => x.endsWith('.json'));
    const configs2:Array<PluginList> = files2.map(file => {
        return JSON.parse(fs.readFileSync(path.join(root2, file), 'utf-8'))
    })
    configs2.forEach((config, index) => {
        const p = config
        p.title = files2[index].replace('.json', '')
        b.plugins.push(p)
    })
    return b
}

export const PluginInit = () => {
    ipcMain.handle('get_plugin', async () => {
        const root = path.join("data", 'template')
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_template', async (event, name:string, url:string, token?:string) => {
        const root = path.join("data", 'template')
        const content_folder = path.join(root, name)
        const project_folder = path.join(content_folder, 'project')
        const parameter_folder = path.join(content_folder, 'parameter')
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
        const req:RequestInit = {
            method: 'GET',
            headers: {
                "Authorization": token ? `Bearer ${token}` : ''
            }
        }

        const res = await fetch(url, req)
        const tex = await res.text()
        const ob:TemplateData = JSON.parse(tex)
        fs.writeFileSync(path.join(root, name + '.json'), JSON.stringify(ob, null, 4))
        if(!fs.existsSync(content_folder)) fs.mkdirSync(content_folder, { recursive: true })
        if(!fs.existsSync(project_folder)) fs.mkdirSync(project_folder, { recursive: true })
        if(!fs.existsSync(parameter_folder)) fs.mkdirSync(parameter_folder, { recursive: true })
        const folder = url.substring(0, url.lastIndexOf('/'))
        const project_calls:Array<Promise<Response>> = []
        const parameter_calls:Array<Promise<Response>> = []

        ob.projects.forEach((p:TemplateDataProject) => {
            project_calls.push(fetch(folder + "/" + p.filename + '.json', req))
        })
        const pss = await Promise.all(project_calls)
        const project_calls2:Array<Promise<string>> = pss.map(x => x.text())
        const pss_result = await Promise.all(project_calls2)
        pss_result.forEach((text, index) => {
            try{
                const project:Project = JSON.parse(text)
                fs.writeFileSync(path.join(project_folder, ob.projects[index].filename + '.json'), JSON.stringify(project, null, 4))
            }catch(e){
                console.log("Parse error:\n", text)
            }
        })

        ob.parameters.forEach((p:TemplateDataParameter) => {
            parameter_calls.push(fetch(folder + "/" + p.filename + '.json', req))
        })
        const pss2 = await Promise.all(parameter_calls)
        const parameter_calls2:Array<Promise<string>> = pss2.map(x => x.text())
        const pss_result2 = await Promise.all(parameter_calls2)
        pss_result2.forEach((text, index) => {
            try{
                const parameter:Array<ParameterContainer> = JSON.parse(text)
                fs.writeFileSync(path.join(parameter_folder, ob.parameters[index].filename + '.json'), JSON.stringify(parameter, null, 4))
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
    ipcMain.handle('import_template_delete', (event, name:string) => {
        const root = path.join("data", 'template')
        if(fs.existsSync(path.join(root, name + '.json'))) fs.rmSync(path.join(root, name + '.json'));
        if(fs.existsSync(path.join(root, name))) fs.rmdirSync(path.join(root, name), { recursive: true, });
        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_plugin_delete', (event, name:string) => {
        const root = path.join("data", 'plugin')
        if(fs.existsSync(path.join(root, name + '.json'))) fs.rmSync(path.join(root, name + '.json'));
        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('get_template', (event, group:string, filename:string) => {
        const config = GetCurrentPlugin()
        let find = false
        let target = ''
        for(let x of config.templates){
            for(let y of x.project){
                if(y.group == group && y.filename == filename){
                    find = true
                    target = path.join("data", 'template', x.name, 'project', y.filename + '.json')
                    break
                }
            }
            if(find) break
        }
        if (!fs.existsSync(target)) {
            console.error("Path not found", target)
            return undefined
        }
        const data = fs.readFileSync(target)
        return data.toString('utf-8')
    })
    ipcMain.handle('get_parameter', (event, group:string, filename:string) => {
        const config = GetCurrentPlugin()
        let find = false
        let target = ''
        for(let x of config.templates){
            for(let y of x.parameter){
                if(y.group == group && y.filename == filename){
                    find = true
                    target = path.join("data", 'template', x.name, 'parameter', y.filename + '.json')
                    break
                }
            }
            if(find) break
        }
        if (!fs.existsSync(target)) {
            console.error("Path not found", target)
            return undefined
        }
        const data = fs.readFileSync(target)
        return data.toString('utf-8')
    })
}