import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify, type ThemeDefinition } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const GPIOViewerTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#1a2639',
    'primary-darken-1': '#3700B3',
    secondary: '#d9dad7',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'GPIOViewerTheme',
    themes: {
      GPIOViewerTheme,
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
