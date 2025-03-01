import { AppConfig } from "./interface";

export const checkifElectron = ():boolean => {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}

const _checkIfExpress = async ():Promise<boolean> => {
    const p = await fetch('express')
    const t = await p.text()
    return t == '1' || t == 'true'
}

export const checkIfExpress = (feedback:(e:boolean)=>void) => {
    _checkIfExpress().then(x => {
        feedback(x)
    }).catch(err => {
        feedback(false)
    })
}

export const waitSetup = async (config:AppConfig):Promise<AppConfig> => {
    return new Promise<AppConfig>((resolve, reject) => {
        if(config.isExpress != undefined){
            resolve(config)
            return
        }
        let count = 0
        let max = 1500
        let timer:any

        timer = setInterval(() => {
            count += 100
            if(config.isExpress != undefined){
                clearInterval(timer)
                resolve(config)
                return
            }
            if(count > max){
                clearInterval(timer)
                reject()
                return
            }
        }, 100);
    })
}