import { EventEmitter } from "events"
import express from 'express'
import ws from 'ws'
import { analysis } from './analysis'
import { eventInit } from "./event"
import { Header, WebPORT } from './interface'

export const consoleEvent:EventEmitter = new EventEmitter()
const app = express()
const wsServer: ws.Server = new ws.Server({port: WebPORT})

eventInit()

app.use(express.static('public'))

app.get('/express', (req, res) => {
    res.send('1')
})

app.listen(80, () => {
    console.log('server run at 80')
})

wsServer.on('connection', (ws, request) => {
    ws.on('message', (data, isBinary) => {
        const d:Header = JSON.parse(data.toString())
        analysis(d, ws)
    })
})