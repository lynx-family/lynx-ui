// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:ignore catchmousedown catchmousemove catchmouseup

import { act, fireEvent, render } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SliderTrack } from '../SliderTrack'
import type { SliderRootProps } from '../types'

import { SliderRoot } from './index'

interface InvokeOptions {
  method: string
  params?: Record<string, unknown>
  success?: (res: unknown) => void
  fail?: (res: { code: number, data?: unknown }) => void
}

interface EventMappedElement extends Element {
  eventMap?: Record<string, unknown>
}

const EVENT_TYPE_PREFIXES = [
  ['global-bind', 'global-bindEvent'],
  ['catch', 'catchEvent'],
  ['bind', 'bindEvent'],
] as const

const invokeMock = vi.fn((options: InvokeOptions) => ({
  exec: () => {
    if (options.method === 'boundingClientRect') {
      options.success?.({ left: 40, width: 560 })
    }
  },
}))

beforeEach(() => {
  invokeMock.mockClear()
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  ) as { invoke: (options: InvokeOptions) => { exec: () => void } }
  vi.spyOn(prototype, 'invoke').mockImplementation(invokeMock)
})

function setup(platform: string, options: Partial<SliderRootProps> = {}) {
  SystemInfo.platform = platform as typeof SystemInfo.platform
  const onValueChange = vi.fn()
  const onValueCommit = vi.fn()
  const onDragging = vi.fn()
  const { container } = render(
    <SliderRoot
      defaultValue={0.3}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      onDragging={onDragging}
      {...options}
    >
      <SliderTrack />
    </SliderRoot>,
  )
  const root = container.firstElementChild as HTMLElement & EventMappedElement

  const send = async (name: string, event: Record<string, unknown> = {}) => {
    const matched = EVENT_TYPE_PREFIXES.find(([prefix]) =>
      name.startsWith(prefix)
    )
    if (!matched) {
      throw new Error(`Unsupported event name: ${name}`)
    }
    const [prefix, eventType] = matched
    const eventName = name.slice(prefix.length) as keyof typeof fireEvent
    const dispatch = fireEvent[eventName] as (
      element: Element,
      init?: Record<string, unknown>,
    ) => boolean
    await act(async () => {
      dispatch(root, { eventType, ...event })
      await Promise.resolve()
    })
  }

  return { root, send, onValueChange, onValueCommit, onDragging }
}

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
    const slider = setup('Android', { style: { height: '36px' } })
    expect(slider.root.getAttribute('style')).toContain('height: 36px')
    expect(slider.root.getAttribute('style')).not.toContain('user-select')
    for (const event of ['mousemove', 'touchmove', 'touchend', 'touchcancel']) {
      expect(slider.root.eventMap?.[`global-bindEvent:${event}`])
        .toBeUndefined()
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
    expect(slider.root.style.touchAction).toBe('none')
    expect(slider.root.style.userSelect).toBe('none')
    expect(slider.root.classList.contains('ui-disabled')).toBe(true)
    await slider.send('catchmousedown', { x: 320 })
    await slider.send('global-bindmousemove', { x: 488 })
    await slider.send('global-bindmouseup')
    expect(slider.onValueChange).not.toHaveBeenCalled()
    expect(slider.onValueCommit).not.toHaveBeenCalled()
  })
})
