import ProgressBar from 'progress'
import { Downloader } from 'nodejs-file-downloader'
import byteSize from "byte-size";
import path from 'path'
import * as fs from 'fs'

const location:string = "https://raw.githubusercontent.com/Verteilen/worker/refs/heads/main/location.json"

export const checker = async () => {
    let exe = ""
    let link = ""
    const folder = path.join(__dirname, "..", "bin")
    console.log("Detect platform: ", process.platform)
    if(process.platform == 'win32') exe = path.join(folder, "worker.exe");
    else exe = path.join(folder, "worker");
    if(fs.existsSync(exe)) return
    if(!fs.existsSync(folder)) fs.mkdirSync(folder)

    const res = await fetch(location)
    const loca = JSON.parse((await res.text()))
    if(process.platform == 'win32') link = loca.windows;
    else link = loca.linux;
    return new Promise<void>(async (resolve, reject) => {
        let p = true
        const bar = new ProgressBar("[:bar] :remaining", {total: 100})
        console.log(`start download worker executable from ${link}`)
        const download = new Downloader({
            url: link,
            directory: folder,
            onError: (err => {
                console.error(err)
            }),
            onProgress: (per, chunk, remaining) => {
                const r = byteSize(remaining)
                bar.update(Number(per.replace("%", "")) / 100, {
                    "bar": per,
                    "remaining": `${r.value} ${r.unit}`
                })
            }
        })
        try{
            await download.download()
            resolve()
        }catch(error:any) {
            console.error(error)
            reject(error.message)
        }
    })
}