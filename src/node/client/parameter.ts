import WebSocket from "ws";
import { Header, Setter } from "../interface";

/**
 * The parameter feedback helper\
 * Update the main parameter container on the cluster server
 */
export class ClientParameter {
    private source:WebSocket

    constructor(_source:WebSocket){
        this.source = _source
    }

    /**
     * Update parameter number on the cluster server
     * @param data Target KeyValue
     */
    feedbacknumber = (data:Setter) => {
        if(this.source == undefined) return
        const p:Header = {
            name: "feedback_number",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.source.send(JSON.stringify(p, null, 2))
    }
    /**
     * Update parameter boolean on the cluster server
     * @param data Target KeyValue
     */
    feedbackboolean = (data:Setter) => {
        if(this.source == undefined) return
        const p:Header = {
            name: "feedback_boolean",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.source.send(JSON.stringify(p, null, 2))
    }
    /**
     * Update parameter string on the cluster server
     * @param data Target KeyValue
     */
    feedbackstring = (data:Setter) => {
        if(this.source == undefined) return
        const p:Header = {
            name: "feedback_string",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.source.send(JSON.stringify(p, null, 2))
    }
}