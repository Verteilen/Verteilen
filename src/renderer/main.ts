import mitt, { Emitter } from 'mitt';
import { createApp } from 'vue';
import App from './App.vue';
import JavascriptView from "./components/components/code/JavascriptView.vue";
import JsonView from "./components/components/code/JsonView.vue";
import { BusType } from './interface';
import { i18n } from "./plugins/i18n";
import { vuetify } from "./plugins/vuetify";

import './style.scss';

export const emitter:Emitter<BusType> = mitt<BusType>()

const app = createApp(App)
app.provide('emitter', emitter)
app.use(vuetify)
app.use(i18n)
app.component('codemirror-js', JavascriptView)
app.component('codemirror-json', JsonView)
app.mount('#app');