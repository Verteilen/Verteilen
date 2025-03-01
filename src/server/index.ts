import express from 'express'
import ws from 'ws'
import { WebPORT } from './interface'
import { ServerConnection } from './serverConnection'

const app = express()
const wsServer: ws.Server = new ws.Server({path: '/server', port: WebPORT})

app.use(express.static('public'))

app.get('/express', (req, res) => {
    res.send('1')
})

app.listen(80, () => {
    console.log('server run at 80')
})

wsServer.on('connection', (ws, request) => {
    const p = new ServerConnection(ws)
})