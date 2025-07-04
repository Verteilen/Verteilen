import { ipcMain } from "electron"
import * as path from "path";
import * as fs from 'fs';
import * as os from 'os';
import { TemplateData, TemplateDataProject, Project, PluginList, PluginPageData, TemplateDataParameter, ParameterContainer, TemplateGroup, TemplateGroup2, ToastData, DATA_FOLDER } from "../interface"
import { mainWindow } from "../electron";

const GetCurrentPlugin = ():PluginPageData => {
    const b:PluginPageData = {
        plugins: [],
        templates: []
    }
    const root = path.join(os.homedir(), DATA_FOLDER, 'template')
    const root2 = path.join(os.homedir(), DATA_FOLDER, 'plugin')
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
            parameter: ps2,
            url: config.url
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

const import_template = async (name:string, url:string, token:string) => {
    const root = path.join(os.homedir(), DATA_FOLDER, 'template')
    const error_children:Array<[string, string]> = []
    const tokens = [undefined, ...token.split(' ')]
    const content_folder = path.join(root, name)
    const project_folder = path.join(content_folder, 'project')
    const parameter_folder = path.join(content_folder, 'parameter')
    if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
    let req:RequestInit = {}
    let ob:TemplateData | undefined = undefined
    for(let t of tokens){
        if(t == undefined){
            req = { method: 'GET' }
        }else{
            req = {
                method: 'GET',
                headers: {
                    "Authorization": token ? `Bearer ${token}` : ''
                }
            }
        }
        try{
            const res = await fetch(url, req)
            const tex = await res.text()
            ob = JSON.parse(tex)
            break
        }catch (error){
            console.error(error)
        }
    }
    if(ob == undefined) {
        const p:ToastData = { title: "Import Failed", type: "error", message: `Cannot find the json from url ${url}, or maybe just the wrong token` }
        mainWindow?.webContents.send("makeToast", JSON.stringify(p))
        return JSON.stringify(GetCurrentPlugin())
    } 
    ob.url = url
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
        const n = ob.projects[index].filename + '.json'
        try{
            const project:Project = JSON.parse(text)
            fs.writeFileSync(path.join(project_folder, n), JSON.stringify(project, null, 4))
        }catch(error:any){
            console.log("Parse error:\n", text)
            error_children.push([`Import Project ${n} Error`, error.message])
        }
    })

    ob.parameters.forEach((p:TemplateDataParameter) => {
        parameter_calls.push(fetch(folder + "/" + p.filename + '.json', req))
    })
    const pss2 = await Promise.all(parameter_calls)
    const parameter_calls2:Array<Promise<string>> = pss2.map(x => x.text())
    const pss_result2 = await Promise.all(parameter_calls2)
    pss_result2.forEach((text, index) => {
        const n = ob.parameters[index].filename + '.json'
        try{
            const project:Project = JSON.parse(text)
            const parameter:Array<ParameterContainer> = JSON.parse(text)
            fs.writeFileSync(path.join(parameter_folder, n), JSON.stringify(parameter, null, 4))
        }catch(error:any){
            console.log("Parse error:\n", text)
            error_children.push([`Import Parameter ${n} Error`, error.message])
        }
    })
    for(let x of error_children){
        const p:ToastData = { title: x[0], type: "error", message: x[1] }
        mainWindow?.webContents.send("makeToast", JSON.stringify(p))
    }
    return JSON.stringify(GetCurrentPlugin())
}

const import_plugin = async (name:string, url:string, token:string) => {
    const root = path.join(os.homedir(), DATA_FOLDER, 'plugin')
    const tokens = [undefined, ...token.split(' ')]
    if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
    let req:RequestInit = {}
    let ob:PluginList | undefined = undefined
    for(let t of tokens){
        if(t == undefined){
            req = { method: 'GET' }
        }else{
            req = {
                method: 'GET',
                headers: {
                    "Authorization": token ? `Bearer ${token}` : ''
                }
            }
        }
        try{
            const res = await fetch(url, req)
            const tex = await res.text()
            ob = JSON.parse(tex)
            break
        }catch (error){
            console.error(error)
        }
    }
    if(ob == undefined) {
        const p:ToastData = { title: "Import Failed", type: "error", message: `Cannot find the json from url ${url}, or maybe just the wrong token` }
        mainWindow?.webContents.send("makeToast", JSON.stringify(p))
        return JSON.stringify(GetCurrentPlugin())
    }
    ob.url = url
    fs.writeFileSync(path.join(root, name + '.json'), JSON.stringify(ob, null, 4))
    return JSON.stringify(GetCurrentPlugin())
}

export const PluginInit = () => {
    ipcMain.handle('get_plugin', async () => {
        const root = path.join(os.homedir(), DATA_FOLDER, 'template')
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true});
        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_template', async (event, name:string, url:string, token:string) => {
        return import_template(name, url, token)
    })
    ipcMain.handle('import_plugin', async (event, name:string, url:string, token:string) => {
        return import_plugin(name, url, token)
    })
    ipcMain.handle('import_template_delete', (event, name:string) => {
        const root = path.join(os.homedir(), DATA_FOLDER, 'template')
        if(fs.existsSync(path.join(root, name + '.json'))) fs.rmSync(path.join(root, name + '.json'));
        if(fs.existsSync(path.join(root, name))) fs.rmdirSync(path.join(root, name), { recursive: true, });
        return JSON.stringify(GetCurrentPlugin())
    })
    ipcMain.handle('import_plugin_delete', (event, name:string) => {
        const root = path.join(os.homedir(), DATA_FOLDER, 'plugin')
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
                    target = path.join(os.homedir(), DATA_FOLDER, 'template', x.name, 'project', y.filename + '.json')
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
                    target = path.join(os.homedir(), DATA_FOLDER, 'template', x.name, 'parameter', y.filename + '.json')
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