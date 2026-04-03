import { Plugin } from "vue";
import mitt, { Emitter } from 'mitt'
import { BusType } from "../interface";

export const emitter:Emitter<BusType> = mitt<BusType>()

/**
 * The global vue BroadcastChannel channel
 * @example //Reference it in other pages
 * import { Emitter } from 'mitt'
 * import { inject } from 'vue'
 * import { BusType } from 'verteilen-core/src/interface'
 * const emitter:Emitter<BusType> | undefined = inject('emitter');
 */
export const bus:Plugin = {
    install(app, ...options) {
        app.provide("emitter", emitter)
    },
}