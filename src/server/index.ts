import Chalk from 'chalk'
import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import { Header, WebPORT } from './interface'
import path from 'path'

let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined

const webport = backendEvent.PortAvailable(80)
const socketport = backendEvent.PortAvailable(WebPORT)

webport.then(p => {
    app = express()
    console.log("current dir: ", process.cwd())
    app.use(express.static(path.join(__dirname, 'public')))
    // The simple web response to let frontend know that backend exists
    app.get('/express', (req, res) => {
        res.send('1')
    })
    // Import project
    app.post('/project_import', (req, res) => {

    })
    app.post('/lua_import', (req, res) => {

    })
    app.listen(p, () => {
        console.log(Chalk.greenBright(`server run at ${p}`))
    })
})
socketport.then(p => {
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
})

Promise.allSettled([webport, socketport])