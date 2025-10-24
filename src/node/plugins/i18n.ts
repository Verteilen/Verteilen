// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { createI18n } from 'vue-i18n'
import en from './../lan/en.json'
import zh_TW from './../lan/zh_TW.json'

export const i18nData = {
    locale: 'en',
    globalInjection: true,
    fallbackFormat: 'en',
    messages: {
        en: en,
        zh_TW: zh_TW
    }
}

export const i18n = createI18n(i18nData)