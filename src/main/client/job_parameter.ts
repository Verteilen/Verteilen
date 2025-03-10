import { parentPort } from "worker_threads"
import { Header, Setter } from "../interface"

export class ClientJobParameter {
    /**
     * Update parameter number on the cluster server
     * @param data Target KeyValue
     */
    feedbacknumber = (data:Setter) => {
        const p:Header = {
            name: "feedbacknumber",
            data: {
                key: data.key,
                value: data.value
            }
        }
        parentPort?.postMessage(p)
    }

    feedbackboolean = (data:Setter) => {
        const p:Header = {
            name: "feedbackboolean",
            data: {
                key: data.key,
                value: data.value
            }
        }
        parentPort?.postMessage(p)
    }

    feedbackstring = (data:Setter) => {
        const p:Header = {
            name: "feedbackstring",
            data: {
                key: data.key,
                value: data.value
            }
        }
        parentPort?.postMessage(p)
    }
}