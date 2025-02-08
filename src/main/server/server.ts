import { ipcMain } from 'electron';
import { v6 as uuidv6 } from 'uuid';
import ws, { WebSocket } from 'ws';
import { messager_log } from '../debugger';
import { ExecutePack, ExecuteRendererPack, Header, Node, WebsocketPack } from '../interface';
import { mainWindow } from '../main';
import { analysis } from './analysis';
import { Execute } from './execute';

export let targets:Array<WebsocketPack> = []

const sendUpdate = (sender:Electron.WebContents) => {
    const data:Array<Node> = []
    targets.forEach(x => {
        if(x.websocket.readyState == WebSocket.CLOSED){
            data.push({ID: x.uuid, url: x.websocket.url})
        }
    })
    data.forEach(d => removeByUUID(d.ID))
    data.forEach(d => {
        if(mainWindow != undefined) serverconnect(mainWindow.webContents, d.url, d.ID)
    })

    sender.send('server_clients_update', targets.map(x => {
        return {
            ID: x.uuid,
            state: x.websocket.readyState,
            url: x.websocket.url,
            connection_rate: 0
        }
    }))
}

const removeByUUID = (uuid:string) => {
    let index = targets.findIndex(x => x.uuid == uuid)
    if(index != -1) {
        if(targets[index].websocket.readyState == WebSocket.OPEN) targets[index].websocket.close(1000, uuid)
        targets.splice(index, 1)
    }
}

const serverconnect = (e:Electron.WebContents, url:string, uuid?:string) => {
    if(uuid != undefined && targets.findIndex(x => x.uuid == uuid) != -1) return
    if(targets.findIndex(x => x.websocket.url.slice(0, -1) == url) != -1) return
    const client = new ws.WebSocket(url)
    client.on('error', (err) => {
        messager_log(`[錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
    })
    client.on('close', (code, reason) => {
        messager_log(`[關閉事件] 客戶端關閉連線, ${code}, ${reason}`)
    })
    client.on('open', () => {
        messager_log('[連線事件] 新連線狀態建立 !' + client.url)
        sendUpdate(e)
    })
    client.on('message', (data, isBinary) => {
        const h:Header | undefined = JSON.parse(data.toString());
        const c = targets.find(x => x.websocket == client)
        analysis(h, c)
    })
    targets.push({ uuid: uuid == undefined ? uuidv6() : uuid, websocket: client })
    return client
}

export const serverinit = () => {
    ipcMain.on('server_start', (e, url:string) => serverconnect(e.sender, url))
    
    ipcMain.on('server_stop', (e, args:Array<any>) => {
        removeByUUID(args[0])
    })

    ipcMain.on('server_update', (e) => {
        sendUpdate(e.sender)
    })

    ipcMain.on('server_record', (e, data:string) => {
        const ns:Array<Node> = JSON.parse(data)
        ns.forEach(x => {
            serverconnect(e.sender, x.url, x.ID)
        })
    })

    ipcMain.on('execute_pack', (e, data:string) => {
        const d:ExecuteRendererPack = JSON.parse(data)
        const web_ids = d.nodes.map(x => x.ID)
        const r:ExecutePack = {
            projects: d.projects,
            nodes: targets.filter(x => web_ids.includes(x.uuid))
        }
        Execute(e.sender, r.projects, r.nodes)
    })
}
