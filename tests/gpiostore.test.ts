import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { gpioStore } from '@/stores/gpiostore'
import { PinModeValue } from '@/const'
import type { PinMode } from '@/types/types'

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

  it('reads pin modes represented as strings by firmware', () => {
    const store = gpioStore()
    store.pinModes = [{ pin: '12', mode: String(PinModeValue.OUTPUT), label: 'IRSend_1' }]

    expect(store.getPinModeValue(12)).toBe(PinModeValue.OUTPUT)
    expect(store.getPinLabel(12)).toBe('IRSend_1')
  })
})

describe('gpioStore pin labels', () => {
  it('keeps labels unavailable for unloaded or older firmware responses', () => {
    const store = gpioStore()

    expect(store.getPinLabel(5)).toBe('')
    expect(store.hasPinLabels).toBe(false)

    store.pinModes = [{ pin: 5, mode: PinModeValue.OUTPUT }]

    expect(store.getPinLabel(5)).toBe('')
    expect(store.getPinLabel(6)).toBe('')
    expect(store.hasPinLabels).toBe(false)
  })

  it('returns trimmed labels for numeric and string GPIO identifiers', () => {
    const store = gpioStore()
    store.pinModes = [
      { pin: 0, mode: 3, label: ' Relay1 ' },
      { pin: '16', mode: '3', label: 'Relay_i1' }
    ]

    expect(store.getPinLabel(0)).toBe('Relay1')
    expect(store.getPinLabel(16)).toBe('Relay_i1')
    expect(store.getPinLabel(17)).toBe('')
    expect(store.hasPinLabels).toBe(true)
  })

  it.each([undefined, '', ' \t\n ', null, 42, {}, []])('ignores an empty or malformed label: %j', (label) => {
    const store = gpioStore()
    // HTTP responses can contain values outside the declared firmware contract.
    store.pinModes = [{ pin: '5', mode: '3', label }] as unknown as PinMode[]

    expect(store.getPinLabel(5)).toBe('')
    expect(store.hasPinLabels).toBe(false)
  })

  it('updates label availability when metadata arrives, changes, or is cleared', () => {
    const store = gpioStore()
    expect(store.hasPinLabels).toBe(false)

    store.pinModes = [{ pin: 5, mode: 3, label: 'Relay1' }]
    expect(store.hasPinLabels).toBe(true)
    expect(store.getPinLabel(5)).toBe('Relay1')

    store.pinModes[0]!.label = '  '
    expect(store.hasPinLabels).toBe(false)
    expect(store.getPinLabel(5)).toBe('')

    store.pinModes[0]!.label = 'Switch1'
    expect(store.hasPinLabels).toBe(true)
    expect(store.getPinLabel(5)).toBe('Switch1')

    store.pinModes = null
    expect(store.hasPinLabels).toBe(false)
    expect(store.getPinLabel(5)).toBe('')
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
