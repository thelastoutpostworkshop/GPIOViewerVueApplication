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
    },
    {
      gpioid: 7,
      top: 50,
      left: 20,
      color: '',
      valueJustify: -1,
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
    expect(wrapper.findAll('.value, .value_right, .value_vertical')).toHaveLength(0)
  })

  it('updates pin display values, colors, and value bars from store state', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()

    store.currentStates = {
      5: { s: 255, t: PinType.Digital, v: 1 },
      6: { s: 128, t: PinType.Analog, v: 512 },
      7: { s: 64, t: PinType.Analog, v: 251 }
    }

    await nextTick()

    const pinElements = wrapper.findAll('.indicator')
    expect(pinElements[0].element.style.backgroundColor).toBe('rgb(255, 0, 0)')
    expect(pinElements[0].classes()).toContain('indicator--activating')
    expect(pinElements[1].element.style.backgroundColor).not.toBe('')

    const horizontalValue = wrapper.find('.value')
    expect(horizontalValue.text()).toContain(DigitalValuesDisplay.High)
    expect(horizontalValue.classes()).toContain('value--activating')
    expect(horizontalValue.classes()).toContain('value--high')
    expect(horizontalValue.classes()).toContain('value--fill-from-left')
    expect(horizontalValue.find('.value-bar').attributes('style')).toContain('width: 100%')

    const leftSideValue = wrapper.find('.value_right')
    expect(leftSideValue.text()).toContain('251')
    expect(leftSideValue.classes()).toContain('value--fill-from-right')
    const horizontalWidth = leftSideValue.find<HTMLElement>('.value-bar').element.style.width
    expect(horizontalWidth).toMatch(/%$/)
    expect(parseFloat(horizontalWidth)).toBeCloseTo(25.098039215686274, 3)

    const verticalValue = wrapper.find('.value_vertical')
    expect(verticalValue.text()).toContain('512')
    expect(verticalValue.classes()).toContain('value--active')
    expect(verticalValue.classes()).toContain('value--fill-vertical')
    const verticalHeight = verticalValue.find<HTMLElement>('.value-bar').element.style.height
    expect(verticalHeight).toMatch(/%$/)
    expect(parseFloat(verticalHeight)).toBeCloseTo(50.19607843137255, 3)
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

  it('opens pin details when a pin is clicked', async () => {
    mockIndicatorFetch()
    const { wrapper } = await mountBoardImage()

    await wrapper.find('.indicator').trigger('click')
    await nextTick()

    const pinInfo = wrapper.findComponent({ name: 'PinInfo' })
    expect(pinInfo.props('showPinInfo')).toBe(true)
  })

  it('shows optional labels before activity and keeps GPIO numbers for unlabeled pins', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()
    store.pinTypeDisplay = 3
    await nextTick()
    expect(wrapper.findAll('.value__pin-label')).toHaveLength(0)

    // Metadata can arrive after the board and uses string GPIOs in Tasmota.
    store.pinModes = [
      { pin: '5', mode: '3', label: '  Relay_i1  ' },
      { pin: 6, mode: 5, label: '  ' },
      { pin: 7, mode: 3 }
    ]
    await nextTick()

    expect(wrapper.findAll('.indicator').map((pin) => pin.text())).toEqual(['5', '6', '7'])
    expect(wrapper.findAll('.value__pin-label')).toHaveLength(1)
    expect(wrapper.find('.value__pin-label').text()).toBe('Relay_i1')
    expect(wrapper.find('.indicator').attributes('title')).toBe('GPIO 5 · Relay_i1')
    expect(wrapper.find('.value--labeled').classes()).toContain('value--idle')
    expect(wrapper.find('.value--labeled .value-bar').exists()).toBe(false)

    store.currentStates = { 5: { s: 255, t: PinType.Digital, v: 1 } }
    await nextTick()
    expect(wrapper.find('.value__pin-label').text()).toBe('Relay_i1')
    expect(wrapper.find('.value--labeled .value__label').text()).toBe(DigitalValuesDisplay.High)
    expect(wrapper.find('.value--labeled').attributes('title')).toContain('High')

    await wrapper.find('.value--labeled').trigger('click')
    expect(wrapper.findComponent({ name: 'PinInfo' }).props('pin').gpioid).toBe(5)

    store.pinTypeDisplay = 0
    await nextTick()
    expect(wrapper.find('.value__pin-label').exists()).toBe(false)
    expect(wrapper.find('.value__label').text()).toBe(DigitalValuesDisplay.High)
    // Full labels remain available on hover in the original display modes.
    expect(wrapper.find('.indicator').attributes('title')).toContain('Relay_i1')
    wrapper.unmount()
  })

  it('anchors label callouts away from pins and preserves vertical bars in other modes', async () => {
    mockIndicatorFetch()
    const { wrapper, store } = await mountBoardImage()
    store.pinModes = [
      { pin: 6, mode: 192, label: '<b>Analog input</b>' },
      { pin: 7, mode: 192, label: 'Temperature sensor' }
    ]
    store.currentStates = {
      6: { s: 128, t: PinType.Analog, v: 512 },
      7: { s: 64, t: PinType.Analog, v: 251 }
    }
    store.pinTypeDisplay = 3
    await nextTick()

    expect(wrapper.find('.value_vertical').exists()).toBe(false)
    const labels = wrapper.findAll('.value__pin-label')
    expect(labels[0].text()).toBe('<b>Analog input</b>')
    expect(labels[0].find('b').exists()).toBe(false)
    const leftValue = wrapper.find<HTMLElement>('.value_right')
    expect(leftValue.element.style.left).toBe('auto')
    expect(leftValue.element.style.right).toBe('85%')

    store.pinTypeDisplay = 0
    await nextTick()
    expect(wrapper.find('.value_vertical .value__label').text()).toBe('512')
    expect(wrapper.find<HTMLElement>('.value_right').element.style.right).toBe('')
    wrapper.unmount()
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
