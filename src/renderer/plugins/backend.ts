import { Plugin, Ref, ref } from "vue";
import { BackendProxy } from "../proxy";

const value:Ref<BackendProxy> = ref(new BackendProxy())

export const backend:Plugin = {
    install(app, ...options) {
        app.provide("backend", value)
    },
}