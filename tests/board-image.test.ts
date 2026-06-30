/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import BoardImage from '@/components/BoardImage.vue'
import { gpioStore } from '@/stores/gpiostore'
import { DigitalValuesDisplay, PinDisplayTypeShort, PinType, WifiFeedbackConfigKey } from '@/const'
import type { BoardData, PinsConfiguration } from '@/types/types'

const board: BoardData = {
  name: 'Test Board',
  css: '',
  image: 'devboards_images/test-board.png',
  pins: 'indicators/test-board.json',
  chipname: 'ESP32'
}

const indicators: PinsConfiguration = {
  pins: [
    {
      gpioid: 5,
      top: 10,
      left: 20,
      color: '',
      valueJustify: 0,
      valueFontSize: 1.2,
      displayValue: '',
      displayBarValue: 0,
      displayType: '',
      type: PinType.Digital
    },
    {
      gpioid: 6,
      top: 40,
      left: 75,
      color: '',
      valueJustify: -2,
      valueFontSize: 1.2,
      displayValue: '',
      displayBarValue: 0,
      displayType: '',
      type: PinType.Analog
    }
  ],
  settings: {
    pinWidth: 4,
    pinHeight: 3,
    showPinNumber: true,
    valueBackGroundColor: '',
    valueMinWidth: 12,
    valuePinMargin: 5,
    valueFontSize: 1.5
  },
  stats: {
    top: 60,
    left: 15,
    fontSize: 1.4,
    gap: 4
  },
  wifiFeedback: {
    top: 2,
    left: 25,
    width: 8,
    background: WifiFeedbackConfigKey.Light
  }
}

function cloneIndicators() {
  return structuredClone(indicators)
}

function mockIndicatorFetch(config: PinsConfiguration = cloneIndicators()) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => structuredClone(config)
  })) as unknown as typeof fetch

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function mountBoardImage() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(BoardImage, {
    props: {
      board
    },
    global: {
      plugins: [pinia],
      stubs: {
        PinInfo: true
      }
    }
  })

  await flushPromises()
  await nextTick()

  return {
    wrapper,
    store: gpioStore()
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BoardImage', () => {
  it('loads indicators and renders the board image with positioned pins', async () => {
    const fetchMock = mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    expect(fetchMock).toHaveBeenCalledWith(board.pins)
    expect(wrapper.find('img.board-image').attributes('src')).toBe(board.image)
    expect(store.pinTypeDisplay).toBe(0)
    expect(store.magnifyImage).toBe(80)

    const pinElements = wrapper.findAll('.indicator')
    expect(pinElements).toHaveLength(indicators.pins.length)
    expect(pinElements[0].attributes('style')).toContain('top: 10%;')
    expect(pinElements[0].attributes('style')).toContain('left: 20%;')
    expect(pinElements[0].attributes('style')).toContain('width: 4%;')
    expect(pinElements[0].attributes('style')).toContain('height: 3%;')
    expect(pinElements[0].text()).toBe('5')
  })

  it('updates pin display values, colors, and value bars from store state', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    store.currentStates = {
      5: { s: 255, t: PinType.Digital, v: 1 },
      6: { s: 128, t: PinType.Analog, v: 512 }
    }

    await nextTick()

    const pinElements = wrapper.findAll('.indicator')
    expect(pinElements[0].element.style.backgroundColor).toBe('rgb(255, 0, 0)')
    expect(pinElements[1].element.style.backgroundColor).not.toBe('')

    const horizontalValue = wrapper.find('.value')
    expect(horizontalValue.text()).toContain(DigitalValuesDisplay.High)
    expect(horizontalValue.find('.value-bar').attributes('style')).toContain('width: 100%')

    const verticalValue = wrapper.find('.value_vertical')
    expect(verticalValue.text()).toContain('512')
    expect(verticalValue.find('.value-bar').attributes('style')).toContain('height: 50.19607843137255%')
  })

  it('can show pin type labels when the store display mode changes', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    store.currentStates = {
      5: { s: 0, t: PinType.Digital, v: 0 },
      6: { s: 128, t: PinType.Analog, v: 512 }
    }
    await nextTick()

    store.pinTypeDisplay = 1
    await nextTick()

    const pinElements = wrapper.findAll('.indicator')
    expect(pinElements[0].text()).toBe(PinDisplayTypeShort.Digital)
    expect(pinElements[1].text()).toBe(PinDisplayTypeShort.Analog)
  })

  it('switches the connection feedback image from disconnected to connected', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    const disconnectedIcon = wrapper.find('img.wifi-icon-light')
    expect(disconnectedIcon.attributes('src')).toContain('noconnection')

    store.connectedToESP32 = true
    await nextTick()

    const connectedIcon = wrapper.find('img.wifi-icon-light')
    expect(connectedIcon.attributes('src')).toContain('wifiicon')
  })

  it('does not render indicators when loading indicator data fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404
      }))
    )

    const { wrapper } = await mountBoardImage()

    expect(wrapper.findAll('.indicator')).toHaveLength(0)
    expect(consoleError).toHaveBeenCalled()
  })

  it('preserves previous pin state when switching compatible boards', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    store.currentStates = {
      5: { s: 255, t: PinType.Digital, v: 1 }
    }
    await nextTick()

    await wrapper.setProps({
      board: {
        ...board,
        name: 'Second Test Board',
        pins: 'indicators/second-test-board.json'
      }
    })
    await flushPromises()
    await nextTick()

    const horizontalValue = wrapper.find('.value')
    expect(horizontalValue.text()).toContain(DigitalValuesDisplay.High)
    expect(wrapper.findAll('.indicator')[0].element.style.backgroundColor).toBe('rgb(255, 0, 0)')
  })
})
