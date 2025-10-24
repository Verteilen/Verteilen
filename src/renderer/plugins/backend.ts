import { Plugin } from "vue";
import { BackendProxy } from "../proxy";

export const backend:Plugin = {
    install(app, ...options) {
        app.provide("backend", new BackendProxy())
    },
}