/**
 * Renderer thread entry point
 */
import mitt, { Emitter } from 'mitt'
import { createApp } from 'vue'
import { BusType } from 'verteilen-core/src/interface'
import { vuetify } from "./plugins/vuetify"
import { i18n } from './plugins/i18n'
import App from './App.vue'
import JavascriptView from "./components/components/code/JavascriptView.vue"
import JsonView from "./components/components/code/JsonView.vue"
// @ts-ignore
import './style.scss'

/**
 * The global vue BroadcastChannel channel
 * @example //Reference it in other pages
 * import { Emitter } from 'mitt'
 * import { inject } from 'vue'
 * import { BusType } from 'verteilen-core/src/interface'
 * const emitter:Emitter<BusType> | undefined = inject('emitter');
 */
export const emitter:Emitter<BusType> = mitt<BusType>()

const app = createApp(App)
app.provide('emitter', emitter)
app.use(vuetify)
app.use(i18n)
app.component('codemirror-js', JavascriptView)
app.component('codemirror-json', JsonView)
app.mount('#app');