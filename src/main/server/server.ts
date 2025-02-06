import { ipcMain } from 'electron';
import { v6 as uuidv6 } from 'uuid';
import ws from 'ws';
import { messager_log } from '../debugger';
import { Header, WebsocketPack } from '../interface';
import { analysis } from './analysis';

let target:Array<WebsocketPack> = []

const sendUpdate = (sender:Electron.WebContents) => {
    sender.send('server_clients_update', target.map(x => {
        return {
            s: false,
            ID: x.uuid,
            url: x.websocket.url,
            connection_rate: 0
        }
    }))
}

export const serverinit = () => {
    ipcMain.handle('server_start', (e, url:string):Promise<void> => {
        return new Promise((resolve, reject) => {
            const client = new ws.WebSocket(url)
            client.on('error', (err) => {
                messager_log(`[錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
                reject(err)
            })
            client.on('close', (code, reason) => {
                messager_log(`[關閉事件] 客戶端關閉連線, ${code}, ${reason}`)
                const index = target.findIndex(x => client)
                if (index != -1) target.splice(index, 1)
                reject()
            })
            client.on('open', () => {
                messager_log('[連線事件] 新連線狀態建立 !' + client.url)
                target.push({ uuid: uuidv6(), websocket: client })
                sendUpdate(e.sender)
                resolve()
            })
            client.on('message', (data, isBinary) => {
                const h:Header | undefined = JSON.parse(data.toString());
                analysis(h)
            })
        })
    })
    
    ipcMain.handle('server_stop', (e, uuid:string, reason:string) => {
        const index = target.findIndex(x => x.uuid == uuid)
        if(index != -1) {
            target[index].websocket.close(200, reason)
            target.splice(index, 1)
            return true;
        }else{
            return false
        }
    })

    ipcMain.on('server_update', (e) => {
        sendUpdate(e.sender)
    })
}
