import type { ThemeDefinition } from 'vuetify'

export const lightThemeName = 'GPIOViewerThemeLight'
export const darkThemeName = 'GPIOViewerThemeDark'
export const themeStorageKey = 'gpioviewer-theme'

export const GPIOViewerThemeLight: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#f5f7fb',
    surface: '#ffffff',
    primary: '#1f2a44',
    secondary: '#e6e9ef',
    error: '#b42318',
    info: '#2563eb',
    success: '#15803d',
    warning: '#c2410c',
    'on-background': '#172033',
    'on-surface': '#1f2937',
    'on-primary': '#ffffff',
    'on-secondary': '#172033'
  }
}

export const GPIOViewerThemeDark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    primary: '#162033',
    secondary: '#263244',
    error: '#f87171',
    info: '#60a5fa',
    success: '#34d399',
    warning: '#fb923c',
    'on-background': '#e5edf8',
    'on-surface': '#f8fafc',
    'on-primary': '#f8fafc',
    'on-secondary': '#f8fafc'
  }
}

export function isKnownThemeName(themeName: string | null): themeName is typeof lightThemeName | typeof darkThemeName {
  return themeName === lightThemeName || themeName === darkThemeName
}
