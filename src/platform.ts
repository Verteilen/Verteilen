import { BackendType, UserProfileClient } from "verteilen-core";

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
    return new Promise<BackendType | undefined>((resolve) => {
        _checkExpressType().then(x => (typeof x == "number") ? resolve(x) : resolve(undefined))
        .catch(err => resolve(undefined))
    })
}