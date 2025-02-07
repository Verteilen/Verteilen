import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { BootstrapVue3 } from 'bootstrap-vue-3';
import { basicSetup } from 'codemirror';
import { createApp } from 'vue';
import VueCodemirror from 'vue-codemirror';
import App from './App.vue';
import './style.css';

import "bootstrap-vue-3/dist/bootstrap-vue-3.css";
import "bootstrap/dist/css/bootstrap.css";
import mitt, { Emitter } from 'mitt';
import { BusType } from './interface';

const emitter:Emitter<BusType> = mitt<BusType>()

const app = createApp(App)

app.provide('emitter', emitter)

app.use(BootstrapVue3)
app.use(VueCodemirror, {
    autofocus: true,
    disabled: false,
    indentWithTab: true,
    tabSize: 2,
    extensions: [basicSetup, StreamLanguage.define(lua)]
})

app.mount('#app');
