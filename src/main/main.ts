import { app, BrowserWindow, session } from 'electron';
import { join } from 'path';
import './client/client';
import { eventInit } from './event';
import { menu_client } from './menu';
import './plugins/i18n';

export let mainWindow:BrowserWindow | undefined = undefined

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    darkTheme: true,
    backgroundColor: "#212121",
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    const rendererPort = process.argv[2];
    mainWindow.loadURL(`http://localhost:${rendererPort}`);
  }
  else {
    mainWindow.loadFile(join(app.getAppPath(), 'renderer', 'index.html'));
  }
  mainWindow.setMenu(menu_client)
  eventInit()

  if(process.env.NODE_ENV === 'development'){
    mainWindow?.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
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

