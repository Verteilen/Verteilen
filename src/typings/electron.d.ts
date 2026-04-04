/**
 * Should match main/preload.ts for typescript support in renderer
 */
export default interface ElectronApi {
  send: (key:string, ...args:Array<any>) => void,
  invoke: (key:string, ...args:Array<any>) => Promise<any>,

  eventOn: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void
  eventOff: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronApi,
  }
}
