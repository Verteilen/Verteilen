import { Header, Setter } from "../interface";
import { Client } from "./client";

export class ClientParameter {
    client:Client

    constructor(_client:Client){
        this.client = _client
    }

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