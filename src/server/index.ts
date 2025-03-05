import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import { Header, WebPORT } from './interface'

const app = express()
const wsServer: ws.Server = new ws.Server({path: '/server', port: WebPORT})
backendEvent.Init()

console.log("current dir: ", process.cwd())
app.use(express.static('public'))

app.get('/express', (req, res) => {
    res.send('1')
})

app.listen(80, () => {
    console.log('server run at 80')
})

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