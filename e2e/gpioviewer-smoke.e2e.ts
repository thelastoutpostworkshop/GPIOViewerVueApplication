import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8')) as { version: string }

async function mockEsp32(page: Page) {
  await page.addInitScript(() => {
    type ListenerMap = Record<string, Array<(event: MessageEvent | Event) => void>>

    class FakeEventSource {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 2

      readonly CONNECTING = 0
      readonly OPEN = 1
      readonly CLOSED = 2
      readonly url: string
      readyState = FakeEventSource.CONNECTING
      private listeners: ListenerMap = {}

      constructor(url: string) {
        this.url = url
        window.__gpioEventSources.push(this)

        setTimeout(() => {
          this.readyState = FakeEventSource.OPEN
          this.dispatch('open', new Event('open'))
        }, 0)
      }

      addEventListener(type: string, listener: (event: MessageEvent | Event) => void) {
        this.listeners[type] ??= []
        this.listeners[type].push(listener)
      }

      removeEventListener(type: string, listener: (event: MessageEvent | Event) => void) {
        this.listeners[type] = this.listeners[type]?.filter((item) => item !== listener) ?? []
      }

      close() {
        this.readyState = FakeEventSource.CLOSED
      }

      fail() {
        this.readyState = FakeEventSource.CLOSED
        this.dispatch('error', new Event('error'))
      }

      dispatch(type: string, event: MessageEvent | Event) {
        Object.defineProperty(event, 'target', {
          value: this,
          configurable: true
        })
        for (const listener of this.listeners[type] ?? []) {
          listener(event)
        }
      }
    }

    window.__gpioEventSources = []
    window.__emitGpioEvent = (type: string, data?: string) => {
      for (const source of window.__gpioEventSources) {
        source.dispatch(type, new MessageEvent(type, { data }))
      }
    }
    window.__disconnectGpioEvents = () => {
      for (const source of window.__gpioEventSources) {
        source.fail()
      }
    }
    window.EventSource = FakeEventSource as unknown as typeof EventSource
  })

  await page.route('http://gpioviewer.local:8080/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    const payloads: Record<string, unknown> = {
      '/pinmodes': [
        { pin: 0, mode: 3 },
        { pin: 1, mode: 5 }
      ],
      '/pinfunctions': {
        boardpinsfunction: [
          {
            name: 'test',
            functions: [{ pin: 0, function: 'GPIO' }]
          }
        ]
      },
      '/release': { release: 'test-release' },
      '/sampling': { sampling: 250 },
      '/espinfo': {
        chip_model: 'ESP32',
        cores_count: 2,
        chip_revision: 1,
        cpu_frequency: 240,
        cycle_count: 1,
        mac: 73588229205,
        flash_mode: 'dio',
        flash_chip_size: 4194304,
        flash_chip_speed: 40000000,
        heap_size: 100000,
        heap_max_alloc: 50000,
        psram_size: 0,
        free_psram: 0,
        psram_max_alloc: 0,
        free_heap: 75000,
        heap_free_8bit: 50000,
        heap_free_32bit: 25000,
        heap_largest_free_block: 40000,
        temperature_c: 32,
        up_time: 123000,
        uptime_us: 123000000,
        sketch_size: 512000,
        free_sketch: 256000,
        arduino_core_version: 'test',
        sdk_version: 'test',
        idf_version: 'test',
        sketch_md5: 'abc123',
        chip_features: ['wifi'],
        reset_reason_code: 1,
        reset_reason: 'POWERON_RESET'
      },
      '/partition': [
        {
          label: 'app0',
          subtype: 16,
          address: '0x10000',
          size: 1310720,
          calcPour: 50,
          type: 0
        }
      ]
    }

    if (path in payloads) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(payloads[path])
      })
      return
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: `No ESP32 mock for ${path}` })
    })
  })
}

declare global {
  interface Window {
    __gpioEventSources: Array<{
      dispatch(type: string, event: MessageEvent | Event): void
      fail(): void
    }>
    __emitGpioEvent(type: string, data?: string): void
    __disconnectGpioEvents(): void
  }
}

async function bootMockedApp(page: Page) {
  await mockEsp32(page)
  await page.goto('/')

  await expect(page.getByRole('img').first()).toBeVisible()
  await expect(page.getByText('@250ms')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__gpioEventSources.length)).toBe(1)
}

async function emitGpioState(page: Page, value: number) {
  await page.evaluate((gpioValue) => {
    window.__emitGpioEvent('gpio-state', JSON.stringify({ 0: { s: gpioValue ? 255 : 0, t: 0, v: gpioValue } }))
  }, value)
}

async function clickDrawerItem(page: Page, label: string) {
  const item = page.getByText(label, { exact: true })
  const box = await item.boundingBox().catch(() => null)
  const viewport = page.viewportSize()
  const isInViewport = Boolean(
    box &&
    viewport &&
    box.x < viewport.width &&
    box.x + box.width > 0 &&
    box.y < viewport.height &&
    box.y + box.height > 0
  )

  if (!isInViewport) {
    await page.locator('.v-app-bar .v-btn').first().click()
  }
  await item.dispatchEvent('click')
}

test.describe('GPIOViewer mocked ESP32 smoke test', () => {
  test('boots, connects to mocked events, renders GPIO activity, and navigates', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    await bootMockedApp(page)
    await expect(page.getByText(`v${packageJson.version}`).first()).toBeVisible()
    await expect(page.locator('.v-app-bar')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(page.locator('.v-navigation-drawer')).toHaveCSS('background-color', 'rgb(255, 255, 255)')

    await page.evaluate(() => {
      window.__emitGpioEvent('gpio-state', JSON.stringify({ 0: { s: 255, t: 0, v: 1 } }))
      window.__emitGpioEvent('free_heap', '74 KB')
    })

    await expect(page.locator('.value_right').filter({ hasText: 'High' })).toBeVisible()
    await expect(page.getByText('Free Heap:74 KB')).toBeVisible()

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(page.locator('.v-theme--GPIOViewerThemeDark').first()).toBeVisible()
    await expect(page.locator('.main')).toHaveClass(/v-theme--GPIOViewerThemeDark/)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('gpioviewer-theme'))).toBe('GPIOViewerThemeDark')

    await clickDrawerItem(page, 'ESP32 Information')
    await expect(page.getByText('ESP32 Runtime Overview')).toBeVisible()
    await expect(page.locator('.info-section').first()).toHaveCSS('background-color', 'rgb(30, 41, 59)')

    await clickDrawerItem(page, 'About')
    await expect(page.getByText('Web application')).toBeVisible()
    await expect(page.locator('.about-hero__meta').getByText(`v${packageJson.version}`)).toBeVisible()

    await clickDrawerItem(page, 'Maker Tools')
    await expect(page.getByRole('heading', { name: 'Maker Tools' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ESPConnect' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'ESP32 Partition Builder' })).toBeVisible()

    await clickDrawerItem(page, 'Memory Map')
    await expect(page.getByText('app0', { exact: true })).toBeVisible()
    await expect(page.locator('.memory-pane').first()).toHaveCSS('background-color', 'rgb(30, 41, 59)')
    const partitionBuilderLink = page.getByRole('link', { name: 'ESP32 partition builder' })
    await expect(partitionBuilderLink).toHaveAttribute('href', /ESP32PartitionBuilder/)
    await expect(partitionBuilderLink).toHaveAttribute('href', /flash=4/)
    await expect(partitionBuilderLink).toHaveAttribute('href', /partitions=base64%3A/)

    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
  })

  test('handles repeated GPIO updates and freeze state', async ({ page }) => {
    await bootMockedApp(page)

    await emitGpioState(page, 1)
    await expect(page.locator('.value_right').filter({ hasText: 'High' })).toBeVisible()

    await emitGpioState(page, 0)
    await expect(page.locator('.value_right').filter({ hasText: 'Low' })).toBeVisible()

    await emitGpioState(page, 1)
    await page.getByRole('button', { name: /Freeze/ }).click()
    await emitGpioState(page, 0)

    await expect(page.locator('.value_right').filter({ hasText: 'High' })).toBeVisible()
    await expect(page.locator('.value_right').filter({ hasText: 'Low' })).toHaveCount(0)

    await page.getByRole('button', { name: /Freeze/ }).click()
    await emitGpioState(page, 0)
    await expect(page.locator('.value_right').filter({ hasText: 'Low' })).toBeVisible()
  })

  test('closes the sidebar when the viewport becomes compact', async ({ page }) => {
    await bootMockedApp(page)

    const drawer = page.locator('.v-navigation-drawer')
    await expect(drawer).toHaveClass(/v-navigation-drawer--active/)

    await page.setViewportSize({ width: 375, height: 667 })
    await expect(drawer).not.toHaveClass(/v-navigation-drawer--active/)

    const menuButton = page.locator('.v-app-bar .v-app-bar-nav-icon')
    await expect(menuButton).toBeVisible()
    await menuButton.click()
    await expect(drawer).toHaveClass(/v-navigation-drawer--active/)
  })

  test('updates stats, disconnect feedback, and plotter history from events', async ({ page }) => {
    await bootMockedApp(page)

    await page.evaluate(() => {
      window.__emitGpioEvent('gpio-state', JSON.stringify({ 0: { s: 255, t: 0, v: 1 } }))
      window.__emitGpioEvent('gpio-state', JSON.stringify({ 0: { s: 0, t: 0, v: 0 } }))
      window.__emitGpioEvent('free_heap', '73 KB')
    })

    await expect(page.getByText('Free Heap:73 KB')).toBeVisible()
    await expect(page.locator('img.wifi-icon-light')).toHaveAttribute('src', /wifiicon/)

    await page.evaluate(() => window.__disconnectGpioEvents())
    await expect(page.locator('img.wifi-icon-light')).toHaveAttribute('src', /noconnection/)

    await clickDrawerItem(page, 'Pin Data Graph')
    await expect(page.getByText('Select pins to plot')).toBeVisible()
    await expect(page.getByText('Idle')).toBeVisible()
    await expect(page.locator('.v-chip').filter({ hasText: /GPIO 0/ })).toBeVisible()

    await page.getByRole('button', { name: 'Digital' }).click()
    await expect(page.getByRole('img', { name: 'Digital logic lanes' })).toBeVisible()
    await expect(page.getByText('Live')).toBeVisible()
    await expect(page.getByText('2 / 100 samples')).toBeVisible()

    await page.getByRole('button', { name: 'Line chart' }).click()
    await expect(page.locator('canvas')).toBeVisible()

    await page.getByRole('button', { name: 'Pause graph' }).click()
    await expect(page.getByText('Paused')).toBeVisible()

    await page.getByRole('button', { name: 'Resume graph' }).click()
    await expect(page.getByText('Live')).toBeVisible()
  })
})
