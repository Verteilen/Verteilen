import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (key:string, ...args:Array<any>) => ipcRenderer.send(key, args),
  invoke: (key:string, ...args:Array<any>) => ipcRenderer.invoke(key, args),

  eventOn: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on(channel, listener),
  eventOff: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.off(channel, listener)
})
