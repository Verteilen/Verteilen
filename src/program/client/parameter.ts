// ========================
//                           
//      Share Codebase     
//                           
// ========================
import WebSocket from "ws";
import { Header, Setter } from "../interface";

/**
 * The parameter feedback helper\
 * Update the main parameter container on the cluster server
 */
export class ClientParameter {
    private source:WebSocket | undefined

    constructor(_source:WebSocket | undefined){
        this.source = _source
    }

    /**
     * Update parameter number on the cluster server
     * @param data Target KeyValue
     */
    feedbacknumber = (data:Setter) => {
        this.feedback("feedback_number", data)
    }
    /**
     * Update parameter boolean on the cluster server
     * @param data Target KeyValue
     */
    feedbackboolean = (data:Setter) => {
        this.feedback("feedback_boolean", data)
    }
    /**
     * Update parameter string on the cluster server
     * @param data Target KeyValue
     */
    feedbackstring = (data:Setter) => {
        this.feedback("feedback_string", data)
    }
    feedbackobject = (data:Setter) => {
        this.feedback("feedback_object", data)
    }
    feedbacklist = (data:Setter) => {
        this.feedback("feedback_list", data)
    }
    feedbackselect = (data:Setter) => {
        this.feedback("feedback_select", data)
    }
    private feedback = (title:string, data:Setter) => {
        if(this.source == undefined) return
        const p:Header = {
            name: title,
            data: data
        }
        this.source.send(JSON.stringify(p, null, 2))
    }
}