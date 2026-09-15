// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@testing-library/jest-dom'

import { act, fireEvent, render } from '@lynx-js/react/testing-library'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

import { DeferredComponent } from '../src/index'

/** Captures scheduled frames and restores the animation-frame API after each test. */
function mockAnimationFrames() {
  const frames: Array<() => void> = []
  const requestAnimationFrame = vi.fn((callback: () => void) => {
    frames.push(callback)
  })
  const backgroundLynx = lynx
  const originalAnimationFrame = Object.getOwnPropertyDescriptor(
    backgroundLynx,
    'requestAnimationFrame',
  )
  onTestFinished(() => {
    if (originalAnimationFrame) {
      Object.defineProperty(
        backgroundLynx,
        'requestAnimationFrame',
        originalAnimationFrame,
      )
    } else {
      Reflect.deleteProperty(backgroundLynx, 'requestAnimationFrame')
    }
  })
  Object.assign(backgroundLynx, { requestAnimationFrame })
  return { frames, requestAnimationFrame }
}

describe('DeferredComponent', () => {
  it.each([
    0,
    -1,
    0.5,
    Number.NaN,
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ])(
    'renders children immediately when delay is %s',
    delayFrames => {
      const { frames, requestAnimationFrame } = mockAnimationFrames()
      const { container, getByTestId, queryByTestId } = render(
        <DeferredComponent
          delayFrames={delayFrames}
          placeholder={<text data-testid='placeholder'>Loading</text>}
        >
          <text data-testid='content'>Ready</text>
        </DeferredComponent>,
      )

      expect(getByTestId('content')).toHaveTextContent('Ready')
      expect(queryByTestId('placeholder')).not.toBeInTheDocument()
      expect(container.querySelector('.lynx-ui-deferred-component__invisible'))
        .toBeNull()
      expect(requestAnimationFrame).not.toHaveBeenCalled()
      expect(frames).toHaveLength(0)
    },
  )

  it('waits for the remaining frames after the first layout', () => {
    const onLayoutChange = vi.fn()
    const { container, getByTestId, queryByTestId } = render(
      <DeferredComponent
        delayFrames={3}
        placeholder={<text data-testid='placeholder'>Loading</text>}
        onLayoutChange={onLayoutChange}
      >
        <text data-testid='content'>Ready</text>
      </DeferredComponent>,
    )
    const wrapper = container.querySelector(
      '.lynx-ui-deferred-component__invisible',
    )!
    const { frames, requestAnimationFrame } = mockAnimationFrames()

    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(getByTestId('placeholder')).toBeInTheDocument()
    expect(queryByTestId('content')).not.toBeInTheDocument()

    fireEvent.layoutchange(wrapper, {
      detail: { width: 120, height: 40 },
    })
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    expect(queryByTestId('content')).not.toBeInTheDocument()

    act(() => frames.shift()!())
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2)
    expect(getByTestId('placeholder')).toBeInTheDocument()
    expect(queryByTestId('content')).not.toBeInTheDocument()

    act(() => frames.shift()!())
    expect(queryByTestId('placeholder')).not.toBeInTheDocument()
    expect(getByTestId('content')).toHaveTextContent('Ready')
    expect(frames).toHaveLength(0)
    expect(onLayoutChange).not.toHaveBeenCalled()

    fireEvent.layoutchange(wrapper, {
      detail: { width: 121, height: 41 },
    })
    expect(onLayoutChange).toHaveBeenCalledWith({ width: 121, height: 41 })
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2)
  })

  it('replaces its placeholder after the first layout', () => {
    const onLayoutChange = vi.fn()
    const { container, getByTestId, queryByTestId } = render(
      <DeferredComponent
        estimatedStyle={{ width: '120px', height: '40px' }}
        placeholder={<text data-testid='placeholder'>Loading</text>}
        onLayoutChange={onLayoutChange}
      >
        <text data-testid='content'>Ready</text>
      </DeferredComponent>,
    )
    const wrapper = container.querySelector(
      '.lynx-ui-deferred-component__invisible',
    )!

    expect(wrapper).toHaveStyle({ width: '120px', height: '40px' })
    expect(getByTestId('placeholder')).toBeInTheDocument()
    expect(queryByTestId('content')).not.toBeInTheDocument()

    fireEvent.layoutchange(wrapper, {
      detail: { width: 120, height: 40 },
    })
    expect(queryByTestId('placeholder')).not.toBeInTheDocument()
    expect(getByTestId('content')).toHaveTextContent('Ready')
    expect(onLayoutChange).not.toHaveBeenCalled()

    fireEvent.layoutchange(wrapper, {
      detail: { width: 121, height: 41 },
    })
    expect(onLayoutChange).toHaveBeenCalledWith({ width: 121, height: 41 })
  })
})
