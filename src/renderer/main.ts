import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { BootstrapVue3 } from 'bootstrap-vue-3';
import { basicSetup } from 'codemirror';
import mitt, { Emitter } from 'mitt';
import { createApp, onMounted } from 'vue';
import VueCodemirror from 'vue-codemirror';
import { BusType } from './interface';
import { checkifElectron } from "./platform";
import { i18n } from "./plugins/i18n";

export const emitter:Emitter<BusType> = mitt<BusType>()
export const isElectron:boolean = checkifElectron()

import "bootstrap-vue-3/dist/bootstrap-vue-3.css";
import "bootstrap/dist/css/bootstrap.css";
import App from './App.vue';
import { vuetify } from "./plugins/vuetify";
import './style.scss';
;

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
onMounted(() => {
    
})
