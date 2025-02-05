import BootstrapVue3 from 'bootstrap-vue-3';
import { createApp } from 'vue';
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

app.mount('#app');
