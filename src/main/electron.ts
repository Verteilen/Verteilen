import { app, autoUpdater, BrowserWindow, dialog, globalShortcut, powerSaveBlocker, session } from 'electron';
import { join } from 'path';
import { backendEvent } from './event';
import { existsSync, mkdirSync } from 'fs';
import { DATA_FOLDER } from 'verteilen-core';
import { homedir } from 'os';
import { CreateServer } from './event_http';

export let mainWindow:BrowserWindow | undefined = undefined
let updater:NodeJS.Timeout | undefined = undefined

const updateServer = 'https://updater-vdwc.vercel.app/'
const version = app.getVersion()
const updateUrl = `${updateServer}/update/${process.platform}/${version}`
const id1 = powerSaveBlocker.start('prevent-display-sleep')
const id2 = powerSaveBlocker.start('prevent-app-suspension')
console.log("prevent-display-sleep: ", powerSaveBlocker.isStarted(id1))
console.log("prevent-app-suspension: ", powerSaveBlocker.isStarted(id2))

app.commandLine.appendSwitch('--no-sandbox')
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
console.log(`Application info: ${process.platform}/${version}`)
autoUpdater.setFeedURL({ url: updateUrl })

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts:Electron.MessageBoxOptions = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail:
        'A new version has been downloaded. Restart the application to apply the updates.'
    }
    
    dialog.showMessageBox(mainWindow!, dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall()
        }
    )
})
autoUpdater.on('error', (message) => {
    console.error('There was a problem updating the application')
    console.error(message)
})

function createWindow () {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1280,
        minHeight: 800,
        icon: join(__dirname, 'assets', 'icon.png'),
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
            mainWindow?.setTitle(`Verteilen ${process.env.NODE_ENV === 'development' ? process.env.npm_package_version : app.getVersion()}`)    
        }, 1000);
    })

    backendEvent.EventInit()

    if (process.env.NODE_ENV === 'development') {
        const rendererPort = process.argv[2];
        mainWindow.loadURL(`http://localhost:${rendererPort}`);
        mainWindow.webContents.openDevTools()
    }
    else {
        mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
    }
    mainWindow.setMenu(null)
}

export function RUN(){
    const call = app.whenReady().then(() => {
        globalShortcut.register('Shift+CommandOrControl+I', () => {
            mainWindow?.webContents.openDevTools();
        })
        updater = setInterval(() => {
            autoUpdater.checkForUpdates()
        }, 60000);
        CreateServer()

        const tempPath = join(homedir(), DATA_FOLDER, "temp")
        if(!existsSync(tempPath)) mkdirSync(tempPath)
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

    app.on('before-quit', (event) => {
        console.log('Before Quit Event')
        if(updater != undefined) clearInterval(updater)
        mainWindow = undefined
        backendEvent.DestroyClient()
    })

    return call
}

