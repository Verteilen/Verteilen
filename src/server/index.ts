import Chalk from 'chalk'
import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import { ConsolePORT, Header, WebPORT } from './interface'

import { EventInit } from './event_http'

let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined

const webport = backendEvent.PortAvailable(WebPORT)
const socketport = backendEvent.PortAvailable(ConsolePORT)

export const main = async (middle?:any):Promise<[express.Express | undefined, ws.Server | undefined]> => {
    return new Promise<[express.Express | undefined, ws.Server | undefined]>(async (resolve) => {
        {
            const p = await webport
            app = express()
            EventInit(app, middle)
            app.listen(p, () => {
                console.log(Chalk.greenBright(`server run at ${p}`))
            })
            backendEvent.Root()
        }
        {
            const p = await socketport
            wsServer = new ws.Server({path: '/server', port: p})
            console.log(Chalk.greenBright(`websocket server run at ${p}`))
            wsServer.on('connection', (ws, request) => {
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
        }

        await Promise.allSettled([webport, socketport])
        resolve([app, wsServer])
    })
}

if (require.main === module) {
    main();
}