
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

const _checkIfExpress = async ():Promise<number> => {
    const p = await fetch('express')
    const t = await p.text()
    return Number(t)
}

export const checkIfExpress = (feedback:(e:number)=>void) => {
    _checkIfExpress().then(x => {
        feedback(x)
    }).catch(err => {
        feedback(-1)
    })
}