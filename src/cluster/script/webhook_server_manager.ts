import * as path from 'path';
import * as ws from 'ws'
import * as pem from 'pem'
import * as https from 'https'
import * as os from 'os'
import { DATA_FOLDER, Header, Messager, Messager_log, WebHookPORT } from '../interface'
import { check } from 'tcp-port-used'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

export class WebhookServerManager {

    private httpss:https.Server<any> | undefined = undefined
    private server:ws.Server | undefined = undefined
    private sources:Array<WebSocket> = []
    private messager:Messager
    private messager_log:Messager_log

    constructor(_messager:Messager, _messager_log:Messager_log) {
        this.messager = _messager
        this.messager_log = _messager_log
    }

    Init = async () => {
        let port_result = WebHookPORT
        let canbeuse = false

        while(!canbeuse){
            await check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }

        const pems = await this.get_pem()
        this.httpss = https.createServer({ key: pems[0], cert: pems[1], minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3' }, (req, res) => {
            res.writeHead(200)
            res.end('HTTPS server is running');
        })
        this.httpss.addListener('upgrade', (req, res, head) => console.log('UPGRADE:', req.url))
        this.server = new ws.Server({server: this.httpss})
        this.server.on('listening', () => {
            this.messager_log('[Server] Listen PORT: ' + port_result.toString())
        })
        this.server.on('error', (err) => {
            this.messager_log(`[Server] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        this.server.on('close', () => {
            this.messager_log('[Server] Close !')
            this.Release()
        })
        this.server.on('connection', (ws, request) => {
            this.messager_log(`[Server] New Connection detected, ${ws.url}`)
            ws.on('close', (code, reason) => {
                this.messager_log(`[Source] Close ${code} ${reason}`)
            })
            ws.on('error', (err) => {
                this.messager_log(`[Source] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            ws.on('open', () => {
                this.messager_log(`[Source] New source is connected, URL: ${ws?.url}`)
            })
            ws.on('message', (data, isBinery) => {
                const h:Header | undefined = JSON.parse(data.toString());
            })
        })
        this.httpss.listen(port_result, () => {
            this.messager_log('[Server] Select Port: ' + port_result.toString())
        })
    }

    Destroy = () => {
        if(this.server == undefined) return
        this.server.close((err) => {
            this.messager_log(`[Client] Close error ${err}`)
        })
        this.Release()
    }

    Release = () => {
        
    }

    private get_pem = ():Promise<[string, string]> => {
        return new Promise<[string, string]>((resolve) => {
            const pemFolder = path.join(os.homedir(), DATA_FOLDER, 'pem')
            if(!existsSync(pemFolder)) mkdirSync(pemFolder)
            const clientKey = path.join(pemFolder, "cluster_clientkey.pem")
            const certificate = path.join(pemFolder, "cluster_certificate.pem")
            if(!existsSync(clientKey) || !existsSync(certificate)){
                pem.createCertificate({selfSigned: true}, (err, keys) => {
                    writeFileSync(clientKey, keys.clientKey, { encoding: 'utf8' })
                    writeFileSync(certificate, keys.certificate, { encoding: 'utf8' })
                    resolve([keys.clientKey, keys.certificate])
                })
            }else{
                resolve([readFileSync(clientKey, 'utf8').toString(), readFileSync(certificate, 'utf8').toString()])
            }
        })
    }
}