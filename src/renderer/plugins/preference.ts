import { Plugin } from "vue";
import { CreatePreference } from "../interface";

export const preference:Plugin = {
    install(app, ...options) {
        app.provide("preference", CreatePreference())
    },
}