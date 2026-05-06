// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:ignore catchmousemove catchmousedown catchmouseup

import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

import { SliderContext } from '../context'
import type {
  SliderRef,
  SliderRootProps,
  SliderUpdateValueOptions,
  SliderValueChangeSource,
} from '../types'
import { clamp01, getTouchX, getVisualRatio, snapToStep } from '../utils'

export const SliderRoot = memo(forwardRef(SliderRootImpl))

function SliderRootImpl(props: SliderRootProps, ref: ForwardedRef<SliderRef>) {
  const {
    value: controlledValue,
    defaultValue = 0,
    step,
    disabled = false,
    enableRTL = false,
    className,
    style,
    onDragging,
    onValueChange,
    onValueCommit,
    children,
  } = props

  // @ts-expect-error Known issue for types
  const isWebPlatform = useRef<boolean>(SystemInfo.platform === 'web')

  const isWebMouseDown = useRef<boolean>(false)

  const isControlled = controlledValue !== undefined

  const trackRef = useRef<NodesRef>(null)
  const indicatorRef = useRef<NodesRef>(null)
  const thumbRef = useRef<NodesRef>(null)

  const bgWidth = useRef<number>(0)
  const bgLeft = useRef<number>(0)
  const leftMeasured = useRef<boolean>(false)
  const isMeasuringBounds = useRef<boolean>(false)
  const pendingMoveX = useRef<number | null>(null)

  const isDragging = useRef<boolean>(false)
  const currentValue = useRef<number>(
    snapToStep(clamp01(isControlled ? controlledValue : defaultValue), step),
  )

  const applyNativeValue = (next: number): void => {
    indicatorRef.current
      ?.setNativeProps?.({
        width: `${next * 100}%`,
      })
      ?.exec?.()

    thumbRef.current
      ?.setNativeProps?.({
        left: `${getVisualRatio(next, enableRTL) * 100}%`,
      })
      ?.exec?.()
  }

  const syncCurrentValue = (next: number): boolean => {
    if (currentValue.current === next) return false
    currentValue.current = next
    applyNativeValue(next)
    return true
  }

  const updateValue = (
    value: number,
    options: SliderUpdateValueOptions = {},
  ): void => {
    const next = snapToStep(clamp01(value), step)
    const source: SliderValueChangeSource = options.source ?? 'external'

    if (isDragging.current && !options.force && source === 'external') {
      return
    }

    if (!syncCurrentValue(next)) return

    onValueChange?.(next, source)
  }

  useEffect(() => {
    if (!isControlled) return
    const next = snapToStep(clamp01(controlledValue), step)
    syncCurrentValue(next)
  }, [controlledValue, isControlled, step])

  const getValue = (): number => currentValue.current

  const applyMeasuredMoveX = (x: number): void => {
    const value = valueFromX(x)
    if (value === null) return

    setDragging(true, value)
    updateValue(value, { source: 'drag', force: true })
  }

  const updateBounds = (res: unknown): boolean => {
    const left = Number(
      (res as { left?: unknown } | null | undefined)?.left,
    )
    const width = Number(
      (res as { width?: unknown } | null | undefined)?.width,
    )

    if (Number.isFinite(left)) {
      bgLeft.current = left
    }

    if (Number.isFinite(width) && width > 0) {
      bgWidth.current = width
    }

    const ready = Number.isFinite(bgLeft.current) && bgWidth.current > 0
    leftMeasured.current = ready
    return ready
  }

  const flushPendingMoveX = (): void => {
    if (pendingMoveX.current === null || !leftMeasured.current) return
    const x = pendingMoveX.current
    pendingMoveX.current = null
    applyMeasuredMoveX(x)
  }

  const measureBounds = (): void => {
    if (isMeasuringBounds.current) return

    const trackNode = trackRef.current
    if (!trackNode?.invoke) return

    isMeasuringBounds.current = true

    trackNode
      .invoke({
        method: 'boundingClientRect',
        params: { relativeTo: 'screen' },
        success: (res: unknown) => {
          isMeasuringBounds.current = false
          updateBounds(res)
          flushPendingMoveX()
        },
        fail: () => {
          isMeasuringBounds.current = false
        },
      })
      ?.exec?.()
  }

  const setDragging = (nextDragging: boolean, value: number): void => {
    if (isDragging.current === nextDragging) return
    isDragging.current = nextDragging
    onDragging?.(value)
  }

  const valueFromX = (x: number): number | null => {
    const width = bgWidth.current
    if (!Number.isFinite(x) || width <= 0) return null
    const ratio = (x - bgLeft.current) / width
    return clamp01(enableRTL ? 1 - ratio : ratio)
  }

  const handleMoveX = (x: number): void => {
    if (disabled) return
    if (!Number.isFinite(x)) return

    if (!leftMeasured.current || bgWidth.current <= 0) {
      pendingMoveX.current = x
      measureBounds()
      return
    }

    applyMeasuredMoveX(x)
  }

  const handleInteractionStart = (x: number): void => {
    if (disabled) return
    if (!Number.isFinite(x)) return

    pendingMoveX.current = x
    leftMeasured.current = false
    measureBounds()
  }

  const handleEnd = (): void => {
    if (!isDragging.current) return

    const value = currentValue.current
    setDragging(false, value)
    onValueCommit?.(value)
  }

  const handleTrackLayoutChange = (event: {
    params: { width: number, height: number }
    detail?: { width: number, height: number }
  }): void => {
    const width = Number(event?.detail?.width ?? event?.params?.width)
    if (Number.isFinite(width) && width > 0) {
      bgWidth.current = width
      leftMeasured.current = false
      measureBounds()
      return
    }

    bgWidth.current = 0
    leftMeasured.current = false
  }

  const getMouseX = (event: unknown): number => {
    const xInTouches = (
      event as
        | { touches?: Array<{ clientX?: unknown }> }
        | null
        | undefined
    )?.touches?.[0]?.clientX

    const x = Number(
      (event as { clientX?: unknown } | null | undefined)?.clientX,
    )

    return xInTouches ? Number(xInTouches) : x
  }

  const handleMouseX = (event: unknown): void => {
    handleMoveX(getMouseX(event))
  }

  const handleMouseStart = (event: unknown): void => {
    handleInteractionStart(getMouseX(event))
  }

  const handleTouchStart = (event: unknown): void => {
    if (isWebPlatform.current) {
      handleMouseStart(event)
      return
    }

    handleInteractionStart(getTouchX(event))
  }

  useImperativeHandle(
    ref,
    () => ({
      updateValue: (value: number, options?: SliderUpdateValueOptions) => {
        if (isControlled) {
          throw new Error(
            'SliderRoot: updateValue() must not be called in controlled mode. Update the `value` prop instead.',
          )
        }
        updateValue(value, options)
      },
      getValue: () => {
        if (isControlled) {
          throw new Error(
            'SliderRoot: getValue() must not be called in controlled mode. Read the `value` prop instead.',
          )
        }
        return getValue()
      },
    }),
    [updateValue, getValue, isControlled],
  )

  const contextValue = {
    trackRef,
    indicatorRef,
    thumbRef,
    currentValue,
    enableRTL,
    onTrackLayoutChange: handleTrackLayoutChange,
  }

  return (
    <SliderContext.Provider value={contextValue}>
      <view
        className={className}
        flatten={false}
        style={style}
        // block-native-event={true}
        // native-interaction-enabled={true}
        consume-slide-event={[[-180, 180]]}
        catchmousemove={(event: unknown) => {
          if (isWebPlatform.current && !isWebMouseDown.current) return
          handleMouseX(event)
        }}
        catchmousedown={(event: unknown) => {
          isWebMouseDown.current = true
          handleMouseStart(event)
        }}
        catchmouseup={() => {
          isWebMouseDown.current = false
          handleEnd()
        }}
        global-bindmouseup={() => {
          isWebMouseDown.current = false
          handleEnd()
        }}
        catchtouchmove={(event: unknown) => {
          if (isWebPlatform.current) {
            handleMouseX(event)
          } else {
            handleMoveX(getTouchX(event))
          }
        }}
        catchtouchstart={(event: unknown) => {
          isWebMouseDown.current = true
          handleTouchStart(event)
        }}
        catchtouchend={() => {
          isWebMouseDown.current = false
          handleEnd()
        }}
        catchtouchcancel={() => {
          isWebMouseDown.current = false
          handleEnd()
        }}
      >
        {children}
      </view>
    </SliderContext.Provider>
  )
}
