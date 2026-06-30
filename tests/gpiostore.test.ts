import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { gpioStore } from '@/stores/gpiostore'
import { PinModeValue } from '@/const'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('gpioStore.getPinModeValue', () => {
  it('returns unavailable when pin modes have not loaded', () => {
    const store = gpioStore()

    expect(store.getPinModeValue(5)).toBe(PinModeValue.UNAVAILABLE)
  })

  it('returns the matching pin mode or not set when missing', () => {
    const store = gpioStore()
    store.pinModes = [
      { pin: 5, mode: PinModeValue.OUTPUT },
      { pin: 6, mode: PinModeValue.INPUT_PULLUP }
    ]

    expect(store.getPinModeValue(5)).toBe(PinModeValue.OUTPUT)
    expect(store.getPinModeValue(6)).toBe(PinModeValue.INPUT_PULLUP)
    expect(store.getPinModeValue(7)).toBe(PinModeValue.NOT_SET)
  })
})

describe('gpioStore.getPinFunction', () => {
  it('returns no functions when board pin functions have not loaded', () => {
    const store = gpioStore()

    expect(store.getPinFunction(1)).toEqual([])
  })

  it('collects matching functions across function groups', () => {
    const store = gpioStore()
    store.boardPinFunctions = {
      boardpinsfunction: [
        {
          name: 'bus',
          functions: [
            { pin: 1, function: 'SDA' },
            { pin: 2, function: 'SCL' }
          ]
        },
        {
          name: 'display',
          functions: [
            { pin: 1, function: 'CS' },
            { pin: 3, function: 'DC' }
          ]
        }
      ]
    }

    expect(store.getPinFunction(1)).toEqual([
      { pin: 1, function: 'SDA' },
      { pin: 1, function: 'CS' }
    ])
    expect(store.getPinFunction(4)).toEqual([])
  })
})
