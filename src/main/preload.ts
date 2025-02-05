import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  sendFeedbackMessage: (message: string) => ipcRenderer.invoke('message', message),
  modeSelect: (isClient: boolean) => ipcRenderer.send('modeSelect', isClient),
  eventOn: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.on(channel, listener),
  eventOff: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => ipcRenderer.off(channel, listener)
})
