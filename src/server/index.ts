import Chalk from 'chalk'
import express from 'express'
import ws from 'ws'
import { backendEvent } from './event'
import cookieParser from 'cookie-parser'
import { ConsolePORT, Header, WebPORT } from './interface'
import path from 'path'
import multer from 'multer'
import bodyPreser from 'body-parser'
import * as fs from 'fs'

let wsServer: ws.Server | undefined = undefined
let app:express.Express | undefined = undefined

const webport = backendEvent.PortAvailable(WebPORT)
const socketport = backendEvent.PortAvailable(ConsolePORT)

export const main = async (middle?:any):Promise<[express.Express | undefined, ws.Server | undefined]> => {
    return new Promise<[express.Express | undefined, ws.Server | undefined]>(async (resolve) => {
        {
            const p = await webport
            app = express()
            const storage = multer.memoryStorage()
            const upload = multer({ dest: 'public/upload', storage: storage })
            app.use(cookieParser())
            app.use(bodyPreser.json())
            app.use(bodyPreser.urlencoded())
            app.use(bodyPreser.urlencoded({ extended: true }))
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
                    if(backendEvent.IsPass(req.cookies.token)) {
                        next()
                    }else{
                        res.sendStatus(403)
                    }
                }
            }, middle ? middle : express.static(path.join(__dirname, 'public')))
            // The simple web response to let frontend know that backend exists
            app.get('/user', (req, res) => {
                res.send(backendEvent.GetUserType(req.cookies.token))
            })
            app.post('/pic', upload.single('pic'), (req, res) => {
                if(req.file == undefined){
                    res.sendStatus(204)
                }else{
                    const p = `public/uploads/${req.cookies.token}`
                    if(!fs.existsSync(p)) fs.mkdirSync(p, {recursive: true})
                    const n = `${p}/pic.png`
                    fs.writeFileSync(n, req.file.buffer)
                    backendEvent.ChangeProfile(req.cookies.token, {
                        pic: n.replace('public/', '')
                    })
                    res.sendStatus(200)
                }
            })
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
        return [app, wsServer]
    })
}

if (require.main === module) {
    main();
}