/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { darkThemeName, isKnownThemeName, lightThemeName, themeStorageKey } from '@/theme'

const mockTheme = vi.hoisted(() => {
  const theme = {
    global: {
      name: {
        value: 'GPIOViewerThemeLight'
      }
    },
    change: vi.fn((themeName: string) => {
      theme.global.name.value = themeName
    })
  }
  return theme
})

vi.mock('vuetify', () => ({
  useTheme: () => mockTheme
}))

beforeEach(() => {
  localStorage.clear()
  mockTheme.global.name.value = lightThemeName
  mockTheme.change.mockClear()
})

describe('theme configuration', () => {
  it('recognizes only configured app theme names', () => {
    expect(isKnownThemeName(lightThemeName)).toBe(true)
    expect(isKnownThemeName(darkThemeName)).toBe(true)
    expect(isKnownThemeName('dark')).toBe(false)
    expect(isKnownThemeName(null)).toBe(false)
  })
})

describe('useAppTheme', () => {
  it('loads a saved valid theme', () => {
    localStorage.setItem(themeStorageKey, darkThemeName)

    const appTheme = useAppTheme()
    appTheme.loadSavedTheme()

    expect(mockTheme.change).toHaveBeenCalledWith(darkThemeName)
    expect(appTheme.currentThemeName.value).toBe(darkThemeName)
    expect(appTheme.isDarkTheme.value).toBe(true)
  })

  it('ignores invalid saved theme names', () => {
    localStorage.setItem(themeStorageKey, 'unknown-theme')

    const appTheme = useAppTheme()
    appTheme.loadSavedTheme()

    expect(mockTheme.change).not.toHaveBeenCalled()
    expect(appTheme.currentThemeName.value).toBe(lightThemeName)
  })

  it('toggles between light and dark themes and persists the choice', async () => {
    const appTheme = useAppTheme()

    appTheme.toggleTheme()
    await nextTick()

    expect(mockTheme.change).toHaveBeenLastCalledWith(darkThemeName)
    expect(localStorage.getItem(themeStorageKey)).toBe(darkThemeName)

    mockTheme.global.name.value = darkThemeName
    const updatedAppTheme = useAppTheme()
    updatedAppTheme.toggleTheme()
    await nextTick()

    expect(mockTheme.change).toHaveBeenLastCalledWith(lightThemeName)
    expect(localStorage.getItem(themeStorageKey)).toBe(lightThemeName)
  })

  it('does not apply or persist unknown theme names', () => {
    const appTheme = useAppTheme()

    appTheme.setTheme('unknown-theme')

    expect(mockTheme.change).not.toHaveBeenCalled()
    expect(localStorage.getItem(themeStorageKey)).toBeNull()
    expect(appTheme.currentThemeName.value).toBe(lightThemeName)
  })
})
