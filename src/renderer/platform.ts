import { BackendType, UserProfileClient } from "./interface";

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

const _checkIfExpress = async ():Promise<any> => {
    const p = await fetch('user')
    const t = await p.text()
    return t
}

export const checkIfExpress = async ():Promise<UserProfileClient | undefined> => {
    return new Promise<UserProfileClient | undefined>((resolve) => {
        _checkIfExpress().then(x => resolve(JSON.parse(x)))
        .catch(err => resolve(undefined))
    })
}

const _checkExpressType = async ():Promise<any> => {
    const p = await fetch('express')
    const t = await p.text()
    return t
}

export const checkExpressType = async ():Promise<BackendType | undefined> => {
    return new Promise<number | undefined>((resolve) => {
        _checkExpressType().then(x => resolve(x))
        .catch(err => resolve(undefined))
    })
}