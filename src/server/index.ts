import express from 'express'
import ws from 'ws'
import { WebPORT } from './interface'

const app = express()
const wsServer: ws.Server = new ws.Server({port: WebPORT})

app.use(express.static('public'))

app.get('/express', (req, res) => {
    res.send('1')
})

app.listen(80, () => {
    console.log('server run at 80')
})

wsServer.on('connection', (ws, request) => {
    ws.on('message', (data, isBinary) => {
        
    })
})