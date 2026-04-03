import * as i from 'verteilen-core/dist/plugins/i18n'

export const i18n = i.Create({
    ...(i.i18nDefaultData),
    legacy: false
})