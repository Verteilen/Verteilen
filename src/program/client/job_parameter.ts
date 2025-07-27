// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Header, Setter } from "../interface"

export class ClientJobParameter {
    /**
     * Update parameter number on the cluster server
     * @param data Target KeyValue
     */
    feedbacknumber = (data:Setter) => {
        this.feedback("feedbacknumber", data)
    }
    feedbackboolean = (data:Setter) => {
        this.feedback("feedbackboolean", data)
    }
    feedbackstring = (data:Setter) => {
        this.feedback("feedbackstring", data)
    }
    feedbackobject = (data:Setter) => {
        this.feedback("feedbackobject", data)
    }
    feedbacklist = (data:Setter) => {
        this.feedback("feedbacklist", data)
    }
    feedbackselect = (data:Setter) => {
        this.feedback("feedbackselect", data)
    }
    private feedback = (title:string, data:Setter) => {
        const p:Header = {
            name: title,
            data: {
                key: data.key,
                value: data.value
            }
        }
        console.log(JSON.stringify(p))
    }
}