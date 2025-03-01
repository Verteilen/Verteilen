import bcrypt from 'bcrypt';
import * as fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { JWT } from '../interface';

const saltRounds = 10;
const private_path = path.join(__dirname, 'encryption', 'private.pem')
const public_path = path.join(__dirname, 'encryption', 'public.pem')

let PRIVATEKEY = `-----BEGIN RSA PRIVATE KEY-----
MIIBVQIBADANBgkqhkiG9w0BAQEFAASCAT8wggE7AgEAAkEA0R+eEHrMSCKfHdNX6NaJMLjnBT8fYXfnk4HbWrOi8+IOzv/es7amam5bBAr4vjerE/5ZW3iJLRovwcldLqcNxQIDAQABAkA02/aSuM9pDmNE4TZv0saTq7EtaNKwSuQcq268QvrWBSF7SM6I9mdhuIz0FgBJlAbTCfxZoxrlW3QjdGfXM5UTAiEA5iw7fS/nJSYpOwQDyETk9XKm5Wj5FIL7tmTd9x1WLjMCIQDolr1WNsgynNQ/amO8hdX3x3wKoK+l3L9+vA1uX1XsJwIgZW0SXczRD1asjnvrasGpHtuB3c+PCtHZN3tlMDJ2Om8CIQDEsc3W3ic53jUEmDVWVhyYGaSF3FQOwXtUczYslAU22wIhAN81FSd8+DPrYNCIZeHx9s53VFJQnGa2GGrMOPO+N+LG
-----END RSA PRIVATE KEY-----`
let PUBLICKEY = `-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIteiiCrnSRSrl1F+NJgpQRXto9RskFpmKNjJhOLpNvj7IfPyky4TJRKLD99416j+NASEkx7s0Hce+cCiDxXUUUCAwEAAQ==
-----END PUBLIC KEY-----`


PRIVATEKEY = fs.existsSync(private_path) ? fs.readdirSync(private_path).toString() : PRIVATEKEY
PUBLICKEY = fs.existsSync(public_path) ? fs.readdirSync(public_path).toString() : PUBLICKEY

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
    }, PRIVATEKEY, { algorithm: 'RS256' })
    return token
}

export const Verify = async (token:string):Promise<string | jwt.JwtPayload> => {
    return new Promise<string | jwt.JwtPayload>((resolve, reject) => {
        jwt.verify(token, PUBLICKEY, (err, decoded) => {
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