// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Header } from "../interface"

export class ClientHTTP {
    url: string
    method: string
    params: any

    constructor(_url:string, _method:string, _params:any){
        this.url = _url
        this.method = _method
        this.params = _params
    }

    RUN = () => {
        fetch(this.url, {
            method: this.method,
            body: this.params
        }).then(x => {
            x.text().then(y => {
                const h:Header = {
                    name: "result",
                    data: {
                        status: x.status,
                        statusText: x.statusText,
                        headers: x.headers,
                        ok: x.ok,
                        data: y
                    }
                }
                console.log(JSON.stringify(h))
            })
        }).catch((reason) => {
            const h:Header = {
                name: "error",
                data: reason
            }
            console.log(JSON.stringify(h))
        })
    }
}