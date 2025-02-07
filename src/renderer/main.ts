import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { BootstrapVue3 } from 'bootstrap-vue-3';
import { basicSetup } from 'codemirror';
import mitt, { Emitter } from 'mitt';
import { createApp } from 'vue';
import VueCodemirror from 'vue-codemirror';
import App from './App.vue';
import { i18n } from "./i18n";
import { BusType } from './interface';

import "bootstrap-vue-3/dist/bootstrap-vue-3.css";
import "bootstrap/dist/css/bootstrap.css";
import './style.css';

const emitter:Emitter<BusType> = mitt<BusType>()
const app = createApp(App)

app.provide('emitter', emitter)
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
