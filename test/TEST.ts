import * as pem from 'pem'
import * as https from 'https'
import * as ws from 'ws'

let h:https.Server<any> | undefined = undefined
let w:ws.Server | undefined = undefined

async function get_pem ():Promise<[string, string]> {
    return new Promise<[string, string]>(resolve => {
        pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
            resolve([keys.clientKey, keys.certificate])
        })
    })
}


async function start_server() {
    const pems = await get_pem()
    h = https.createServer({ key: pems[0], cert: pems[1], minVersion: 'TLSv1.2', maxVersion: 'TLSv1.3' }, (req, res) => {
        res.writeHead(200)
        res.end('HTTPS server is running');
    })
    h.addListener('upgrade', (req, res, head) => console.log('UPGRADE:', req.url))
    w = new ws.Server({ server: h })
    w.on('listening', (socket) => {
        console.log("Listen Event")
    })
    w.on('error', (err) => {
        console.log("Error Event")
    })
    w.on('connection', (socket) => {
        socket.on('message', (data) => {
            console.log("Recevied Data: ", data.toString())
        })
    })
    h.listen(10000, () => {
        console.log("Listen to 10000")
    })
}


async function start_client() {
    return new Promise((resolve) => {
        const cli = new ws.WebSocket("wss://127.0.0.1:10000", { agent: new https.Agent(), rejectUnauthorized: false })
        cli.on('error', (err) => {
            console.log("Socket Error: ", err)
        })
        setTimeout(() => {
            cli.send("Hello World")
            cli.close()
            resolve(undefined)
        }, 1000);
    })
}

async function main() {
    await start_server()
    await start_client()
    //w?.close()
    //h?.close()
}

main()