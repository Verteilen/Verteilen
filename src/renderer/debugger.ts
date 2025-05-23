import { checkifElectron } from "./platform"

const isElectron = checkifElectron()
let feedback:Function | undefined = undefined

export const set_feedback = (_feedback:Function) => {
    feedback = _feedback
}

export const messager = (msg:string, tag?:string) => {
    const text = tag != undefined ? `[${tag}] ${msg}` : `[Normal] ${msg}`
    if(process.env.NODE_ENV === 'development') console.log(text)
    if (feedback != undefined) feedback(text)
}

export const messager_log = (msg:string, tag?:string) => {
    messager(msg, tag)
    if(!isElectron) return
    window.electronAPI.send('message', msg, tag);
    
}