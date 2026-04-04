import { Plugin } from "vue";
import mitt, { Emitter } from 'mitt'
import { BusType } from "verteilen-core";

export const emitter:Emitter<BusType> = mitt<BusType>()

export const bus:Plugin = {
    install(app) {
        app.provide("emitter", emitter)
    },
}