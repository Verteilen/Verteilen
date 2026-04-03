/**
 * Renderer thread entry point
 */
import { createApp } from 'vue'
import { vuetify } from "./plugins/vuetify"
import { i18n } from './plugins/i18n'
import { bus } from './plugins/bus'
import { preference } from './plugins/preference'
import { backend } from './plugins/backend'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import App from './App.vue'
import JavascriptView from "./components/components/code/JavascriptView.vue"
import JsonView from "./components/components/code/JsonView.vue"
// @ts-ignore
import './style.scss'

const intervalMS = 60 * 60 * 1000

const updateServiceWorker = useRegisterSW({
    onRegistered(r:any) {
        r && setInterval(() => {
            r.update()
        }, intervalMS)
    },
    onoffline: true
})

const app = createApp(App)
app.use(vuetify)
app.use(i18n)
app.use(bus)
app.use(preference)
app.use(backend)
app.component('codemirror-js', JavascriptView)
app.component('codemirror-json', JsonView)
app.mount('#app')