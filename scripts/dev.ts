process.env.NODE_ENV = 'development';

import Chalk from 'chalk';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import Chokidar from 'chokidar';
import { EOL } from 'os';
import Path from 'path';
import * as Vite from 'vite';
import compileTs from './private/tsc';
import * as util from './utility';

let viteServer:Vite.ViteDevServer | null = null;
let electronProcess:ChildProcessWithoutNullStreams | null = null;
let electronProcessLocker = false;
let rendererPort:number | undefined = 0;

async function startRenderer() {
    viteServer = await Vite.createServer({
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        mode: 'development',
    });

    return viteServer.listen();
}

async function startElectron() {
    if (electronProcess) { // single instance lock
        return;
    }

    try {
        await compileTs(Path.join(__dirname, '..', 'src', 'main'));
    } catch {
        console.log(Chalk.redBright('Could not start Electron because of the above typescript error(s).'));
        electronProcessLocker = false;
        return;
    }

    const args:Array<string> = [
        Path.join(__dirname, '..', 'node_modules', 'electron', 'cli.js'),
        Path.join(__dirname, '..', 'build', 'main', 'main.js'),
        rendererPort!.toString(),
        "--no-sandbox"
    ];
    electronProcess = spawn('node', args);
    electronProcessLocker = false;

    electronProcess?.stdout.on('data', data => {
        if (data == EOL) {
            return;
        }

        process.stdout.write(Chalk.blueBright(`[electron] `) + Chalk.white(data.toString()))
    });

    electronProcess?.stderr.on('data', data => 
        process.stderr.write(Chalk.blueBright(`[electron] `) + Chalk.white(data.toString()))
    );

    electronProcess?.on('exit', () => stop());
}

function restartElectron() {
    if (electronProcess) {
        electronProcess.removeAllListeners('exit');
        electronProcess.kill();
        electronProcess = null;
    }

    if (!electronProcessLocker) {
        electronProcessLocker = true;
        startElectron();
    }
}

function stop() {
    viteServer?.close();
    process.exit();
}

async function main() {
    await util.Share_Call()
    
    console.log(`${Chalk.greenBright('=======================================')}`);
    console.log(`${Chalk.greenBright('Starting Electron + Vite Dev Server...')}`);
    console.log(`${Chalk.greenBright('=======================================')}`);

    const devServer = await startRenderer();
    rendererPort = devServer.config.server.port;

    startElectron();

    const path = Path.join(__dirname, '..', 'src', 'main');
    Chokidar.watch(path, {
        cwd: path,
    }).on('change', (path) => {
        console.log(Chalk.blueBright(`[electron] `) + `Change in ${path}. reloading... 🚀`);
        restartElectron();
    });
}

if (require.main === module) {
    main();
}
