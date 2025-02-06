import { ipcMain } from 'electron';
import ws, { WebSocketServer } from 'ws';
import { messager_log } from '../debugger';
import { Header, PORT } from '../interface';
import { analysis } from './analysis';

let client:ws.WebSocketServer | undefined = undefined
let source:ws.WebSocket | undefined = undefined

export const clientinit = () => {
    ipcMain.on('client_start', () => {
        client = new WebSocketServer({port: PORT})
        client.on('listening', () => {
            messager_log('[聆聽事件] 伺服器啟動於 PORT: ' + PORT.toString())
        })
        client.on('error', (err) => {
            messager_log(`[錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        client.on('close', () => {
            messager_log('[關閉事件] 伺服器關閉 !')
        })
        client.on('connection', (ws, request) => {
            if (source != undefined) {
                messager_log(`[連線事件] 偵錯到第二個來源連線, 強制斷線`)
                ws.close();
                return;
            }
            source = ws;
            messager_log(`[連線事件] 偵測到新來源連線, ${ws.url}`)
            source.on('close', (code, reason) => {
                source = undefined;
                messager_log(`[來源關閉事件] ${code} ${reason}`)
            })
            source.on('error', (err) => {
                messager_log(`[來源錯誤事件] ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            source.on('open', () => {
                messager_log(`[新來源事件] 新的來源也建立連結, URL: ${source?.url}`)
            })
            source.on('message', (data, isBinery) => {
                const h:Header | undefined = JSON.parse(data.toString());
                analysis(h);
            })
            source.on('pong', (data) => {
    
            })
            source.on('ping', (data) => {
    
            })
        })
    })
    
    ipcMain.on('client_stop', () => {
        if (client != undefined) client.close()
        client = undefined
        source = undefined;
    })
}
