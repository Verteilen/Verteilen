import { Ref } from "vue"
import { MESSAGE_LIMIT } from "../../interface"
import { DATA } from "./server"



export class Util_Server_Self {
    data:Ref<DATA>

    constructor (_data:Ref<DATA>){
        this.data = _data
        this.data.value.messages.push(
            {
                s: true,
                tag: "client",
                title: "Main Information",
                text: []
            }
        )
    }

    clearMessage = () => {
        this.data.value.messages = [
            {
                s: true,
                tag: "client",
                title: "客戶端訊息",
                text: [
                    "[介面] 訊息清空"
                ]
            }
        ]
    }

    msgAppend = (d:{msg:string, tag?:string}) => {
        if(d.tag == undefined){
            this.data.value.messages[0].text.push(d.msg)
            if(this.data.value.messages[0].text.length > MESSAGE_LIMIT){
                this.data.value.messages.shift()
            }
        }else{
            const index = this.data.value.messages.findIndex(x => x.tag == d.tag)
            if(index == -1){
                this.data.value.messages.push({
                    s: true,
                    tag: d.tag,
                    title: d.tag,
                    text: [d.msg]
                })
            }else{
                this.data.value.messages[index].text.push(d.msg)
                if(this.data.value.messages[index].text.length > MESSAGE_LIMIT){
                    this.data.value.messages[index].text.shift()
                }
            }
        }
    }
}