import Chalk from 'chalk'
import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import cookieParser from 'cookie-parser'
import { ConsolePORT, Header, UserType, WebPORT } from './interface'
import path from 'path'

let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined

const webport = backendEvent.PortAvailable(WebPORT)
const socketport = backendEvent.PortAvailable(ConsolePORT)

webport.then(p => {
    app = express()
    app.use(cookieParser())
    console.log("current dir: ", process.cwd())
    app.get('/login/:token', (req, res, next) => {
        if(req.params.token != undefined) {
            res.cookie('token', req.params.token)
            res.redirect('/')
        }else{
            res.sendStatus(403)
        }
    })
    app.use((req, res, next) => {
        if(req.cookies.token == undefined) {
            res.sendStatus(403)
        }else{
            if(backendEvent.IsPass(req.cookies.token as string)) {
                next()
            }else{
                res.sendStatus(403)
            }
        }
    }, express.static(path.join(__dirname, 'public')))
    // The simple web response to let frontend know that backend exists
    app.get('/user', (req, res) => {
        res.send(backendEvent.GetUserType(req.cookies.token))
    })
    // Import project
    app.post('/project_import', (req, res) => {

    })
    app.post('/lua_import', (req, res) => {

    })
    app.listen(p, () => {
        console.log(Chalk.greenBright(`server run at ${p}`))
    })
    backendEvent.Root()
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