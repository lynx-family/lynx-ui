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
  useState,
} from '@lynx-js/react'
import type {
  ForwardRefExoticComponent,
  ForwardedRef,
  MemoExoticComponent,
  ReactElement,
  RefAttributes,
} from '@lynx-js/react'

import { getRectByRef } from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import { SliderContext } from '../context'
import type {
  SliderRef,
  SliderRootProps,
  SliderThumbIndex,
  SliderUpdateValueOptions,
  SliderValue,
  SliderValueChangeSource,
} from '../types'
import {
  areSliderValuesEqual,
  clamp01,
  cloneSliderValue,
  getInitialSliderThumbIndex,
  getSliderIndicatorGeometry,
  getSliderThumbValue,
  getTouchX,
  getVisualRatio,
  isSliderValueCollapsed,
  normalizeSliderValue,
  resolveSliderDrag,
} from '../utils'

type InternalSliderRootProps = SliderRootProps<SliderValue>
type InternalSliderRef = SliderRef<SliderValue>

type SliderRootCallProps<Value extends SliderValue> =
  & SliderRootProps<Value>
  & {
    ref?: ForwardedRef<SliderRef<Value>>
  }

type SliderRootComponent = <Value extends SliderValue = number>(
  props: SliderRootCallProps<Value>,
) => ReactElement

interface SliderInteractionState {
  pointerActive: boolean
  dragging: boolean
  pendingThumbIndex: SliderThumbIndex | null
  activeThumbIndex: SliderThumbIndex | null
  lastActiveThumbIndex: SliderThumbIndex | null
  startedCollapsed: boolean
}

interface RenderedSliderInteractionState {
  active: boolean
  activeThumbIndex: SliderThumbIndex | null
}

type SliderRootRuntimeComponent = MemoExoticComponent<
  ForwardRefExoticComponent<
    InternalSliderRootProps & RefAttributes<InternalSliderRef>
  >
>

const MemoizedSliderRoot: SliderRootRuntimeComponent = memo(
  forwardRef(SliderRootImpl),
)

type SliderRootStatics = Pick<
  typeof MemoizedSliderRoot,
  keyof typeof MemoizedSliderRoot
>

export const SliderRoot = MemoizedSliderRoot as
  & SliderRootComponent
  & SliderRootStatics

function SliderRootImpl(
  props: InternalSliderRootProps,
  ref: ForwardedRef<InternalSliderRef>,
) {
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
  const previousEnableRTL = useRef(enableRTL)
  const [renderedInteraction, setRenderedInteraction] = useState<
    RenderedSliderInteractionState
  >({ active: false, activeThumbIndex: null })
  const active = renderedInteraction.active && !disabled

  const trackRef = useRef<NodesRef>(null)
  const indicatorRef = useRef<NodesRef>(null)
  const thumbRefs = [
    useRef<NodesRef>(null),
    useRef<NodesRef>(null),
  ] as const

  const bgWidth = useRef<number>(0)
  const bgLeft = useRef<number>(0)
  const leftMeasured = useRef<boolean>(false)
  const isMeasuringBounds = useRef<boolean>(false)
  const pendingMoveX = useRef<number | null>(null)
  const pendingEnd = useRef<boolean>(false)
  const interaction = useRef<SliderInteractionState>({
    pointerActive: false,
    dragging: false,
    pendingThumbIndex: null,
    activeThumbIndex: null,
    lastActiveThumbIndex: null,
    startedCollapsed: false,
  })
  const currentValue = useRef<SliderValue>(
    normalizeSliderValue(
      isControlled ? controlledValue : defaultValue,
      step,
    ),
  )

  const applyNativeValue = (next: SliderValue): void => {
    const { offset, size } = getSliderIndicatorGeometry(next)
    const indicatorOffset = `${offset * 100}%`

    indicatorRef.current
      ?.setNativeProps?.({
        width: `${size * 100}%`,
        ...(enableRTL
          ? { right: indicatorOffset }
          : { left: indicatorOffset }),
      })
      ?.exec?.()

    const lowerValue = getSliderThumbValue(next, 0)
    thumbRefs[0].current
      ?.setNativeProps?.({
        left: `${getVisualRatio(lowerValue, enableRTL) * 100}%`,
      })
      ?.exec?.()

    const upperValue = getSliderThumbValue(next, 1)
    thumbRefs[1].current
      ?.setNativeProps?.({
        left: `${getVisualRatio(upperValue, enableRTL) * 100}%`,
      })
      ?.exec?.()
  }

  const syncCurrentValue = (next: SliderValue): boolean => {
    if (areSliderValuesEqual(currentValue.current, next)) return false
    currentValue.current = next
    applyNativeValue(next)
    return true
  }

  const updateValue = (
    value: SliderValue,
    options: SliderUpdateValueOptions = {},
  ): void => {
    const next = normalizeSliderValue(value, step)
    const source: SliderValueChangeSource = options.source ?? 'external'

    if (
      interaction.current.dragging && !options.force && source === 'external'
    ) {
      return
    }

    if (!syncCurrentValue(next)) return

    onValueChange?.(cloneSliderValue(next), source)
  }

  useEffect(() => {
    const directionChanged = previousEnableRTL.current !== enableRTL
    previousEnableRTL.current = enableRTL

    if (!isControlled) {
      if (directionChanged) applyNativeValue(currentValue.current)
      return
    }

    if (controlledValue === undefined) return

    const next = normalizeSliderValue(controlledValue, step)
    if (!syncCurrentValue(next) && directionChanged) {
      applyNativeValue(next)
    }
  }, [controlledValue, enableRTL, isControlled, step])

  const getValue = (): SliderValue => cloneSliderValue(currentValue.current)

  const resolveNextDrag = (value: number) => {
    const interactionState = interaction.current
    const resolution = resolveSliderDrag(
      currentValue.current,
      value,
      {
        activeThumbIndex: interactionState.activeThumbIndex ?? undefined,
        preferredThumbIndex: interactionState.lastActiveThumbIndex ?? undefined,
        startedCollapsed: interactionState.startedCollapsed,
        step,
      },
    )

    const previousIndex = interactionState.activeThumbIndex
    interactionState.activeThumbIndex = resolution.activeThumbIndex
    interactionState.lastActiveThumbIndex = resolution.activeThumbIndex
    interactionState.startedCollapsed = resolution.startedCollapsed
    if (previousIndex !== resolution.activeThumbIndex) {
      setRenderedInteraction({
        active: true,
        activeThumbIndex: resolution.activeThumbIndex,
      })
    }

    return resolution
  }

  const applyMeasuredMoveX = (x: number): void => {
    const value = valueFromX(x)
    if (value === null) return

    const resolution = resolveNextDrag(value)
    const next = resolution.value
    setDragging(true, resolution.dragStartValue)
    updateValue(next, { source: 'drag', force: true })
  }

  const updateBounds = (res: unknown): boolean => {
    const rect = res as
      | {
        left?: unknown
        width?: unknown
      }
      | null
      | undefined
    const left = typeof rect?.left === 'number' ? rect.left : Number.NaN
    const width = typeof rect?.width === 'number' ? rect.width : Number.NaN

    if (!Number.isFinite(left) || !Number.isFinite(width) || width <= 0) {
      bgWidth.current = 0
      leftMeasured.current = false
      return false
    }

    bgLeft.current = left
    bgWidth.current = width
    leftMeasured.current = true
    return true
  }

  const resetInteraction = (): void => {
    const interactionState = interaction.current
    interactionState.pointerActive = false
    interactionState.pendingThumbIndex = null
    interactionState.activeThumbIndex = null
    interactionState.startedCollapsed = false
    pendingEnd.current = false
    pendingMoveX.current = null
    setRenderedInteraction((previous) =>
      previous.active || previous.activeThumbIndex !== null
        ? { active: false, activeThumbIndex: null }
        : previous
    )
  }

  const finishInteraction = (): void => {
    resetInteraction()

    if (!interaction.current.dragging) return

    const value = currentValue.current
    setDragging(false, value)
    onValueCommit?.(cloneSliderValue(value))
  }

  const flushPendingMoveX = (): void => {
    if (pendingMoveX.current === null || !leftMeasured.current) return
    const x = pendingMoveX.current
    const shouldFinish = pendingEnd.current
    pendingMoveX.current = null
    applyMeasuredMoveX(x)
    if (shouldFinish) finishInteraction()
  }

  const measureBounds = (): void => {
    if (isMeasuringBounds.current) return

    if (!trackRef.current) return

    isMeasuringBounds.current = true

    getRectByRef(trackRef)
      .then((res) => {
        isMeasuringBounds.current = false
        if (updateBounds(res)) {
          flushPendingMoveX()
        } else if (pendingEnd.current) {
          finishInteraction()
        }
      })
      .catch(() => {
        isMeasuringBounds.current = false
        if (pendingEnd.current) finishInteraction()
      })
  }

  const setDragging = (
    nextDragging: boolean,
    value: SliderValue,
  ): void => {
    if (interaction.current.dragging === nextDragging) return
    interaction.current.dragging = nextDragging
    onDragging?.(cloneSliderValue(value))
  }

  const valueFromX = (x: number): number | null => {
    const width = bgWidth.current
    if (!Number.isFinite(x) || width <= 0) return null
    const ratio = (x - bgLeft.current) / width
    return clamp01(enableRTL ? 1 - ratio : ratio)
  }

  const handleMoveX = (x: number): void => {
    if (disabled || !interaction.current.pointerActive) return
    if (!Number.isFinite(x)) return

    if (!leftMeasured.current || bgWidth.current <= 0) {
      pendingMoveX.current = x
      measureBounds()
      return
    }

    applyMeasuredMoveX(x)
  }

  const handleInteractionStart = (x: number): void => {
    const interactionState = interaction.current
    const requestedThumbIndex = interactionState.pendingThumbIndex
    interactionState.pendingThumbIndex = null

    if (disabled || !Number.isFinite(x)) {
      resetInteraction()
      return
    }

    const initialThumbIndex = getInitialSliderThumbIndex(
      currentValue.current,
      requestedThumbIndex,
    )
    interactionState.pointerActive = true
    interactionState.activeThumbIndex = initialThumbIndex
    interactionState.startedCollapsed = isSliderValueCollapsed(
      currentValue.current,
    )
    pendingEnd.current = false
    setRenderedInteraction({
      active: true,
      activeThumbIndex: initialThumbIndex,
    })
    pendingMoveX.current = x
    leftMeasured.current = false
    measureBounds()
  }

  const handleEnd = (): void => {
    interaction.current.pointerActive = false
    if (
      pendingMoveX.current !== null
      && !leftMeasured.current
      && isMeasuringBounds.current
    ) {
      pendingEnd.current = true
      return
    }

    finishInteraction()
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
    const xInTouches = Number(
      (
        event as
          | { touches?: Array<{ clientX?: unknown }> }
          | null
          | undefined
      )?.touches?.[0]?.clientX,
    )

    const x = Number(
      (event as { clientX?: unknown } | null | undefined)?.clientX,
    )

    return Number.isFinite(xInTouches) ? xInTouches : x
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

  const handleThumbInteractionStart = (index: SliderThumbIndex): void => {
    interaction.current.pendingThumbIndex = index
  }

  useImperativeHandle(
    ref,
    () => ({
      updateValue: (
        value: SliderValue,
        options?: SliderUpdateValueOptions,
      ) => {
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
    thumbRefs,
    currentValue,
    active,
    activeThumbIndex: renderedInteraction.activeThumbIndex,
    disabled,
    enableRTL,
    onThumbInteractionStart: handleThumbInteractionStart,
    onTrackLayoutChange: handleTrackLayoutChange,
  }

  return (
    <SliderContext.Provider value={contextValue}>
      <view
        className={clsx(className, {
          'ui-active': active,
          'ui-disabled': disabled,
        })}
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
