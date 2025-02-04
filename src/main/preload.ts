import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message: string) => ipcRenderer.send('message', message),
  sendFeedbackMessage: (message: string) => ipcRenderer.invoke('message', message)
})
