/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  formatBytes,
  formatHz,
  formatMacAddress,
  formatTime,
  getAPIUrl,
  getCookie,
  getPinModeDescription,
  pinBroadMode,
  setCookie
} from '@/functions'
import { gpioStore } from '@/stores/gpiostore'
import { PinModeBroad, PinModeDescription, PinModeValue, PinType } from '@/const'

beforeEach(() => {
  setActivePinia(createPinia())
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim()
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    }
  })
})

describe('formatBytes', () => {
  it('formats byte counts with expected units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('2 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2 MB')
    expect(formatBytes(undefined)).toBe('undefined')
  })
})

describe('formatHz', () => {
  it('formats frequencies with expected units', () => {
    expect(formatHz(500)).toBe('500 Hz')
    expect(formatHz(240_000)).toBe('240.00 KHz')
    expect(formatHz(240_000_000)).toBe('240.00 MHz')
    expect(formatHz(0)).toBe('undefined')
    expect(formatHz(undefined)).toBe('undefined')
  })
})

describe('formatMacAddress', () => {
  it('formats ESP chip ids as little-endian MAC addresses', () => {
    expect(formatMacAddress(0x112233445566)).toBe('66:55:44:33:22:11')
    expect(formatMacAddress(undefined)).toBe('unknown')
    expect(formatMacAddress(0)).toBe('unknown')
  })
})

describe('formatTime', () => {
  it('formats milliseconds as days and time', () => {
    expect(formatTime(90_061_000)).toBe('1d 01:01:01')
    expect(formatTime(1000)).toBe('0d 00:00:01')
    expect(formatTime(0)).toBe('unknown')
    expect(formatTime(undefined)).toBe('unknown')
  })
})

describe('getAPIUrl', () => {
  it('builds ESP32 API URLs from store network settings', () => {
    const store = gpioStore()
    store.ipAddress = '192.168.1.42'
    store.httpPort = 8080

    expect(getAPIUrl('pinmodes')).toBe('http://192.168.1.42:8080/pinmodes')
  })
})

describe('getPinModeDescription', () => {
  it('returns descriptions for known pin mode values', () => {
    expect(getPinModeDescription(PinModeValue.OUTPUT)).toBe(PinModeDescription.OUTPUT)
    expect(getPinModeDescription(PinModeValue.INPUT_PULLUP)).toBe(PinModeDescription.INPUT_PULLUP)
    expect(getPinModeDescription(999)).toBeUndefined()
  })
})

describe('pinBroadMode', () => {
  it('maps specific pin modes to broad output/input/unknown labels', () => {
    const store = gpioStore()
    store.pinModes = [
      { pin: 1, mode: PinModeValue.OUTPUT },
      { pin: 2, mode: PinModeValue.INPUT_PULLDOWN },
      { pin: 3, mode: PinModeValue.NOT_SET }
    ]

    expect(pinBroadMode(PinType.Digital, 1)).toBe(PinModeBroad.OUTPUT)
    expect(pinBroadMode(PinType.Digital, 2)).toBe(PinModeBroad.INPUT)
    expect(pinBroadMode(PinType.Digital, 3)).toBe(PinModeBroad.UNKNOWN)
    expect(pinBroadMode(PinType.Digital, 4)).toBe(PinModeBroad.UNKNOWN)
  })

  it('treats PWM pins as output even without an explicit pin mode', () => {
    expect(pinBroadMode(PinType.PWM, 9)).toBe(PinModeBroad.OUTPUT)
  })
})

describe('cookies', () => {
  it('sets and reads cookies by name', () => {
    setCookie('theme', 'dark')
    setCookie('selectedBoard', 'Generic View')

    expect(getCookie('theme')).toBe('dark')
    expect(getCookie('selectedBoard')).toBe('Generic View')
    expect(getCookie('missing')).toBeNull()
  })
})
