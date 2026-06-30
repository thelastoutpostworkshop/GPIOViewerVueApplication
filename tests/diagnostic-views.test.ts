/* @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ESPInfoView from '@/views/ESPInfo.vue'
import MemoryMapView from '@/views/MemoryMap.vue'
import { gpioStore } from '@/stores/gpiostore'
import type { ESPInfo, ESPPartition } from '@/types/types'

vi.mock('vuetify', () => ({
  useTheme: () => ({
    global: {
      current: {
        value: {
          dark: false
        }
      }
    }
  })
}))

const espInfo: ESPInfo = {
  chip_model: 'ESP32-S3',
  cores_count: 2,
  chip_revision: 1,
  cpu_frequency: 240,
  cycle_count: 123456,
  mac: 0x112233445566,
  flash_mode: 0x00,
  flash_chip_size: 4 * 1024 * 1024,
  flash_chip_speed: 40_000_000,
  heap_size: 100_000,
  heap_max_alloc: 50_000,
  psram_size: 2 * 1024 * 1024,
  free_psram: 1024 * 1024,
  psram_max_alloc: 512 * 1024,
  free_heap: 75_000,
  heap_free_8bit: 60_000,
  heap_free_32bit: 15_000,
  heap_largest_free_block: 42_000,
  temperature_c: 32.125,
  up_time: 90_061_000,
  uptime_us: 90_061_000_000,
  sketch_size: 512 * 1024,
  free_sketch: 256 * 1024,
  arduino_core_version: '3.0.0',
  sdk_version: '5.1.0',
  idf_version: 'v5.1',
  sketch_md5: 'abc123',
  chip_features: ['wifi', 'bluetooth_le'],
  reset_reason_code: 1,
  reset_reason: 'POWERON_RESET'
}

const partitions: ESPPartition[] = [
  {
    label: 'nvs',
    subtype: 2,
    address: '0x9000',
    size: 20 * 1024,
    calcPour: 0,
    type: 1
  },
  {
    label: 'app0',
    subtype: 16,
    address: '0x10000',
    size: 1_310_720,
    calcPour: 0,
    type: 0
  },
  {
    label: 'spiffs',
    subtype: 130,
    address: '0x150000',
    size: 512 * 1024,
    calcPour: 0,
    type: 1
  }
]

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'espinfo', component: { template: '<div />' } },
      { path: '/memorymap', name: 'memorymap', component: { template: '<div />' } }
    ]
  })
}

function mockFetchByPath(payloads: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const payload = payloads[url.pathname]

    if (payload instanceof Error) {
      throw payload
    }

    if (payload === undefined) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `No mock payload for ${url.pathname}` })
      } as Response
    }

    return {
      ok: true,
      status: 200,
      json: async () => structuredClone(payload)
    } as Response
  }) as unknown as typeof fetch

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function mountDiagnosticView(component: typeof ESPInfoView | typeof MemoryMapView) {
  const pinia = createPinia()
  const router = createTestRouter()

  setActivePinia(pinia)
  const store = gpioStore()
  store.ipAddress = '192.168.4.1'
  store.httpPort = 8080

  const wrapper = mount(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        VAlert: { template: '<div><slot /></div>' },
        VCard: { template: '<div><slot /></div>' },
        VContainer: { template: '<div><slot /></div>' },
        VIcon: { template: '<span><slot /></span>' },
        VProgressCircular: { template: '<div />' },
        VProgressLinear: { template: '<div />' },
        VTooltip: {
          template: '<div><slot name="activator" :props="{}" /><slot /></div>'
        }
      }
    }
  })

  await router.isReady()
  await flushPromises()

  return wrapper
}

beforeEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ESPInfo view', () => {
  it('fetches ESP diagnostics and renders formatted device details', async () => {
    const fetchMock = mockFetchByPath({
      '/espinfo': espInfo
    })

    const wrapper = await mountDiagnosticView(ESPInfoView)
    const text = wrapper.text()

    expect(fetchMock).toHaveBeenCalledWith('http://192.168.4.1:8080/espinfo')
    expect(text).toContain('ESP32 Runtime Overview')
    expect(text).toContain('ESP32-S3')
    expect(text).toContain('CPU Frequency')
    expect(text).toContain('240 MHz')
    expect(text).toContain('Flash Size')
    expect(text).toContain('4 MB')
    expect(text).toContain('66:55:44:33:22:11')
    expect(text).toContain('1d 01:01:01')
    expect(text).toContain('POWERON_RESET')
    expect(text).toContain('ABC123')
  })

  it('shows an error state when ESP diagnostics cannot be loaded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mockFetchByPath({
      '/espinfo': new Error('network unavailable')
    })

    const wrapper = await mountDiagnosticView(ESPInfoView)

    expect(wrapper.text()).toContain('No ESP32 information available')
    expect(consoleError).toHaveBeenCalledWith('Error fetching esp information', expect.any(Error))
  })
})

describe('MemoryMap view', () => {
  it('fetches ESP diagnostics and partitions, then renders flash and memory summaries', async () => {
    const fetchMock = mockFetchByPath({
      '/espinfo': espInfo,
      '/partition': partitions
    })

    const wrapper = await mountDiagnosticView(MemoryMapView)
    const text = wrapper.text()

    expect(fetchMock).toHaveBeenCalledWith('http://192.168.4.1:8080/espinfo')
    expect(fetchMock).toHaveBeenCalledWith('http://192.168.4.1:8080/partition')
    expect(text).toContain('Flash Stack Map')
    expect(text).toContain('Flash Size')
    expect(text).toContain('4 MB')
    expect(text).toContain('nvs')
    expect(text).toContain('app0')
    expect(text).toContain('spiffs')
    expect(text).toContain('Heap Usage')
    expect(text).toContain('25% used')
    expect(text).toContain('PSRAM Usage')
    expect(text).toContain('50% used')
  })

  it('renders an empty flash data state when no partitions are returned', async () => {
    mockFetchByPath({
      '/espinfo': espInfo,
      '/partition': []
    })

    const wrapper = await mountDiagnosticView(MemoryMapView)

    expect(wrapper.text()).toContain('Flash usage data unavailable.')
    expect(wrapper.text()).toContain('Heap Usage')
  })
})
