import Chalk from 'chalk'
import express from 'express'
import * as ws from 'ws'
import * as fs from 'fs'
import * as pem from 'pem'
import * as os from 'os'
import * as path from 'path'
import * as https from 'https'
import { backendEvent } from './event'
import { ConsolePORT, DATA_FOLDER, Header, WebPORT } from './interface'
import { EventInit } from './event_http'


let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined
let httpss:https.Server<any> | undefined = undefined
let wss:https.Server<any> | undefined = undefined

const webport = backendEvent.PortAvailable(WebPORT)
const socketport = backendEvent.PortAvailable(ConsolePORT)

const get_pem = (express:boolean):Promise<[string, string]> => {
    return new Promise<[string, string]>((resolve) => {
        const pemFolder = path.join(os.homedir(), DATA_FOLDER, 'pem')
        if(!fs.existsSync(pemFolder)) fs.mkdirSync(pemFolder)
        const clientKey = path.join(pemFolder, express ? "express_clientkey.pem" : "console_clientkey.pem")
        const certificate = path.join(pemFolder, express ? "express_certificate.pem" : "console_certificate.pem")
        if(!fs.existsSync(clientKey) || !fs.existsSync(certificate)){
            pem.createCertificate({selfSigned: true}, (err, keys) => {
                fs.writeFileSync(clientKey, keys.clientKey, { encoding: 'utf8' })
                fs.writeFileSync(certificate, keys.certificate, { encoding: 'utf8' })
                resolve([keys.clientKey, keys.certificate])
            })
        }else{
            resolve([fs.readFileSync(clientKey, 'utf8').toString(), fs.readFileSync(certificate, 'utf8').toString()])
        }
    })
}

export const main = async (middle?:any):Promise<[express.Express | undefined, ws.Server | undefined]> => {
    return new Promise<[express.Express | undefined, ws.Server | undefined]>(async (resolve) => {
        {
            const p = await webport
            const pems = await get_pem(true)
            app = express()
            httpss = https.createServer({ key: pems[0], cert: pems[1], minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3', rejectUnauthorized: false }, app)
            EventInit(app, middle)
            httpss.listen(p, () => {
                console.log(Chalk.greenBright(`https server run at ${p}`))
            })
            backendEvent.Root()
        }
        {
            const p = await socketport
            const pems = await get_pem(false)
            wss = https.createServer({ key: pems[0], cert: pems[1], minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3', rejectUnauthorized: false }, (req, res) => {
                res.writeHead(200)
                res.end('New WSS Connection')
            })
            wsServer = new ws.Server({server: wss})
            console.log(Chalk.greenBright(`websocket server run at ${p}`))
            wsServer.on('connection', (ws) => {
                //const p = new eventInit(ws)
                ws.on('message', (data) => {
                    const d:Header = JSON.parse(data.toString())
                    backendEvent.ConsoleAnalysis(ws, d)
                })
                ws.on('open', () => {
                    backendEvent.NewConsoleConsole(ws)
                })
                ws.on('close', () => {
                    backendEvent.DropConsoleConsole(ws)
                })
            })
            wss.listen(p, () => {
                console.log(Chalk.greenBright(`ws server run at ${p}`))
            })
        }

        await Promise.allSettled([webport, socketport])
        resolve([app, wsServer])
    })
}

if (require.main === module) {
    main();
}