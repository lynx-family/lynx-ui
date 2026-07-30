// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SMOOTHING_PATH } from '../../../constants/stage'
import { Stage } from '../stage'

function parseFrameTransform(root: HTMLElement) {
  const expectedClipPath = `path("${SMOOTHING_PATH}")`
  const candidates = Array.from(root.querySelectorAll('div'))
  const frame = candidates.find((el): el is HTMLDivElement =>
    el instanceof HTMLDivElement
    && el.style.clipPath === expectedClipPath
    && el.style.overflow === 'hidden'
    && el.style.transform.length > 0
  )

  expect(frame).toBeTruthy()

  const transform = frame!.style.transform
  const match =
    /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)\s*scale\(([-0-9.]+)\)/
      .exec(transform)
  expect(match).not.toBeNull()

  return {
    offsetX: Number(match![1]),
    offsetY: Number(match![2]),
    scale: Number(match![3]),
    frame,
  }
}

describe('Stage align invariants', () => {
  it('centers the anchor in the viewport for align=center and keeps geometry relative to the anchor across zoom', () => {
    const width = 300
    const height = 300
    const baseWidth = 100
    const baseHeight = 200

    const { container: c1 } = render(
      <Stage
        width={width}
        height={height}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
        alignX='center'
        alignY='center'
        zoom={1}
      />,
    )
    const t1 = parseFrameTransform(c1)
    expect(t1.offsetX + (baseWidth * t1.scale) / 2).toBeCloseTo(0, 6)
    expect(t1.offsetY + (baseHeight * t1.scale) / 2).toBeCloseTo(0, 6)
    const viewport1 = c1.firstElementChild as HTMLDivElement | null
    const anchor1 = viewport1?.firstElementChild as HTMLDivElement | null
    expect(anchor1?.style.left).toBe('50%')
    expect(anchor1?.style.top).toBe('50%')

    const { container: c2 } = render(
      <Stage
        width={width}
        height={height}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
        alignX='center'
        alignY='center'
        zoom={2}
      />,
    )
    const t2 = parseFrameTransform(c2)
    expect(t2.offsetX + (baseWidth * t2.scale) / 2).toBeCloseTo(0, 6)
    expect(t2.offsetY + (baseHeight * t2.scale) / 2).toBeCloseTo(0, 6)
    const viewport2 = c2.firstElementChild as HTMLDivElement | null
    const anchor2 = viewport2?.firstElementChild as HTMLDivElement | null
    expect(anchor2?.style.left).toBe('50%')
    expect(anchor2?.style.top).toBe('50%')
  })

  it('positions the anchor in the viewport according to alignX and keeps geometry relative to the anchor', () => {
    const width = 320
    const height = 240
    const baseWidth = 100
    const baseHeight = 200

    const { container: leftC } = render(
      <Stage
        width={width}
        height={height}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
        alignX='left'
      />,
    )
    const leftT = parseFrameTransform(leftC)
    expect(leftT.offsetX).toBeCloseTo(0, 6)
    const leftViewport = leftC.firstElementChild as HTMLDivElement | null
    const leftAnchor = leftViewport?.firstElementChild as HTMLDivElement | null
    expect(leftAnchor?.style.left).toBe('0%')

    const { container: rightC } = render(
      <Stage
        width={width}
        height={height}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
        alignX='right'
      />,
    )
    const rightT = parseFrameTransform(rightC)
    expect(rightT.offsetX + baseWidth * rightT.scale).toBeCloseTo(0, 6)
    const rightViewport = rightC.firstElementChild as HTMLDivElement | null
    const rightAnchor = rightViewport?.firstElementChild as
      | HTMLDivElement
      | null
    expect(rightAnchor?.style.left).toBe('100%')
  })

  it('supports placing the 0x0 anchor independently via placeX/placeY', () => {
    const width = 300
    const height = 300
    const baseWidth = 100
    const baseHeight = 200

    const { container } = render(
      <Stage
        width={width}
        height={height}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
        alignX='center'
        alignY='center'
        placeX='left'
        placeY='top'
      />,
    )

    const t = parseFrameTransform(container)
    expect(t.offsetX).toBeCloseTo(-(baseWidth * t.scale) / 2, 6)
    expect(t.offsetY).toBeCloseTo(-(baseHeight * t.scale) / 2, 6)
    const viewport = container.firstElementChild as HTMLDivElement | null
    const anchor = viewport?.firstElementChild as HTMLDivElement | null
    expect(anchor?.style.left).toBe('0%')
    expect(anchor?.style.top).toBe('0%')
  })

  it('does not set containing-block-triggering inline styles on the anchor', () => {
    const { container } = render(<Stage width={300} height={300} />)
    const viewport = container.firstElementChild as HTMLDivElement | null
    const anchor = viewport?.firstElementChild as HTMLDivElement | null
    expect(anchor).not.toBeNull()

    const styleAttr = anchor!.getAttribute('style') ?? ''
    expect(styleAttr).toMatch(/transform:\s*none/)
    expect(styleAttr).toMatch(/filter:\s*none/)
    expect(styleAttr).toMatch(/perspective:\s*none/)
    expect(anchor!.style.backdropFilter).toBe('none')
    expect(styleAttr).toMatch(/will-change:\s*auto/)
    expect(styleAttr).toMatch(/contain:\s*none/)
  })
})
