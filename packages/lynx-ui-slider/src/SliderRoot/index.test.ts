// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:ignore catchmousedown catchmousemove catchmouseup jsxs unstub

import { getRectByRef } from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { SliderContextValue } from '../context'
import type { SliderRootProps } from '../types'

import { SliderRoot } from './index'

// Exercise the component's event lifecycle without modeling native rendering.
vi.mock('@lynx-js/react', () => ({
  memo: <T>(component: T) => component,
  forwardRef: <T>(component: T) => component,
  useRef: <T>(current: T) => ({ current }),
  useState: <T>(initial: T) => [initial, vi.fn()],
  useEffect: vi.fn(),
  useImperativeHandle: vi.fn(),
}))
vi.mock('@lynx-js/react/jsx-runtime', () => ({
  jsx: (type: unknown, props: unknown) => ({ type, props }),
  jsxs: (type: unknown, props: unknown) => ({ type, props }),
}))
vi.mock('../context', () => ({ SliderContext: { Provider: 'provider' } }))
vi.mock('@lynx-js/lynx-ui-common', () => ({ getRectByRef: vi.fn() }))

interface TestTree {
  props: {
    value: SliderContextValue
    children: { props: Record<string, unknown> }
  }
}

function setup(platform: string, options: Partial<SliderRootProps> = {}) {
  vi.stubGlobal('SystemInfo', { platform })
  vi.mocked(getRectByRef).mockResolvedValue({ left: 40, width: 560 })
  const onValueChange = vi.fn()
  const onValueCommit = vi.fn()
  const onDragging = vi.fn()
  const tree = SliderRoot({
    defaultValue: 0.3,
    onValueChange,
    onValueCommit,
    onDragging,
    ...options,
  }) as unknown as TestTree
  tree.props.value.trackRef.current = {} as NodesRef
  const props = tree.props.children.props
  const send = async (name: string, event: unknown = {}) => {
    const handler = props[name] as ((event: unknown) => void) | undefined
    handler?.(event)
    await Promise.resolve()
  }
  return { props, send, onValueChange, onValueCommit, onDragging }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('slider platform interactions', () => {
  it('tracks Web movement outside the root and commits only once', async () => {
    const slider = setup('web')
    await slider.send('global-bindmousemove', { x: 600, clientX: 760 })
    expect(slider.onValueChange).not.toHaveBeenCalled()
    await slider.send('catchmousedown', { x: 320, clientX: 480 })
    expect(slider.onValueChange).toHaveBeenLastCalledWith(0.5, 'drag')
    await slider.send('global-bindmousemove', { x: 488, clientX: 648 })
    expect(slider.onValueChange).toHaveBeenLastCalledWith(0.8, 'drag')
    await slider.send('catchmouseup')
    await slider.send('global-bindmouseup')
    expect(slider.onValueCommit).toHaveBeenCalledTimes(1)
    expect(slider.onValueCommit).toHaveBeenCalledWith(0.8)
    expect(slider.onDragging).toHaveBeenCalledTimes(2)
    slider.onValueChange.mockClear()
    await slider.send('global-bindmousemove', { x: 40, clientX: 200 })
    expect(slider.onValueChange).not.toHaveBeenCalled()
  })

  it.each(['global-bindtouchend', 'global-bindtouchcancel'])(
    'ends a Web touch interaction through %s',
    async ending => {
      const slider = setup('web')
      await slider.send('catchtouchstart', {
        touches: [{ x: 320, clientX: 480 }],
      })
      await slider.send('global-bindtouchmove', {
        touches: [{ x: 488, clientX: 648 }],
      })
      await slider.send(ending)
      expect(slider.onValueCommit).toHaveBeenCalledTimes(1)
      expect(slider.onValueCommit).toHaveBeenCalledWith(0.8)
      slider.onValueChange.mockClear()
      await slider.send('global-bindtouchmove', {
        touches: [{ x: 40, clientX: 200 }],
      })
      expect(slider.onValueChange).not.toHaveBeenCalled()
    },
  )

  it('preserves Android touch coordinates, styles and subscriptions', async () => {
    const style = { height: '36px' }
    const slider = setup('Android', { style })
    expect(slider.props.style).toBe(style)
    for (const event of ['mousemove', 'touchmove', 'touchend', 'touchcancel']) {
      expect(slider.props[`global-bind${event}`]).toBeUndefined()
    }
    await slider.send('catchtouchstart', { detail: { x: 320 }, clientX: 999 })
    expect(slider.onValueChange).toHaveBeenLastCalledWith(0.5, 'drag')
    await slider.send('catchtouchmove', { detail: { x: 488 }, clientX: 999 })
    await slider.send('catchtouchend')
    expect(slider.onValueCommit).toHaveBeenCalledTimes(1)
    expect(slider.onValueCommit).toHaveBeenCalledWith(0.8)
  })

  it('keeps Web gesture styles overridable and disabled sliders inert', async () => {
    const slider = setup('web', {
      disabled: true,
      style: { touchAction: 'none' },
    })
    expect(slider.props.style).toEqual({
      touchAction: 'none',
      userSelect: 'none',
    })
    await slider.send('catchmousedown', { x: 320 })
    await slider.send('global-bindmousemove', { x: 488 })
    await slider.send('global-bindmouseup')
    expect(slider.onValueChange).not.toHaveBeenCalled()
    expect(slider.onValueCommit).not.toHaveBeenCalled()
  })
})
