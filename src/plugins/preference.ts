import { Plugin, ref, Ref } from "vue";
import { CreatePreference, Preference } from "verteilen-core/dist/interface";

const value:Ref<Preference> = ref(CreatePreference())

export const preference:Plugin = {
    install(app, ...options) {
        app.provide("preference", value)
    },
}