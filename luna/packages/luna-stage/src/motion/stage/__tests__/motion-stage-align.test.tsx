// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { useMotionValue } from 'motion/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { SMOOTHING_PATH } from '../../../constants/stage'
import { VisualSizeProvider } from '../../context/visual-size-provider'
import { MotionStage } from '../stage-motion'

function Wrapper(props: { w: number, h: number, children: ReactNode }) {
  const { w, h, children } = props
  const mvW = useMotionValue(w)
  const mvH = useMotionValue(h)
  return (
    <VisualSizeProvider visualW={mvW} visualH={mvH}>
      {children}
    </VisualSizeProvider>
  )
}

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
    /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)\s*translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)\s*scale\(([-0-9.]+)\)/
      .exec(transform)
  expect(match).not.toBeNull()

  return {
    offsetX: Number(match![3]),
    offsetY: Number(match![4]),
    scale: Number(match![5]),
  }
}

describe('MotionStage align invariants', () => {
  it('keeps frame center aligned to the internal anchor for align=center', () => {
    const width = 300
    const height = 300
    const baseWidth = 100
    const baseHeight = 200

    const { container } = render(
      <Wrapper w={width} h={height}>
        <MotionStage
          baseWidth={baseWidth}
          baseHeight={baseHeight}
          alignX='center'
          alignY='center'
          zoom={1}
        />
      </Wrapper>,
    )

    const t = parseFrameTransform(container)
    expect(t.offsetX + (baseWidth * t.scale) / 2).toBeCloseTo(0, 6)
    expect(t.offsetY + (baseHeight * t.scale) / 2).toBeCloseTo(0, 6)
  })
})
