import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { BootstrapVue3 } from 'bootstrap-vue-3';
import { basicSetup } from 'codemirror';
import mitt, { Emitter } from 'mitt';
import { createApp } from 'vue';
import VueCodemirror from 'vue-codemirror';
import { BusType } from './interface';
import { checkifElectron, checkIfExpress } from "./platform";
import { i18n } from "./plugins/i18n";

export const emitter:Emitter<BusType> = mitt<BusType>()
export const isElectron:boolean = checkifElectron()
export let isExpress:boolean = false 
export let serverConnection:ServerConnection | undefined = undefined

import "bootstrap-vue-3/dist/bootstrap-vue-3.css";
import "bootstrap/dist/css/bootstrap.css";
import App from './App.vue';
import { vuetify } from "./plugins/vuetify";
import { ServerConnection } from "./script/serverConnection";
import './style.scss';

const w1 = checkIfExpress()
const w2 = w1.then(x => {
    return new Promise<void>((resolve, reject) => {
        isExpress = x
        if(isExpress){
            serverConnection = new ServerConnection('ws://127.0.0.1')
            setTimeout(() => {
                if(serverConnection?.ws.readyState == WebSocket.OPEN){
                    resolve()
                }else{
                    reject()
                }
                return
            }, 1000);
        }else{
            resolve()
            return
        }
    })
    
})

Promise.allSettled([w2]).then(() => {
    const app = createApp(App)
    app.provide('emitter', emitter)
    app.use(vuetify)
    app.use(i18n)
    app.use(BootstrapVue3)
    app.use(VueCodemirror, {
        autofocus: true,
        disabled: false,
        indentWithTab: true,
        tabSize: 2,
        extensions: [basicSetup, StreamLanguage.define(lua)]
    })
    app.mount('#app');
})
