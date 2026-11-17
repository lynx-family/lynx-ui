// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useCallback,
  useContext,
  useEffect,
  useMainThreadRef,
  useMemo,
  useRef,
} from '@lynx-js/react'

import {
  animate,
  createMotionValue,
  easeIn,
  easeInOut,
  easeOut,
  linear,
} from '@lynx-js/motion/mini'
import type { AnimationOptions, MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { PopoverMotionContext, PopoverPositionerContext } from './motionContext'
import { PopoverContent } from './Popover'
import type { PopoverMotionContentProps, PopoverMotionTarget } from './types'

// Content with declarative targets and automatic Presence completion.
export function PopoverMotionContent(props: PopoverMotionContentProps) {
  const {
    motion: motionOptions,
    style,
    popoverContentProps,
    ...rest
  } = props
  const { register } = useContext(PopoverMotionContext)
  const { transformOrigin } = useContext(PopoverPositionerContext)
  if (!register) {
    throw new Error('PopoverMotionContent must be inside PopoverRoot')
  }
  const initialMotion = motionOptions?.initial
  const openTarget = motionOptions?.open ?? {}
  const closeTarget = motionOptions?.close ?? {}
  const openMotion = openTarget.transition || !motionOptions?.transition
    ? openTarget
    : { ...openTarget, transition: motionOptions.transition }
  const closeMotion = closeTarget.transition || !motionOptions?.transition
    ? closeTarget
    : { ...closeTarget, transition: motionOptions.transition }
  const initial = useRef({
    opacity: initialMotion?.opacity ?? 1,
    scale: initialMotion?.scale ?? 1,
    scaleX: initialMotion?.scaleX ?? 1,
    scaleY: initialMotion?.scaleY ?? 1,
    x: initialMotion?.x ?? 0,
    y: initialMotion?.y ?? 0,
    rotate: initialMotion?.rotate ?? 0,
  }).current
  const targets = [initialMotion, openMotion, closeMotion]
  const ownsOpacity = targets.some(target => target?.opacity !== undefined)
  const ownsTransform = targets.some(target =>
    target?.scale !== undefined || target?.scaleX !== undefined
    || target?.scaleY !== undefined || target?.x !== undefined
    || target?.y !== undefined || target?.rotate !== undefined
  )
  const ownedStyles = useMemo(() => ({
    opacity: ownsOpacity,
    transform: ownsTransform,
  }), [ownsOpacity, ownsTransform])
  // Native can paint before Motion's refs and the positioning pass are ready.
  // Seed the first render, then let the main-thread controller own these styles.
  const initialStyles = useMemo(() => ({
    ...(ownedStyles.opacity && { opacity: `${initial.opacity}` }),
    ...(ownedStyles.transform && {
      transform:
        `translate(${initial.x}px, ${initial.y}px) rotate(${initial.rotate}deg) scale(${initial.scale}) scaleX(${initial.scaleX}) scaleY(${initial.scaleY})`,
    }),
  }), [initial, ownedStyles])
  const mainThread = useMainThreadRef<MotionRuntime>({
    element: null,
    controller: null,
    request: 0,
    ownedStyles,
  })
  // Keep the imported functions in the main-thread bundle, including when they
  // are only invoked from a background-scheduled animation.
  useMainThreadRef({
    animate,
    createMotionValue,
    linear,
    easeIn,
    easeOut,
    easeInOut,
  })
  const completion = useRef<{ id: number, complete: () => void } | null>(null)
  const sequence = useRef(0)
  const latest = useRef({ openMotion, closeMotion, ownedStyles })
  latest.current = { openMotion, closeMotion, ownedStyles }
  const externalRef = popoverContentProps?.['main-thread:ref']

  const applyStyles = () => {
    'main thread'
    const { element, controller: motion, ownedStyles } = mainThread.current
    if (element && motion) {
      element.setStyleProperties(motion.styles(ownedStyles))
    }
  }
  const bindElement = useCallback((element: MainThread.Element | null) => {
    'main thread'
    mainThread.current.element = element
    let externalCleanup: unknown
    if (externalRef) {
      if (typeof externalRef === 'function') {
        externalCleanup = externalRef(element)
      } else {
        const mutableRef = externalRef as { current: MainThread.Element | null }
        mutableRef.current = element
      }
    }
    if (!element) return

    mainThread.current.ownedStyles = ownedStyles
    const motion = mainThread.current.controller
    element.setStyleProperties(
      motion ? motion.styles(ownedStyles) : initialStyles,
    )
    if (typeof externalCleanup === 'function') {
      const cleanup = externalCleanup as () => void
      return () => {
        'main thread'
        mainThread.current.element = null
        cleanup()
      }
    }
  }, [
    externalRef,
    initialStyles,
    mainThread,
    ownedStyles,
  ])
  const finish = (id: number) => {
    if (completion.current?.id === id) completion.current.complete()
  }
  const start = (
    target: PopoverMotionTarget,
    id: number,
    immediate: boolean,
    styles: MotionStyleOwners,
  ) => {
    'main thread'
    mainThread.current.request = id
    mainThread.current.ownedStyles = styles
    if (!mainThread.current.controller) {
      const motion = createPopoverMotion(initial, (value, to, options) => {
        'main thread'
        return animate(value, to, options)
      }, (value) => {
        'main thread'
        return createMotionValue(value)
      })
      mainThread.current.controller = motion
      for (const value of Object.values(motion.values)) {
        value.on('change', applyStyles)
      }
    }
    const motion = mainThread.current.controller
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
      if (mainThread.current.request === id) runOnBackground(finish)(id)
    }, immediate)
  }
  const stop = (id: number) => {
    'main thread'
    if (mainThread.current.request !== id) return
    mainThread.current.request = 0
    const motion = mainThread.current.controller
    if (motion) motion.cancel()
  }
  useEffect(() =>
    register(({ open, immediate, complete }) => {
      const id = ++sequence.current
      completion.current = { id, complete }
      runOnMainThread(start)(
        open ? latest.current.openMotion : latest.current.closeMotion,
        id,
        !!immediate,
        latest.current.ownedStyles,
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
interface MotionStyleOwners {
  opacity: boolean
  transform: boolean
}

interface MotionRuntime {
  element: MainThread.Element | null
  controller: PopoverMotionController | null
  request: number
  ownedStyles: MotionStyleOwners
}

export interface PopoverMotionController {
  values: Record<Property, MotionValue<number>>
  cancel: () => void
  styles: (
    owned?: MotionStyleOwners,
  ) => { transform?: string, opacity?: string }
  start: (
    target: PopoverMotionTarget,
    options: AnimationOptions,
    complete: () => void,
    immediate?: boolean,
  ) => void
}

// A controller exists only for the mounted content, on the main thread.
export function createPopoverMotion(
  initial: Record<Property, number>,
  animateValue: typeof animate,
  createValue: (initial: number) => MotionValue<number>,
): PopoverMotionController {
  'main thread'
  const values = {} as PopoverMotionController['values']
  for (const property of Object.keys(IDENTITY) as Property[]) {
    values[property] = createValue(initial[property])
  }
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
    styles: (owned) => {
      'main thread'
      return {
        ...((!owned || owned.opacity)
          && { opacity: `${values.opacity.get()}` }),
        ...((!owned || owned.transform) && {
          transform:
            `translate(${values.x.get()}px, ${values.y.get()}px) rotate(${values.rotate.get()}deg) scale(${values.scale.get()}) scaleX(${values.scaleX.get()}) scaleY(${values.scaleY.get()})`,
        }),
      }
    },
    start: (target, options, complete, immediate = false) => {
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
          immediate || (target.transition?.type === 'tween'
            && target.transition.duration === 0)
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
