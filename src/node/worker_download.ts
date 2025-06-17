import ProgressBar from 'progress'
import https from 'https'
import path from 'path'
import * as fs from 'fs'

const location:string = "https://raw.githubusercontent.com/Verteilen/worker/refs/heads/main/location.json"

export const checker = async () => {
    let exe = ""
    let link = ""
    const folder = path.join(__dirname, "bin")
    if(process.platform == 'win32') exe = path.join(folder, "worker.exe");
    else exe = path.join(folder, "worker");
    if(fs.existsSync(exe)) return
    if(!fs.existsSync(folder)) fs.mkdirSync(folder)

    const res = await fetch(location)
    const loca = JSON.parse((await res.text()))
    if(process.platform == 'win32') link = loca.windows;
    else link = loca.linux;

    return new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(exe)
        console.log("start download worker executable")
        https.get(link, (res) => {
            res.pipe(file)

            const bar = new ProgressBar(":bar :current/total", {total: 100})
            res.on('data', chunk => {
                bar.tick(chunk.length)
            })
            res.on('end', function () {
                console.log('\n');
            });
        })
        file.on('finish', () => {
            file.close()
            console.log("download finish")
            resolve()
        })
    })
}