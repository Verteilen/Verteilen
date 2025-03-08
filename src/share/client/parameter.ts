import { Header, Setter } from "../interface";
import { Client } from "./client";

/**
 * The parameter feedback helper\
 * Update the main parameter container on the cluster server
 */
export class ClientParameter {
    private client:Client

    constructor(_client:Client){
        this.client = _client
    }

    /**
     * Update parameter number on the cluster server
     * @param data Target KeyValue
     */
    feedbacknumber = (data:Setter) => {
        if(this.client.source == undefined) return
        const p:Header = {
            name: "feedback_number",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.client.source.send(JSON.stringify(p, null, 2))
    }
    /**
     * Update parameter boolean on the cluster server
     * @param data Target KeyValue
     */
    feedbackboolean = (data:Setter) => {
        if(this.client.source == undefined) return
        const p:Header = {
            name: "feedback_boolean",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.client.source.send(JSON.stringify(p, null, 2))
    }
    /**
     * Update parameter string on the cluster server
     * @param data Target KeyValue
     */
    feedbackstring = (data:Setter) => {
        if(this.client.source == undefined) return
        const p:Header = {
            name: "feedback_string",
            data: {
                key: data.key,
                value: data.value
            }
        }
        this.client.source.send(JSON.stringify(p, null, 2))
    }
}