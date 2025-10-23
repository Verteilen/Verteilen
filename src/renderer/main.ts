/**
 * Renderer entry point
 */
import mitt, { Emitter } from 'mitt'
import { createApp } from 'vue'
import { BusType } from 'verteilen-core'
import { I18N } from "verteilen-core"
import { vuetify } from "./plugins/vuetify"
import App from './App.vue'
import JavascriptView from "./components/components/code/JavascriptView.vue"
import JsonView from "./components/components/code/JsonView.vue"
// @ts-ignore
import './style.scss'

export const emitter:Emitter<BusType> = mitt<BusType>()

const app = createApp(App)
app.provide('emitter', emitter)
app.use(vuetify)
app.use(I18N.i18n)
app.component('codemirror-js', JavascriptView)
app.component('codemirror-json', JsonView)
app.mount('#app');