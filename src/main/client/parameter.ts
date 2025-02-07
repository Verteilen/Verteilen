import { Header, Setter } from "../interface";
import { source } from "./client";

export const feedbacknumber = (data:Setter) => {
    if(source == undefined) return
    const p:Header = {
        name: "feedback_number",
        data: {
            key: data.key,
            value: data.value
        }
    }
    source.send(JSON.stringify(p, null, 2))
}

export const feedbackboolean = (data:Setter) => {
    if(source == undefined) return
    const p:Header = {
        name: "feedback_boolean",
        data: {
            key: data.key,
            value: data.value
        }
    }
    source.send(JSON.stringify(p, null, 2))
}

export const feedbackstring = (data:Setter) => {
    if(source == undefined) return
    const p:Header = {
        name: "feedback_string",
        data: {
            key: data.key,
            value: data.value
        }
    }
    source.send(JSON.stringify(p, null, 2))
}