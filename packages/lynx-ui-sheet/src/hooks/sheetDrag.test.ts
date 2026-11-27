// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import {
  createSheetDragState,
  getRubberBandConfig,
  moveSheetDrag,
} from './sheetDrag'

vi.mock('@lynx-js/lynx-ui-presence', () => ({ PresenceState: {} }))

function start(
  position = 900,
  rubberBand: Parameters<typeof createSheetDragState>[2] = true,
) {
  const state = createSheetDragState(
    position,
    [450, 900],
    rubberBand,
    1000,
    false,
  )
  if (!state) throw new Error('Expected resolved snap points')
  return state
}

describe('Sheet drag displacement', () => {
  it.each([1, 2, 20, 200])('is invariant across %s pointer updates', count => {
    let state = start()
    for (let i = 0; i < count; i++) state = moveSheetDrag(state, 200 / count)
    expect(state.rawPosition).toBeCloseTo(1100)
    expect(state.position).toBeCloseTo(944.4444444444)
    state = moveSheetDrag(state, -200)
    expect(state.position).toBeCloseTo(900)
  })

  it.each([900, 920, 940, 960, 979, 980, 1000, 1100])(
    'preserves a stretched %s position when another drag acquires it',
    position => {
      const state = start(position)
      expect(moveSheetDrag(state, 0)).toBe(state)
      const next = moveSheetDrag(state, 1)
      expect(next.position).toBeGreaterThan(position)
      expect(next.position).toBeLessThanOrEqual(position + 1)
      expect(moveSheetDrag(next, -1).position).toBeCloseTo(position)
    },
  )

  it('preserves a lower stretched position on drag acquisition', () => {
    const state = start(410)
    const next = moveSheetDrag(state, -1)
    expect(next.position).toBeLessThan(410)
    expect(moveSheetDrag(next, 1).position).toBeCloseTo(410)
  })

  it('does not mutate previously sampled drag state', () => {
    const state = start()
    const next = moveSheetDrag(state, 200)
    expect(next).not.toBe(state)
    expect(state.rawPosition).toBe(900)
    expect(state.position).toBe(900)
  })

  it('drops upper displacement assigned to native scrolling', () => {
    let state = start(800)
    state = moveSheetDrag(state, 300, 900)
    expect(state.position).toBe(900)
    expect(state.rawPosition).toBe(900)
    expect(moveSheetDrag(state, -10, 900).position).toBe(890)
  })

  it('uses the live handoff maximum without applying old upper resistance', () => {
    const state = start(800)
    const next = moveSheetDrag(state, 300, 1000)
    expect(next.position).toBe(1000)
    expect(next.rawPosition).toBe(1000)
  })

  it('keeps hard-clamped movement based on raw displacement', () => {
    let state = start(900, false)
    state = moveSheetDrag(state, 200)
    expect(state.position).toBe(900)
    state = moveSheetDrag(state, -100)
    expect(state.position).toBe(900)
    state = moveSheetDrag(state, -110)
    expect(state.position).toBe(890)
  })

  it('allows linear dragging below the minimum when dismissal is enabled', () => {
    const state = createSheetDragState(450, [450, 900], true, 1000, true)
    if (!state) throw new Error('Expected resolved snap points')
    expect(moveSheetDrag(state, -200).position).toBe(250)
  })

  it('ignores unresolved snap points and rejects an unresolved-only drag', () => {
    expect(createSheetDragState(0, [-1], true, 1000, true)).toBeNull()
    expect(createSheetDragState(0, [], true, 1000, true)).toBeNull()
    const state = createSheetDragState(900, [-1, 900, 450], true, 1000, false)
    expect(state?.minimum).toBe(450)
    expect(state?.maximum).toBe(900)
  })
})

describe('Sheet resistance configuration', () => {
  it.each([
    { maximum: 900, distance: 80 },
    { maximum: 980, distance: 20 },
    { maximum: 1000, distance: 0 },
    { maximum: 1100, distance: 0 },
  ])(
    'bounds default resistance by available space at $maximum',
    ({ maximum, distance }) => {
      expect(getRubberBandConfig(true, 1000, maximum)).toEqual({
        enabled: true,
        coeff: 0.5,
        max: distance,
      })
    },
  )

  it('honors explicit resistance and distance', () => {
    const state = start(900, { coeff: 0.6, max: 40 })
    const next = moveSheetDrag(state, 200)
    expect(next.position).toBeCloseTo(930)
  })

  it.each([false, 0, { coeff: 0 }, { max: 0 }])(
    'keeps zero or disabled resistance finite: %j',
    rubberBand => {
      const state = start(900, rubberBand)
      expect(moveSheetDrag(state, 200).position).toBe(900)
    },
  )

  it('keeps the sampled resistance geometry stable during a drag', () => {
    const config = { coeff: 0.5, max: 80 }
    let state = start(900, config)
    state = moveSheetDrag(state, 200)
    config.max = 20
    state = moveSheetDrag(state, 1)
    expect(state.rubber.max).toBe(80)
    expect(state.position).toBeGreaterThan(944.4444444444)
  })
})
