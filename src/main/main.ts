import * as electron from './electron';
import { Client, Header, Single } from './interface';
import { checker } from './worker_download';

let client:Client | undefined = undefined

const messager = (msg:string, tag?:string) => {
  const str = tag != undefined ? `[${tag}] ${msg}` : `[Node Info] ${msg}`
  console.log(str);
}

const messager_log = (msg:string, tag?:string) => {
  const str = tag != undefined ? `[${tag}] ${msg}` : `[Node Info] ${msg}`
  console.log(str);
  if(client == undefined) return
  if(client.clients.length > 0) {
      // 不用 message 是因為伺服器會需要知道 此訊息是從哪一個客戶端送出的
      const h:Single = { data: msg }
      const d:Header = { name: 'feedback_message', data: h}
      client.clients.forEach(x => x.send(JSON.stringify(d)))
  }
}

const a_client = process.argv.includes("--client")
const a_nogui = process.argv.includes("--nogui")

checker().then(() => {
  if (a_client && a_nogui){
    client = new Client(messager, messager_log)
    return client.Init()
  }else{
    return electron.RUN()
  }
})


