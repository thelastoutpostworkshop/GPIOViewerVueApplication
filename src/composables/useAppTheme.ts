import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { darkThemeName, isKnownThemeName, lightThemeName, themeStorageKey } from '@/theme'

export function useAppTheme() {
  const theme = useTheme()

  const currentThemeName = computed(() => theme.global.name.value)
  const isDarkTheme = computed(() => currentThemeName.value === darkThemeName)

  function setTheme(themeName: string) {
    if (!isKnownThemeName(themeName)) {
      return
    }
    theme.change(themeName)
    localStorage.setItem(themeStorageKey, themeName)
  }

  function loadSavedTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey)
    if (isKnownThemeName(savedTheme)) {
      theme.change(savedTheme)
    }
  }

  function toggleTheme() {
    setTheme(isDarkTheme.value ? lightThemeName : darkThemeName)
  }

  return {
    currentThemeName,
    isDarkTheme,
    loadSavedTheme,
    setTheme,
    toggleTheme
  }
}
