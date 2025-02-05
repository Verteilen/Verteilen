/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  sendMessage: (message: string) => void
  sendFeedbackMessage: (message: string) => Promise<any>
  modeSelect: (isClient: boolean) => void
  eventOn: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void
  eventOff: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronApi,
  }
}
