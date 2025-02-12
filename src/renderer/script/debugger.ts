export const messager = (msg:string, tag?:string) => tag != undefined ? console.log(`[${tag}] ${msg}`) : console.log(`[後台訊息] ${msg}`)

export const messager_log = (msg:string, tag?:string) => {
    window.electronAPI.send('message', msg, tag);
    
}