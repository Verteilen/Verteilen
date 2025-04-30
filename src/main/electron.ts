import { app, BrowserWindow, globalShortcut, powerSaveBlocker, session } from 'electron';
import { join } from 'path';
import './client/client';
import { backendEvent } from './event';
import './plugins/i18n';

export let mainWindow:BrowserWindow | undefined = undefined

const id1 = powerSaveBlocker.start('prevent-display-sleep')
const id2 = powerSaveBlocker.start('prevent-app-suspension')
console.log("prevent-display-sleep: ", powerSaveBlocker.isStarted(id1))
console.log("prevent-app-suspension: ", powerSaveBlocker.isStarted(id2))

app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            devTools: true,
            backgroundThrottling: false
        }
    });

    
    mainWindow.on('minimize', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('maximize', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('hide', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('show', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('move', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('blur', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
    })
    mainWindow.on('focus', () => {
        mainWindow?.webContents.setBackgroundThrottling(false)
        setTimeout(() => {
            mainWindow?.setTitle(`Compute Tool ${process.env.NODE_ENV === 'development' ? process.env.npm_package_version : app.getVersion()}`)    
        }, 1000);
    })

    backendEvent.EventInit()

    if (process.env.NODE_ENV === 'development') {
        const rendererPort = process.argv[2];
        mainWindow.loadURL(`http://localhost:${rendererPort}`);
    }
    else {
        mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
    }
    mainWindow.setMenu(null)
}

export function RUN(){
    app.whenReady().then(() => {
        globalShortcut.register('Alt+CommandOrControl+I', () => {
            mainWindow?.webContents.openDevTools();
        })
    }).then(() => {
    createWindow();
    
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
        responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ['script-src \'self\'']
        }
        })
    })
    
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    });
    
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit()
    });
}

