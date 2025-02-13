let feedback:Function | undefined = undefined

export const set_feedback = (_feedback:Function) => {
    feedback = _feedback
}

export const messager = (msg:string, tag?:string) => {
    const text = tag != undefined ? `[${tag}] ${msg}` : `[後台訊息] ${msg}`
    console.log(text)
    if (feedback != undefined) feedback(text)
}

export const messager_log = (msg:string, tag?:string) => {
    messager(msg, tag)
    window.electronAPI.send('message', msg, tag);
    
}