import { StreamLanguage } from "@codemirror/language";
import { lua } from "@codemirror/legacy-modes/mode/lua";
import { basicSetup } from 'codemirror';
import mitt, { Emitter } from 'mitt';
import { createApp } from 'vue';
import VueCodemirror from 'vue-codemirror';
import App from './App.vue';
import { BusType } from './interface';
import { i18n } from "./plugins/i18n";
import { vuetify } from "./plugins/vuetify";

import './style.scss';

export const emitter:Emitter<BusType> = mitt<BusType>()

const app = createApp(App)
app.provide('emitter', emitter)
app.use(vuetify)
app.use(i18n)
app.use(VueCodemirror, {
    autofocus: true,
    disabled: false,
    indentWithTab: true,
    tabSize: 2,
    extensions: [basicSetup, StreamLanguage.define(lua)]
})
app.mount('#app');