// ========================
//                           
//      Share Codebase     
//                           
// ========================
import * as path from 'path';
import { check } from 'tcp-port-used';
import { WebSocket } from 'ws';
import * as ws from 'ws';
import { CLIENT_UPDATETICK, DATA_FOLDER, Header, Messager, Messager_log, Plugin, PluginList, PORT } from '../interface';
import { ClientAnalysis } from './analysis';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import * as os from 'os'
import * as pem from 'pem'
import * as https from 'https'

/**
 * The calculation node worker
 */
export class Client {
    plugins: PluginList = { plugins: [] }
    
    private httpss:https.Server<any> | undefined = undefined
    private client:ws.Server | undefined = undefined
    private sources:Array<WebSocket> = []
    private messager:Messager
    private messager_log:Messager_log
    private analysis:Array<ClientAnalysis>
    private updatehandle 

    /**
     * Get connected client count
     */
    public get count() : number {
        return this.sources.length
    }
    /**
     * Get connected client list instance
     */
    public get clients() : Array<WebSocket> {
        return this.sources
    }

    constructor(_messager:Messager, _messager_log:Messager_log){
        this.messager = _messager
        this.messager_log = _messager_log
        this.analysis = []
        this.updatehandle = setInterval(this.update, CLIENT_UPDATETICK);
        this.loadPlugins()
    }

    Dispose (){
        clearInterval(this.updatehandle)
    }

    /**
     * Start a websocket server, and waiting for cluster server to connect
     */
    Init = async () => {
        let port_result = PORT
        let canbeuse = false

        while(!canbeuse){
            await check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }
        const pems = await this.get_pem()
        this.httpss = https.createServer({ key: pems[0], cert: pems[1], minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3' }, (req, res) => {
            res.writeHead(200)
            res.end('HTTPS server is running');
        })
        this.httpss.addListener('upgrade', (req, res, head) => console.log('UPGRADE:', req.url))
        this.client = new ws.Server({server: this.httpss})
        this.client.on('listening', () => {
            this.messager_log('[Server] Listen PORT: ' + port_result.toString())
        })
        this.client.on('error', (err) => {
            this.messager_log(`[Server] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
        })
        this.client.on('close', () => {
            this.messager_log('[Server] Close !')
            this.Release()
        })
        this.client.on('connection', (ws, request) => {
            const a = new ClientAnalysis(this.messager, this.messager_log, this)
            this.analysis.push(a)
            this.sources.push(ws)
            this.messager_log(`[Server] New Connection detected, ${ws.url}`)
            ws.on('close', (code, reason) => {
                const index = this.sources.findIndex(x => x == ws)
                if(index != -1) this.sources.splice(index, 1)
                this.messager_log(`[Source] Close ${code} ${reason}`)
                a.disconnect(ws)
            })
            ws.on('error', (err) => {
                this.messager_log(`[Source] Error ${err.name}\n\t${err.message}\n\t${err.stack}`)
            })
            ws.on('open', () => {
                this.messager_log(`[Source] New source is connected, URL: ${ws?.url}`)
            })
            ws.on('message', (data, isBinery) => {
                const h:Header | undefined = JSON.parse(data.toString());
                a.analysis(h, ws);
            })
        })
        this.httpss.listen(port_result, () => {
            this.messager_log('[Server] Select Port: ' + port_result.toString())
        })
    }

    Destroy = () => {
        if(this.client == undefined) return
        this.client.close((err) => {
            this.messager_log(`[Client] Close error ${err}`)
        })
        this.Release()
    }

    Release = () => {
        this.analysis.forEach(x => x.stop_all())
        this.analysis.forEach(x => x.destroy())
        this.analysis = []
    }

    savePlugin = () => {
        const f = path.join(os.homedir(), DATA_FOLDER)
        const pluginPath = path.join(f, 'plugin.json')
        if(!existsSync(f)) mkdirSync(f, { recursive: true })
        writeFileSync(pluginPath, JSON.stringify(this.plugins, null, 4))
    }

    /**
     * The node update function, It will do things below
     * * Send system info to cluster server
     */
    private update = () => {
        this.analysis.forEach(x => x.update(this))
    }

    private loadPlugins = () => {
        const f = path.join(os.homedir(), DATA_FOLDER)
        const pluginPath = path.join(f, 'plugin.json')
        if(!existsSync(f)) mkdirSync(f, { recursive: true })
        if(!existsSync(pluginPath)){
            writeFileSync(pluginPath, JSON.stringify(this.plugins, null, 4))
        }else{
            this.plugins = JSON.parse(readFileSync(pluginPath).toString())
        }
    }

    private get_pem = ():Promise<[string, string]> => {
        return new Promise<[string, string]>((resolve) => {
            const pemFolder = path.join(os.homedir(), DATA_FOLDER, 'pem')
            if(!existsSync(pemFolder)) mkdirSync(pemFolder)
            const clientKey = path.join(pemFolder, "client_clientkey.pem")
            const certificate = path.join(pemFolder, "client_certificate.pem")
            if(!existsSync(clientKey) || !existsSync(certificate)){
                pem.createCertificate({selfSigned: true}, (err, keys) => {
                    writeFileSync(clientKey, keys.clientKey, { encoding: 'utf8' })
                    writeFileSync(certificate, keys.certificate, { encoding: 'utf8' })
                    resolve([keys.clientKey, keys.certificate])
                })
            }else{
                resolve([readFileSync(clientKey, 'utf8').toString(), readFileSync(certificate, 'utf8').toString()])
            }
        })
    }
    
    public static workerPath = (filename:string = "worker", extension:string = ".exe") => {
        // @ts-ignore
        const isExe = process.pkg?.entrypoint != undefined
        const exe = process.platform == 'win32' ? filename + extension : filename
        let workerExe = ""
        let p = 0
        if(isExe && path.basename(process.execPath) == (process.platform ? "app.exe" : 'app')) { // Node build
            workerExe = path.join(process.execPath, "..", "bin", exe)
            p = 1
        }
        else if(
            (process.mainModule && process.mainModule.filename.indexOf('app.asar') !== -1) ||
            process.argv.filter(a => a.indexOf('app.asar') !== -1).length > 0
        ) { // Electron package
            workerExe = path.join("bin", exe)
            p = 2
        }
        else if (process.env.NODE_ENV === 'development'){
            workerExe = path.join(process.cwd(), "bin", exe)
            p = 3
        }
        else{ // Node un-build
            workerExe = Client.isTypescript() ? path.join(__dirname, "bin", exe) : path.join(__dirname, "..", "bin", exe)
            p = 4
        }
        return workerExe
    }    

    static isTypescript = ():boolean => {
        // if this file is typescript, we are running typescript :D
        // this is the best check, but fails when actionhero is compiled to js though...
        const extension = path.extname(__filename);
        if (extension === ".ts") {
            return true;
        }

        // are we running via a ts-node/ts-node-dev shim?
        const lastArg = process.execArgv[process.execArgv.length - 1];
        if (lastArg && path.parse(lastArg).name.indexOf("ts-node") > 0) {
            return true;
        }

        try {
            /**
             * Are we running in typescript at the moment?
             * see https://github.com/TypeStrong/ts-node/pull/858 for more details
             */
            return process[Symbol.for("ts-node.register.instance")] ||
            (process.env.NODE_ENV === "test" &&
                process.env.ACTIONHERO_TEST_FILE_EXTENSION !== "js")
            ? true
            : false;
        } catch (error) {
            console.error(error);
            return false;
        }
    }
}
