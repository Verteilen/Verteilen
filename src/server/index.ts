import Chalk from 'chalk'
import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import { Header, WebPORT } from './interface'

let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined

const webport = backendEvent.PortAvailable(80)
const socketport = backendEvent.PortAvailable(WebPORT)

webport.then(p => {
    app = express()
    console.log("current dir: ", process.cwd())
    app.use(express.static('public'))
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
        console.log(Chalk.greenBright('server run at 80'))
    })
})
socketport.then(p => {
    wsServer = new ws.Server({path: '/server', port: p})
    wsServer.on('connection', (ws, request) => {
        //const p = new eventInit(ws)
        ws.on('message', (data, isBinary) => {
            const d:Header = JSON.parse(data.toString())
            backendEvent.Analysis(ws, d)
        })
        ws.on('open', () => {
            backendEvent.NewConsole(ws)
        })
        ws.on('close', () => {
            backendEvent.DropConsole(ws)
        })
    })
})

Promise.allSettled([webport, socketport])