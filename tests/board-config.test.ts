import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, normalize, sep } from 'node:path'

type Board = {
  name: string
  image: string
  pins: string
}

type IndicatorPin = {
  gpioid: number
  top: number
  left: number
  valueJustify: -2 | -1 | 0
}

type IndicatorConfig = {
  pins: IndicatorPin[]
  settings: Record<string, unknown>
  stats: Record<string, unknown>
  wifiFeedback: Record<string, unknown>
}

const rootDir = process.cwd()
const publicDir = join(rootDir, 'public')
const boardsPath = join(publicDir, 'boards.json')
const indicatorsDir = join(publicDir, 'indicators')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function publicAssetPath(relativePath: string) {
  return join(publicDir, relativePath)
}

function expectPublicPath(relativePath: string) {
  expect(relativePath).not.toContain('..')
  expect(normalize(relativePath).startsWith(`..${sep}`)).toBe(false)
  expect(relativePath.startsWith('/')).toBe(false)
}

function expectPercent(value: number) {
  expect(Number.isFinite(value)).toBe(true)
  expect(value).toBeGreaterThanOrEqual(0)
  expect(value).toBeLessThanOrEqual(100)
}

describe('board configuration', () => {
  const boards = readJson<Board[]>(boardsPath)

  it('registers valid board image and indicator paths', () => {
    expect(boards.length).toBeGreaterThan(0)

    for (const board of boards) {
      expect(board.name).toEqual(expect.any(String))
      expect(board.name.trim()).not.toBe('')
      expect(board.image).toMatch(/^devboards_images\/.+\.(png|webp|jpg|jpeg)$/i)
      expect(board.pins).toMatch(/^indicators\/.+\.json$/i)

      expectPublicPath(board.image)
      expectPublicPath(board.pins)

      const imagePath = publicAssetPath(board.image)
      const indicatorPath = publicAssetPath(board.pins)

      expect(existsSync(imagePath), `${board.name} image does not exist: ${board.image}`).toBe(true)
      expect(statSync(imagePath).isFile(), `${board.name} image is not a file: ${board.image}`).toBe(true)
      expect(existsSync(indicatorPath), `${board.name} indicators do not exist: ${board.pins}`).toBe(true)
      expect(statSync(indicatorPath).isFile(), `${board.name} indicators are not a file: ${board.pins}`).toBe(true)
    }
  })

  it('uses unique board names and registry paths', () => {
    expect(new Set(boards.map((board) => board.name)).size).toBe(boards.length)
    expect(new Set(boards.map((board) => board.image)).size).toBe(boards.length)
    expect(new Set(boards.map((board) => board.pins)).size).toBe(boards.length)
  })

  it('registers every indicator file', () => {
    const registeredIndicators = new Set(boards.map((board) => board.pins))
    const indicatorFiles = readdirSync(indicatorsDir)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => `indicators/${fileName}`)

    expect(indicatorFiles.length).toBeGreaterThan(0)

    for (const indicatorFile of indicatorFiles) {
      expect(registeredIndicators.has(indicatorFile), `Unregistered indicator file: ${indicatorFile}`).toBe(true)
    }
  })
})

describe('indicator configuration', () => {
  const boards = readJson<Board[]>(boardsPath)

  for (const board of boards) {
    it(`${board.name} has valid indicator data`, () => {
      const indicators = readJson<IndicatorConfig>(publicAssetPath(board.pins))

      expect(Array.isArray(indicators.pins)).toBe(true)
      expect(indicators.pins.length).toBeGreaterThan(0)
      expect(indicators.settings).toEqual(expect.any(Object))
      expect(indicators.stats).toEqual(expect.any(Object))
      expect(indicators.wifiFeedback).toEqual(expect.any(Object))

      for (const pin of indicators.pins) {
        expect(Number.isInteger(pin.gpioid), `${board.name} has a non-integer gpioid`).toBe(true)
        expect(pin.gpioid, `${board.name} has a negative gpioid`).toBeGreaterThanOrEqual(0)
        expectPercent(pin.top)
        expectPercent(pin.left)
        expect([-2, -1, 0]).toContain(pin.valueJustify)
      }
    })
  }
})
