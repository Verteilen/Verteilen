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
                tag: "Main Information",
                title: "Main Information",
                text: [
                    "[Interfaca] Clean messages"
                ]
            }
        ]
    }

    msgAppend = (d:Array<string | undefined>) => {
        if(d[1] == undefined){
            this.data.value.messages[0].text.push(d[0]!)
            if(this.data.value.messages[0].text.length > MESSAGE_LIMIT){
                this.data.value.messages.shift()
            }
        }else{
            const index = this.data.value.messages.findIndex(x => x.tag == d[1])
            if(index == -1){
                this.data.value.messages.push({
                    s: true,
                    tag: d[1],
                    title: d[1],
                    text: [d[0]!]
                })
            }else{
                this.data.value.messages[index].text.push(d[0]!)
                if(this.data.value.messages[index].text.length > MESSAGE_LIMIT){
                    this.data.value.messages[index].text.shift()
                }
            }
        }
    }
}