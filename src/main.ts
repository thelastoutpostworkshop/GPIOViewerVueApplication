import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import {
  GPIOViewerThemeDark,
  GPIOViewerThemeLight,
  lightThemeName
} from './theme'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: lightThemeName,
    themes: {
      GPIOViewerThemeDark,GPIOViewerThemeLight
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(pinia)

app.mount('#app')
