import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { VFileUpload } from 'vuetify/labs/VFileUpload'
import 'vuetify/styles'

export const vuetify = createVuetify({ 
    components: {
        ...components,
        VFileUpload
    },
    directives, 
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    theme: { 
        defaultTheme: 'dark'
    }
})

export const GetColor = (c:string) => {
    return vuetify.theme.current.value.colors[c]
}