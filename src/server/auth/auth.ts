import bcrypt from 'bcrypt';
import * as fs from 'fs';
import jwt from 'jsonwebtoken';
import keypair from 'keypair';
import path from 'path';
import { JWT } from '../interface';

const saltRounds = 10;
const pair = keypair()

export const Auth = async (username:string, password:string):Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
        const p = path.join(__dirname, username)
        if(!fs.existsSync(p)) {
            return false
        }
        const pconfig = path.join(p, 'config.json')
        if(!fs.existsSync(pconfig)) {
            return false
        }
        const config = JSON.parse(fs.readFileSync(pconfig).toString())
        bcrypt.compare(password, config.hash, (err, result) => {
            if(err) return false
            return result
        });
    })
    
}

export const Register = async (username:string, password:string):Promise<string | undefined> => {
    return new Promise<string | undefined>((resolve, reject) => {
        bcrypt.genSalt(saltRounds, (err, salt) => {
            if(err) {
                resolve(undefined)
                return
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if(err) {
                    resolve(undefined)
                    return
                }
                const p = path.join(__dirname, username)
                if(!fs.existsSync(p)) {
                    fs.mkdirSync(p)
                }
                const pconfig = path.join(p, 'config.json')
                if(!fs.existsSync(pconfig)) {
                    fs.writeFileSync(pconfig, JSON.stringify({
                        hash: hash
                    }, null, 4))
                }
            });
        });
    })
}

export const GenerateToken = (username: string, date:Date) => {
    const token = jwt.sign({
        user: username,
        create: Date.now(),
        expire: date.getTime()
    }, pair.private, { algorithm: 'RS256' })
    return token
}

export const Verify = async (token:string):Promise<string | jwt.JwtPayload> => {
    return new Promise<string | jwt.JwtPayload>((resolve, reject) => {
        jwt.verify(token, pair.public, (err, decoded) => {
            if(decoded == undefined || err) return false
            resolve(decoded)
        })
    })
}

export const Pass = (data:JWT):boolean => {
    return data.expire > Date.now()
}

export const QuickVerify = async (token:string):Promise<[boolean, string]> => {
    return new Promise<[boolean, string]>((resolve) => {
        Verify(token).then(x => {
            const jwt:JWT = JSON.parse(x.toString())
            const passed = Pass(jwt)
            resolve([passed, jwt.user])
        }).catch(err => {
            resolve([false, ''])
        })
    })
}