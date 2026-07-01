/* @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import {
  buildPartitionBuilderUrl,
  buildPartitionCsv,
  PARTITION_BUILDER_URL
} from '@/partitionBuilder'
import type { ESPPartition } from '@/types/types'

const partitions: ESPPartition[] = [
  {
    label: 'nvs',
    type: 0x01,
    subtype: 0x02,
    address: '0x9000',
    size: 0x5000,
    calcPour: 0
  },
  {
    label: 'otadata',
    type: 0x01,
    subtype: 0x00,
    address: '0xE000',
    size: 0x2000,
    calcPour: 0
  },
  {
    label: 'app0',
    type: 0x00,
    subtype: 0x10,
    address: '0x10000',
    size: 0x300000,
    calcPour: 0
  }
]

describe('partition builder URL', () => {
  it('encodes ESP partitions as partition-builder CSV', () => {
    const csv = buildPartitionCsv(partitions)

    expect(csv).toBe(
      [
        '# Name,Type,SubType,Offset,Size,Flags',
        'nvs,data,nvs,0x9000,0x5000,',
        'otadata,data,ota,0xE000,0x2000,',
        'app0,app,ota_0,0x10000,0x300000,'
      ].join('\n')
    )

    const href = buildPartitionBuilderUrl(partitions, 16 * 1024 * 1024)
    const url = new URL(href)
    const encodedPartitions = url.searchParams.get('partitions')?.replace(/^base64:/, '')

    expect(href).toContain('partitions=base64%3A')
    expect(url.origin + url.pathname).toBe(PARTITION_BUILDER_URL)
    expect(url.searchParams.get('flash')).toBe('16')
    expect(encodedPartitions).toBeTruthy()
    expect(atob(encodedPartitions ?? '')).toBe(csv)
  })

  it('infers partition type when older firmware omits it', () => {
    const csv = buildPartitionCsv([
      {
        label: 'factory',
        subtype: 0x00,
        address: '0x10000',
        size: 0x100000,
        calcPour: 0
      },
      {
        label: 'spiffs',
        subtype: 0x82,
        address: '0x110000',
        size: 0x100000,
        calcPour: 0
      }
    ])

    expect(csv).toContain('factory,app,factory,0x10000,0x100000,')
    expect(csv).toContain('spiffs,data,spiffs,0x110000,0x100000,')
  })

  it('sorts rows and normalizes offsets for the builder CSV', () => {
    const csv = buildPartitionCsv([
      {
        label: 'app0',
        type: 0x00,
        subtype: 0x10,
        address: '10000',
        size: 0x100000,
        calcPour: 0
      },
      {
        label: 'nvs',
        type: 0x01,
        subtype: 0x02,
        address: '9000',
        size: 0x5000,
        calcPour: 0
      }
    ])

    expect(csv.split('\n').slice(1)).toEqual([
      'nvs,data,nvs,0x9000,0x5000,',
      'app0,app,ota_0,0x10000,0x100000,'
    ])
  })

  it('returns the base builder URL when no partition rows are usable', () => {
    expect(buildPartitionBuilderUrl([], 0)).toBe(PARTITION_BUILDER_URL)
    expect(
      buildPartitionBuilderUrl([
        {
          label: 'partition table',
          type: 0x01,
          subtype: 0x00,
          address: '0x8000',
          size: 0x1000,
          calcPour: 0
        }
      ])
    ).toBe(PARTITION_BUILDER_URL)
  })
})
