// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { animate, createMotionValue } from '@lynx-js/motion/mini'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PopoverMotionContent,
  createPopoverMotion as createController,
} from '../../src/PopoverMotionContent'
import type { PopoverMotionTarget, PopoverMotionValues } from '../../src/types'

function createPopoverMotion(initial: PopoverMotionValues = {}) {
  const controller = createController({
    opacity: createMotionValue(initial.opacity ?? 1),
    scale: createMotionValue(initial.scale ?? 1),
    scaleX: createMotionValue(initial.scaleX ?? 1),
    scaleY: createMotionValue(initial.scaleY ?? 1),
    x: createMotionValue(initial.x ?? 0),
    y: createMotionValue(initial.y ?? 0),
    rotate: createMotionValue(initial.rotate ?? 0),
  }, animate)
  return {
    ...controller,
    start: (
      target: PopoverMotionTarget,
      complete: () => void,
    ) =>
      controller.start(
        target,
        target.transition?.type === 'tween'
          ? { duration: target.transition.duration, ease: (t: number) => t }
          : { type: 'spring', stiffness: target.transition?.stiffness },
        complete,
      ),
  }
}

const { animations } = vi.hoisted(() => ({
  animations: [] as {
    value: { set: (v: number) => void }
    to: number
    options: { onComplete: () => void, duration?: number, stiffness?: number }
    stop: ReturnType<typeof vi.fn>
  }[],
}))
vi.mock('@lynx-js/react', () => ({
  useContext: (context: string) =>
    context === 'geometry' ? '120px 48px' : vi.fn(),
  useRef: (current: unknown) => ({ current }),
  useMainThreadRef: (current: unknown) => ({ current }),
  useEffect: vi.fn(),
}))
vi.mock('../../src/Popover', () => ({
  PopoverContent: 'popover-content',
}))
vi.mock(
  '../../src/motionContext',
  () => ({
    PopoverAnimationContext: 'animation',
    PopoverGeometryContext: 'geometry',
  }),
)
vi.mock('@lynx-js/motion/mini', () => ({
  // Reproduce the first native render, before Motion's main-thread refs exist.
  useMotionValueRef: () => ({ current: undefined }),
  createMotionValue: (initial: number) => {
    let current = initial
    return {
      get: () => current,
      set: (v: number) => {
        current = v
      },
      jump: (v: number) => {
        current = v
      },
    }
  },
  animate: (
    value: { set: (v: number) => void },
    to: number,
    options: { onComplete: () => void },
  ) => {
    const control = { value, to, options, stop: vi.fn() }
    animations.push(control)
    return control
  },
  linear: (v: number) => v,
  easeIn: (v: number) => v,
  easeOut: (v: number) => v,
  easeInOut: (v: number) => v,
}))
beforeEach(() => {
  animations.length = 0
})
describe('Popover Motion controller', () => {
  it('paints initial scale before Motion and positioning are ready', () => {
    const content = PopoverMotionContent({
      initialMotion: { scale: 0 },
      openMotion: { scale: 1 },
      style: { backgroundColor: '#202124' },
    })
    expect(content.props.style).toMatchObject({
      opacity: '1',
      transform:
        'translate(0px, 0px) rotate(0deg) scale(0) scaleX(1) scaleY(1)',
      backgroundColor: '#202124',
      transformOrigin: '120px 48px',
    })
    const setStyleProperties = vi.fn()
    content.props.popoverContentProps['main-thread:ref']({ setStyleProperties })
    expect(setStyleProperties).toHaveBeenCalledWith({
      opacity: '1',
      transform:
        'translate(0px, 0px) rotate(0deg) scale(0) scaleX(1) scaleY(1)',
    })
    expect(animations).toHaveLength(0)
  })
  it('paints an initial fade without waiting for an animation callback', () => {
    const content = PopoverMotionContent({ initialMotion: { opacity: 0 } })
    expect(content.props.style.opacity).toBe('0')
    expect(animations).toHaveLength(0)
  })
  it('waits for every animated property before reporting completion', () => {
    const controller = createPopoverMotion({ scale: 0, opacity: 0 })
    const complete = vi.fn()
    controller.start({
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 850 },
    }, complete)
    expect(animations).toHaveLength(2)
    expect(animations[0]!.options.stiffness).toBe(850)
    animations[0]!.options.onComplete()
    expect(complete).not.toHaveBeenCalled()
    animations[1]!.options.onComplete()
    expect(complete).toHaveBeenCalledTimes(1)
  })
  it('preserves current values on reversal and rejects cancelled completion', () => {
    const controller = createPopoverMotion({ scale: 0 })
    const opened = vi.fn(), closed = vi.fn()
    controller.start({ scale: 1 }, opened)
    controller.values.scale.set(0.6)
    controller.start({ scale: 0 }, closed)
    expect(controller.values.scale.get()).toBe(0.6)
    expect(animations[0]!.stop).toHaveBeenCalledOnce()
    animations[0]!.options.onComplete()
    expect(opened).not.toHaveBeenCalled()
    animations[1]!.options.onComplete()
    expect(closed).toHaveBeenCalledOnce()
  })
  it('applies a zero-duration target immediately and preserves omitted properties', () => {
    const controller = createPopoverMotion({ scale: 0.5, x: 12, opacity: 0.4 })
    const complete = vi.fn()
    controller.start(
      { scale: 1, transition: { type: 'tween', duration: 0 } },
      complete,
    )
    expect(animations).toHaveLength(0)
    expect(controller.values.scale.get()).toBe(1)
    expect(controller.values.x.get()).toBe(12)
    expect(controller.values.opacity.get()).toBe(0.4)
    expect(complete).toHaveBeenCalledOnce()
  })
  it('uses seconds for tween timing and composes transform targets', () => {
    const controller = createPopoverMotion({
      x: 10,
      y: 20,
      rotate: 30,
      scale: 0.5,
      scaleX: 2,
      scaleY: 3,
    })
    controller.start({
      opacity: 0,
      transition: { type: 'tween', duration: 0.15, ease: 'linear' },
    }, vi.fn())
    expect(animations[0]!.options.duration).toBe(0.15)
    expect(controller.styles().transform).toBe(
      'translate(10px, 20px) rotate(30deg) scale(0.5) scaleX(2) scaleY(3)',
    )
  })
  it('completes a target with no animated properties and cancels unmounted work', () => {
    const controller = createPopoverMotion()
    const complete = vi.fn()
    controller.start({}, complete)
    expect(complete).toHaveBeenCalledOnce()
    controller.start({ scale: 0 }, complete)
    controller.cancel()
    animations[0]!.options.onComplete()
    expect(complete).toHaveBeenCalledOnce()
  })
})
