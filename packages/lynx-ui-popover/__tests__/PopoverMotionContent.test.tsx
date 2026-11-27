// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
} from '@lynx-js/react'

import { PresenceContext, PresenceState } from '@lynx-js/lynx-ui-presence'
import type { PresenceAnimationDriver } from '@lynx-js/lynx-ui-presence'
import { animate, createMotionValue } from '@lynx-js/motion/mini'
import { act, render } from '@lynx-js/react/testing-library'
import type { MainThread } from '@lynx-js/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PopoverMotionContext,
  PopoverPositionerContext,
} from '../src/motionContext'
import {
  PopoverMotionContent,
  createPopoverMotion as createController,
} from '../src/PopoverMotionContent'
import type {
  PopoverMotionContentProps,
  PopoverMotionTarget,
  PopoverMotionValues,
} from '../src/types'
import { PopoverContext } from '../src/useElementInfoReducer'

interface MockAnimationControl {
  value: { set: (v: number) => void }
  to: number
  options: { onComplete: () => void, duration?: number, stiffness?: number }
  stopCount: number
  stop: () => void
}

interface MainThreadMotionGlobals {
  __popoverMockAnimations?: MockAnimationControl[]
}

const { register } = vi.hoisted(() => ({
  register: vi.fn<(driver: PresenceAnimationDriver) => () => void>(),
}))

function getAnimations(): MockAnimationControl[] {
  const mtGlobal = lynxTestingEnv.mainThread
    .globalThis as unknown as MainThreadMotionGlobals
  mtGlobal.__popoverMockAnimations ??= []
  return mtGlobal.__popoverMockAnimations
}

// Use a deterministic main-thread Motion stub so animation completion,
// reversal, and transition options can be stepped synchronously without native RAF timing.
vi.mock('@lynx-js/motion/mini', () => ({
  createMotionValue: (initial: number) => {
    'main thread'
    let current = initial
    return {
      get: () => current,
      set: (v: number) => {
        current = v
      },
      jump: (v: number) => {
        current = v
      },
      on: () => () => undefined,
    }
  },
  animate: (
    value: { set: (v: number) => void },
    to: number,
    options: { onComplete: () => void, duration?: number, stiffness?: number },
  ) => {
    'main thread'
    const mtGlobal = globalThis as unknown as MainThreadMotionGlobals
    mtGlobal.__popoverMockAnimations ??= []
    const control: MockAnimationControl = {
      value,
      to,
      options,
      stopCount: 0,
      stop: () => {
        control.stopCount += 1
      },
    }
    mtGlobal.__popoverMockAnimations.push(control)
    return control
  },
  linear: (v: number) => {
    'main thread'
    return v
  },
  easeIn: (v: number) => {
    'main thread'
    return v
  },
  easeOut: (v: number) => {
    'main thread'
    return v
  },
  easeInOut: (v: number) => {
    'main thread'
    return v
  },
}))

const noop = () => undefined

const presenceContextValue = {
  animationHandlers: {
    handleKFStart: noop,
    handleKFCancel: noop,
    handleKFEnd: noop,
    handleTransitionStart: noop,
    handleTransitionCancel: noop,
    handleTransitionEnd: noop,
  },
  controllers: {
    state: PresenceState.Entered,
    setPresenceState: noop,
  },
}

const popoverContextValue = {
  sharedInfo: {
    arrow: { x: 0, y: 0 },
    floating: { x: 0, y: 0, width: 120, height: 48 },
    reference: { x: 0, y: 0, width: 40, height: 40 },
  },
  updateRects: noop,
  forceMount: false,
  show: true,
  setUncontrolledShow: noop,
  hasAnchor: false,
  setHasAnchor: noop,
  state: PresenceState.Entered,
  setPresenceState: noop,
  isControlled: true,
}

function renderMotionContent(props: PopoverMotionContentProps = {}) {
  return render(
    <PopoverContext.Provider
      value={popoverContextValue as unknown as React.ContextType<
        typeof PopoverContext
      >}
    >
      <PresenceContext.Provider value={presenceContextValue}>
        <PopoverPositionerContext.Provider
          value={{ transformOrigin: '120px 48px' }}
        >
          <PopoverMotionContext.Provider value={{ register, active: true }}>
            <PopoverMotionContent
              {...props}
              popoverContentProps={{
                id: 'motion-bubble',
                ...props.popoverContentProps,
              }}
            />
          </PopoverMotionContext.Provider>
        </PopoverPositionerContext.Provider>
      </PresenceContext.Provider>
    </PopoverContext.Provider>,
  )
}

function createPopoverMotion(initial: PopoverMotionValues = {}) {
  'main thread'
  const controller = createController(
    {
      opacity: initial.opacity ?? 1,
      scale: initial.scale ?? 1,
      scaleX: initial.scaleX ?? 1,
      scaleY: initial.scaleY ?? 1,
      x: initial.x ?? 0,
      y: initial.y ?? 0,
      rotate: initial.rotate ?? 0,
    },
    animate,
    createMotionValue,
  )
  return {
    ...controller,
    start: (
      target: PopoverMotionTarget,
      complete: () => void,
    ) => {
      'main thread'
      controller.start(
        target,
        target.transition?.type === 'tween'
          ? { duration: target.transition.duration, ease: (t: number) => t }
          : { type: 'spring', stiffness: target.transition?.stiffness },
        complete,
      )
    },
  }
}

beforeEach(() => {
  getAnimations().length = 0
  register.mockReset()
})

describe('Popover Motion controller', () => {
  it('runs a consumer main-thread ref cleanup on detach', () => {
    const attached = vi.fn()
    const disposed = vi.fn()
    const ref = (element: MainThread.Element | null) => {
      'main thread'
      runOnBackground(attached)(element !== null)
      return () => {
        'main thread'
        runOnBackground(disposed)()
      }
    }
    const { unmount } = renderMotionContent({
      popoverContentProps: { 'main-thread:ref': ref },
    })
    expect(attached).toHaveBeenCalledTimes(1)
    expect(attached).toHaveBeenCalledWith(true)
    act(() => unmount())
    expect(disposed).toHaveBeenCalledOnce()
    expect(attached).toHaveBeenCalledTimes(1)
  })

  it('forwards null to a main-thread callback ref without cleanup', () => {
    const calls: boolean[] = []
    const record = (hasElement: boolean) => {
      calls.push(hasElement)
    }
    const ref = (element: MainThread.Element | null) => {
      'main thread'
      runOnBackground(record)(element !== null)
    }
    const { unmount } = renderMotionContent({
      popoverContentProps: { 'main-thread:ref': ref },
    })
    expect(calls).toEqual([true])
    act(() => unmount())
    expect(calls).toEqual([true, false])
  })

  it('updates and clears a consumer main-thread object ref', async () => {
    let readRefState: (() => boolean) | undefined
    function ObjectRefFixture() {
      const ref = useMainThreadRef<MainThread.Element | null>(null)
      readRefState = () => {
        'main thread'
        return ref.current !== null
      }
      return (
        <PopoverContext.Provider
          value={popoverContextValue as unknown as React.ContextType<
            typeof PopoverContext
          >}
        >
          <PresenceContext.Provider value={presenceContextValue}>
            <PopoverPositionerContext.Provider
              value={{ transformOrigin: '120px 48px' }}
            >
              <PopoverMotionContext.Provider value={{ register, active: true }}>
                <PopoverMotionContent
                  popoverContentProps={{
                    id: 'motion-bubble',
                    'main-thread:ref': ref,
                  }}
                />
              </PopoverMotionContext.Provider>
            </PopoverPositionerContext.Provider>
          </PresenceContext.Provider>
        </PopoverContext.Provider>
      )
    }

    const { unmount } = render(<ObjectRefFixture />)
    await expect(runOnMainThread(readRefState!)()).resolves.toBe(true)
    act(() => unmount())
    await expect(runOnMainThread(readRefState!)()).resolves.toBe(false)
  })

  it('preserves style properties that motion does not animate', () => {
    const scaleResult = renderMotionContent({
      motion: { initial: { scale: 0.8 }, open: { scale: 1 } },
      style: { opacity: 0.4 },
    })
    const scaleBubble = scaleResult.container.querySelector(
      '#motion-bubble',
    ) as HTMLElement
    expect(scaleBubble.style.opacity).toBe('0.4')
    expect(scaleBubble.style.transform).toContain('scale(0.8)')
    act(() => scaleResult.unmount())

    const fadeResult = renderMotionContent({
      motion: { initial: { opacity: 0 }, open: { opacity: 1 } },
      style: { transform: 'rotate(10deg)' },
    })
    const fadeBubble = fadeResult.container.querySelector(
      '#motion-bubble',
    ) as HTMLElement
    expect(fadeBubble.style.transform).toBe('rotate(10deg)')
    expect(fadeBubble.style.opacity).toBe('0')
  })

  it('paints initial scale before Motion and positioning are ready', () => {
    const { container } = renderMotionContent({
      motion: { initial: { scale: 0 }, open: { scale: 1 } },
      style: { backgroundColor: '#202124' },
    })
    const bubble = container.querySelector('#motion-bubble') as HTMLElement
    expect(bubble.style.transform).toBe(
      'translate(0px, 0px) rotate(0deg) scale(0) scaleX(1) scaleY(1)',
    )
    expect(bubble.style.transformOrigin).toBe('120px 48px')
    expect(bubble.getAttribute('style')).toContain('background-color')
    expect(getAnimations()).toHaveLength(0)
  })

  it('paints an initial fade without waiting for an animation callback', () => {
    const { container } = renderMotionContent({
      motion: { initial: { opacity: 0 } },
    })
    const bubble = container.querySelector('#motion-bubble') as HTMLElement
    expect(bubble.style.opacity).toBe('0')
    expect(getAnimations()).toHaveLength(0)
  })

  it('accepts grouped options with a shared transition and phase overrides', async () => {
    const { container } = renderMotionContent({
      motion: {
        initial: { scale: 0 },
        open: { scale: 1 },
        close: { scale: 0, transition: { type: 'spring', stiffness: 600 } },
        transition: { type: 'spring', stiffness: 300 },
      },
    })
    const bubble = container.querySelector('#motion-bubble') as HTMLElement
    expect(bubble.style.transform).toContain('scale(0)')
    expect(register).toHaveBeenCalledOnce()

    const driver = register.mock.calls[0]![0]
    await act(async () => {
      driver({ open: true, complete: vi.fn() })
      await Promise.resolve()
    })
    expect(getAnimations()[0]!.options.stiffness).toBe(300)

    await act(async () => {
      driver({ open: false, complete: vi.fn() })
      await Promise.resolve()
    })
    expect(getAnimations()[1]!.options.stiffness).toBe(600)
  })

  it('waits for every animated property before reporting completion', async () => {
    render(<view />)
    const complete = vi.fn()
    await runOnMainThread(() => {
      'main thread'
      const controller = createPopoverMotion({ scale: 0, opacity: 0 })
      controller.start(
        {
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', stiffness: 850 },
        },
        () => {
          'main thread'
          runOnBackground(complete)()
        },
      )
    })()

    const animations = getAnimations()
    expect(animations).toHaveLength(2)
    expect(animations[0]!.options.stiffness).toBe(850)
    await runOnMainThread(() => {
      'main thread'
      const list = (globalThis as unknown as MainThreadMotionGlobals)
        .__popoverMockAnimations!
      list[0]!.options.onComplete()
    })()
    expect(complete).not.toHaveBeenCalled()
    await runOnMainThread(() => {
      'main thread'
      const list = (globalThis as unknown as MainThreadMotionGlobals)
        .__popoverMockAnimations!
      list[1]!.options.onComplete()
    })()
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it('preserves current values on reversal and rejects cancelled completion', async () => {
    render(<view />)
    const opened = vi.fn()
    const closed = vi.fn()
    const scaleAfterReversal = await runOnMainThread(() => {
      'main thread'
      const controller = createPopoverMotion({ scale: 0 })
      controller.start({ scale: 1 }, () => {
        'main thread'
        runOnBackground(opened)()
      })
      controller.values.scale.set(0.6)
      controller.start({ scale: 0 }, () => {
        'main thread'
        runOnBackground(closed)()
      })
      return controller.values.scale.get()
    })()

    expect(scaleAfterReversal).toBe(0.6)
    expect(getAnimations()[0]!.stopCount).toBe(1)
    await runOnMainThread(() => {
      'main thread'
      const list = (globalThis as unknown as MainThreadMotionGlobals)
        .__popoverMockAnimations!
      list[0]!.options.onComplete()
    })()
    expect(opened).not.toHaveBeenCalled()
    await runOnMainThread(() => {
      'main thread'
      const list = (globalThis as unknown as MainThreadMotionGlobals)
        .__popoverMockAnimations!
      list[1]!.options.onComplete()
    })()
    expect(closed).toHaveBeenCalledOnce()
  })

  it('applies a zero-duration target immediately and preserves omitted properties', async () => {
    render(<view />)
    const complete = vi.fn()
    const snapshot = await runOnMainThread(() => {
      'main thread'
      const controller = createPopoverMotion({
        scale: 0.5,
        x: 12,
        opacity: 0.4,
      })
      controller.start(
        { scale: 1, transition: { type: 'tween', duration: 0 } },
        () => {
          'main thread'
          runOnBackground(complete)()
        },
      )
      return {
        scale: controller.values.scale.get(),
        x: controller.values.x.get(),
        opacity: controller.values.opacity.get(),
      }
    })()

    expect(getAnimations()).toHaveLength(0)
    expect(snapshot).toEqual({ scale: 1, x: 12, opacity: 0.4 })
    expect(complete).toHaveBeenCalledOnce()
  })

  it('synchronizes newly mounted content to its open target immediately', async () => {
    render(<view />)
    const complete = vi.fn()
    const snapshot = await runOnMainThread(() => {
      'main thread'
      const controller = createController(
        {
          opacity: 0,
          scale: 0.5,
          scaleX: 1,
          scaleY: 1,
          x: 0,
          y: 0,
          rotate: 0,
        },
        animate,
        createMotionValue,
      )
      controller.start(
        { opacity: 1, scale: 1 },
        { type: 'spring' },
        () => {
          'main thread'
          runOnBackground(complete)()
        },
        true,
      )
      return {
        opacity: controller.values.opacity.get(),
        scale: controller.values.scale.get(),
      }
    })()

    expect(getAnimations()).toHaveLength(0)
    expect(snapshot).toEqual({ opacity: 1, scale: 1 })
    expect(complete).toHaveBeenCalledOnce()
  })

  it('uses seconds for tween timing and composes transform targets', async () => {
    render(<view />)
    const transform = await runOnMainThread(() => {
      'main thread'
      const controller = createPopoverMotion({
        x: 10,
        y: 20,
        rotate: 30,
        scale: 0.5,
        scaleX: 2,
        scaleY: 3,
      })
      controller.start(
        {
          opacity: 0,
          transition: { type: 'tween', duration: 0.15, ease: 'linear' },
        },
        () => {
          'main thread'
        },
      )
      return controller.styles().transform
    })()

    expect(getAnimations()[0]!.options.duration).toBe(0.15)
    expect(transform).toBe(
      'translate(10px, 20px) rotate(30deg) scale(0.5) scaleX(2) scaleY(3)',
    )
  })

  it('completes a target with no animated properties and cancels unmounted work', async () => {
    render(<view />)
    const complete = vi.fn()
    await runOnMainThread(() => {
      'main thread'
      const controller = createPopoverMotion()
      const onDone = () => {
        'main thread'
        runOnBackground(complete)()
      }
      controller.start({}, onDone)
      controller.start({ scale: 0 }, onDone)
      controller.cancel()
      const list = (globalThis as unknown as MainThreadMotionGlobals)
        .__popoverMockAnimations!
      list[0]!.options.onComplete()
    })()

    expect(complete).toHaveBeenCalledOnce()
  })
})
