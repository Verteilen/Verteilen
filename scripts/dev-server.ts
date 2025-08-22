process.env.NODE_ENV = 'development';

import Chalk from 'chalk';
import Chokidar from 'chokidar';
import cluster, { Worker } from 'cluster'
import { main as app } from './../src/server/index'
import Path from 'path';
import * as Vite from 'vite';
import * as util from './utility';

let viteServer:Vite.ViteDevServer | null = null;
let expressProcess:Worker | null = null;
let rendererMiddle:Vite.Connect.Server | undefined = undefined;
let lock = false

async function startRenderer() {
    viteServer = await Vite.createServer({
        server: { middlewareMode: true, hmr: { host: "localhost", protocol: 'ws' } },
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        mode: 'development',
    });
    return viteServer.middlewares;
}

async function startExpress() {
    if (expressProcess) { // single instance lock
        return;
    }
    app(rendererMiddle);
}

async function restartExpress() {
    if (expressProcess) {
        expressProcess.removeAllListeners('exit');
        expressProcess.kill();
        expressProcess = null;
    }
    await util.Share_Call()
    if(!expressProcess) {
        expressProcess = cluster.fork()
        setTimeout(() => {
            lock = false
        }, 1000);
    }
}

function stop() {
    viteServer?.close();
    process.exit();
}

async function main() {
    await util.Share_Call()
    expressProcess = cluster.fork()
    expressProcess.on('message', (message) => {
        console.log(Chalk.blueBright(`[dev-server fork] `) + `${message}`);
    })
    const path = Path.join(__dirname, '..', 'src', 'server');
    Chokidar.watch(path, {
        cwd: path,
    }).on('change', (path) => {
        if(expressProcess != null && !lock){
            lock = true
            console.log(Chalk.blueBright(`[express] `) + `Change in ${path}. reloading... 🚀`);
            restartExpress();
        }
    });
}

async function clus() {
    console.log(`${Chalk.greenBright('=======================================')}`);
    console.log(`${Chalk.greenBright('Starting Express + Vite Dev Server...')}`);
    console.log(`${Chalk.greenBright('=======================================')}`);

    rendererMiddle = await startRenderer();
    startExpress();

    process.on('SIGTERM', () => {
        stop()
    })
}

if (require.main === module) {
    if(cluster.isPrimary){
        main()
    }else{
        clus()
    }
}
