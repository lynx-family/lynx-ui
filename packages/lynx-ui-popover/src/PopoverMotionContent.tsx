// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useContext,
  useEffect,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'

import {
  animate,
  easeIn,
  easeInOut,
  easeOut,
  linear,
  useMotionValueRef,
} from '@lynx-js/motion/mini'
import type { AnimationOptions, MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import {
  PopoverAnimationContext,
  PopoverGeometryContext,
} from './motionContext'
import { PopoverContent } from './Popover'
import type { PopoverMotionContentProps, PopoverMotionTarget } from './types'

// Content with declarative targets and automatic Presence completion.
export function PopoverMotionContent(props: PopoverMotionContentProps) {
  const {
    initialMotion,
    openMotion = {},
    closeMotion = {},
    style,
    popoverContentProps,
    ...rest
  } = props
  const register = useContext(PopoverAnimationContext)
  const transformOrigin = useContext(PopoverGeometryContext)
  if (!register) {
    throw new Error('PopoverMotionContent must be inside PopoverRoot')
  }
  const initial = useRef({
    opacity: initialMotion?.opacity ?? 1,
    scale: initialMotion?.scale ?? 1,
    scaleX: initialMotion?.scaleX ?? 1,
    scaleY: initialMotion?.scaleY ?? 1,
    x: initialMotion?.x ?? 0,
    y: initialMotion?.y ?? 0,
    rotate: initialMotion?.rotate ?? 0,
  }).current
  // Native can paint before Motion's refs and the positioning pass are ready.
  // Seed the first render, then let the main-thread controller own these styles.
  const initialStyles = {
    opacity: `${initial.opacity}`,
    transform:
      `translate(${initial.x}px, ${initial.y}px) rotate(${initial.rotate}deg) scale(${initial.scale}) scaleX(${initial.scaleX}) scaleY(${initial.scaleY})`,
  }
  const opacity = useMotionValueRef(initial.opacity)
  const scale = useMotionValueRef(initial.scale)
  const scaleX = useMotionValueRef(initial.scaleX)
  const scaleY = useMotionValueRef(initial.scaleY)
  const x = useMotionValueRef(initial.x)
  const y = useMotionValueRef(initial.y)
  const rotate = useMotionValueRef(initial.rotate)
  const elementRef = useMainThreadRef<MainThread.Element | null>(null)
  const motionRef = useMainThreadRef<PopoverMotionController | null>(null)
  const requestRef = useMainThreadRef(0)
  // Keep the imported functions in the main-thread bundle, including when they
  // are only invoked from a background-scheduled animation.
  useMainThreadRef({
    animate,
    linear,
    easeIn,
    easeOut,
    easeInOut,
  })
  const completion = useRef<{ id: number, complete: () => void } | null>(null)
  const sequence = useRef(0)
  const latest = useRef({ openMotion, closeMotion })
  latest.current = { openMotion, closeMotion }
  const externalRef = popoverContentProps?.['main-thread:ref']

  const applyStyles = () => {
    'main thread'
    const element = elementRef.current
    const motion = motionRef.current
    if (element && motion) element.setStyleProperties(motion.styles())
  }
  const bindElement = (element: MainThread.Element | null) => {
    'main thread'
    elementRef.current = element
    if (externalRef) {
      if (typeof externalRef === 'function') externalRef(element)
      else {
        const mutableRef = externalRef as { current: MainThread.Element | null }
        mutableRef.current = element
      }
    }
    if (!element) return

    const motion = motionRef.current
    element.setStyleProperties(motion ? motion.styles() : initialStyles)
  }
  const finish = (id: number) => {
    if (completion.current?.id === id) completion.current.complete()
  }
  const start = (target: PopoverMotionTarget, id: number) => {
    'main thread'
    requestRef.current = id
    // Motion hooks initialize their refs on the main thread after mount.
    // Entry starts only after Popover's positioning pass, so the values exist.
    if (!motionRef.current) {
      const motion = createPopoverMotion({
        opacity: opacity.current,
        scale: scale.current,
        scaleX: scaleX.current,
        scaleY: scaleY.current,
        x: x.current,
        y: y.current,
        rotate: rotate.current,
      }, (value, to, options) => {
        'main thread'
        return animate(value, to, options)
      })
      motionRef.current = motion
      for (const value of Object.values(motion.values)) {
        value.on('change', applyStyles)
      }
    }
    const motion = motionRef.current
    applyStyles()
    const transition = target.transition
    const easings = { linear, easeIn, easeOut, easeInOut }
    const options = transition?.type === 'tween'
      ? {
        duration: transition.duration ?? 0.3,
        ease: easings[transition.ease ?? 'easeOut'],
      }
      : {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        mass: 1,
        ...transition,
      }
    motion.start(target, options, () => {
      'main thread'
      if (requestRef.current === id) runOnBackground(finish)(id)
    })
  }
  const stop = (id: number) => {
    'main thread'
    if (requestRef.current !== id) return
    requestRef.current = 0
    const motion = motionRef.current
    if (motion) motion.cancel()
  }
  useEffect(() =>
    register(({ open, complete }) => {
      const id = ++sequence.current
      completion.current = { id, complete }
      runOnMainThread(start)(
        open ? latest.current.openMotion : latest.current.closeMotion,
        id,
      )
      return () => {
        if (completion.current?.id === id) completion.current = null
        runOnMainThread(stop)(id)
      }
    }), [register])

  return (
    <PopoverContent
      {...rest}
      style={{
        ...style,
        ...initialStyles,
        transformOrigin: style?.transformOrigin ?? transformOrigin,
      }}
      popoverContentProps={{
        ...popoverContentProps,
        'main-thread:ref': bindElement,
      }}
    />
  )
}

const IDENTITY = {
  opacity: 1,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,
  rotate: 0,
}
type Property = keyof typeof IDENTITY
export interface PopoverMotionController {
  values: Record<Property, MotionValue<number>>
  cancel: () => void
  styles: () => { transform: string, opacity: string }
  start: (
    target: PopoverMotionTarget,
    options: AnimationOptions,
    complete: () => void,
  ) => void
}

// A controller exists only for the mounted content, on the main thread.
export function createPopoverMotion(
  values: PopoverMotionController['values'],
  animateValue: typeof animate,
): PopoverMotionController {
  'main thread'
  let generation = 0
  let controls: ReturnType<typeof animate>[] = []
  const cancel = () => {
    'main thread'
    generation++
    for (const control of controls) control.stop()
    controls = []
  }
  return {
    values,
    cancel,
    styles: () => {
      'main thread'
      return {
        opacity: `${values.opacity.get()}`,
        transform:
          `translate(${values.x.get()}px, ${values.y.get()}px) rotate(${values.rotate.get()}deg) scale(${values.scale.get()}) scaleX(${values.scaleX.get()}) scaleY(${values.scaleY.get()})`,
      }
    },
    start: (target, options, complete) => {
      'main thread'
      cancel()
      const current = generation
      const properties = (Object.keys(IDENTITY) as Property[]).filter(
        property => target[property] !== undefined,
      )
      let pending = properties.length
      if (pending === 0) {
        complete()
        return
      }
      for (const property of properties) {
        const to = target[property]!
        if (
          target.transition?.type === 'tween'
          && target.transition.duration === 0
        ) {
          values[property].jump(to)
          if (--pending === 0) complete()
        } else {
          controls.push(animateValue(values[property], to, {
            ...options,
            onComplete: () => {
              'main thread'
              if (generation === current && --pending === 0) complete()
            },
          }))
        }
      }
    },
  }
}
