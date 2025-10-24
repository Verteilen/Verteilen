import ProgressBar from 'progress'
import byteSize from "byte-size";
import * as path from 'path'
import * as fs from 'fs'
import { Downloader } from 'nodejs-file-downloader'

/**
 * The official repo for placing json location.json which specified the executable location\
 * This includes the OS difference
 */
const location:string = "https://raw.githubusercontent.com/Verteilen/worker/refs/heads/main/location.json"

/**
 * This check if user have worker executable download\
 * If not it will get the worker executable download from the src {@link location}
 */
export const checker = async () => {
    let exe = ""
    let link = ""
    const folder = path.join(__dirname, "..", "bin")
    console.log("Detect platform: ", process.platform)
    if(process.platform == 'win32') exe = path.join(folder, "worker.exe");
    else exe = path.join(folder, "worker");
    if(!fs.existsSync(folder)) fs.mkdirSync(folder)
    if(fs.existsSync(exe)) return

    const res = await fetch(location)
    const loca = JSON.parse((await res.text()))
    if(process.platform == 'win32') link = loca.windows;
    else link = loca.linux;
    return new Promise<void>(async (resolve, reject) => {
        const bar = new ProgressBar("[:bar] :remaining", {total: 100})
        console.log(`start download worker executable from ${link} => ${exe}`)
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