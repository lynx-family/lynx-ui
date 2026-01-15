// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { getEventDetail } from '@lynx-js/lynx-ui-common'
import { OverlayView } from '@lynx-js/lynx-ui-overlay'
import {
  Presence,
  PresenceContext,
  PresenceState,
  presenceClassVariants,
  renderPresenceChildren,
  resolveAnimationStatus,
  useVisibilityFromPresence,
} from '@lynx-js/lynx-ui-presence'
import type { CSSProperties, LayoutChangeEvent } from '@lynx-js/types'
import { clsx } from 'clsx'

import {
  arrow,
  computeFloating,
  getSide,
  offset,
  popoverPlatform,
} from './floating'
import type { ComputePositionReturn, Middleware, Placement } from './floating'
import { limitShift, shift } from './floating/shift'
import { size } from './floating/size'
import type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverContentProps,
  PopoverOverlayProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTriggerProps,
} from './types'
import { PopoverContext, useElementInfoReducer } from './useElementInfoReducer'

export const PopoverRoot = (props: PopoverRootProps) => {
  const {
    children,
    onClose,
    onOpen,
    show,
    defaultShow = false,
    forceMount = false,
  } = props

  const [state, setPresenceState] = useState<PresenceState>(
    PresenceState.Initial,
  )
  const [hasAnchor, setHasAnchor] = useState<boolean>(false)
  const isControlled = show !== undefined
  const [uncontrolledShow, setUncontrolledShow] = useState<boolean>(defaultShow)
  const actualShow = isControlled ? show : uncontrolledShow

  const { sharedInfo, updateRects } = useElementInfoReducer()
  const contextValue = useMemo(
    () => ({
      sharedInfo,
      updateRects,
      forceMount,
      show: actualShow,
      setUncontrolledShow,
      hasAnchor,
      setHasAnchor,
      state,
      setPresenceState,
      onOpen,
      onClose,
    }),
    [
      sharedInfo,
      updateRects,
      actualShow,
      forceMount,
      hasAnchor,
      setHasAnchor,
      setUncontrolledShow,
      state,
      setPresenceState,
      onOpen,
      onClose,
    ],
  )

  return (
    <PopoverContext.Provider
      value={contextValue}
    >
      {children}
    </PopoverContext.Provider>
  )
}

export const PopoverPositioner = (props: PopoverPositionerProps) => {
  const {
    children,
    placement,
    style,
    className,
    placementOffset = 0,
    autoAdjust,
    crossAxisOffset = 0,
    transition,
    popoverPositionerProps,
  } = props
  const {
    show,
    sharedInfo,
    updateRects,
    hasAnchor,
    state,
    setPresenceState,
    onClose,
    onOpen,
  } = useContext(
    PopoverContext,
  )
  const { reference, floating, alternativeReference, maxContentSize } =
    sharedInfo
  const { offset: arrowOffset, size: arrowSize } = sharedInfo.arrow
  const platform = popoverPlatform(floating, reference, {
    x: 0,
    y: 0,
    width: arrowSize,
    height: arrowSize,
  }, alternativeReference)

  const middleware: Middleware[] = autoAdjust === 'shift'
    ? [
      offset({
        mainAxis: arrowSize + placementOffset,
        crossAxis: crossAxisOffset,
      }),
      shift({ crossAxis: true }),
      arrow({ padding: arrowOffset }),
    ]
    : (autoAdjust === 'size'
      ? [
        offset({
          mainAxis: arrowSize + placementOffset,
          crossAxis: crossAxisOffset,
        }),
        size({
          apply(
            { availableHeight, availableWidth }: {
              availableHeight: number
              availableWidth: number
            },
          ) {
            updateRects({
              type: 'updateMaxContentSize',
              dimension: { width: availableWidth, height: availableHeight },
            })
          },
        }),
        shift({
          crossAxis: true,
          limiter: limitShift({
            crossAxis: true,
            mainAxis: true,
            offset: arrowSize + placementOffset,
          }),
        }),
        arrow({ padding: arrowOffset }),
      ]
      : [
        offset({
          mainAxis: arrowSize + placementOffset,
          crossAxis: crossAxisOffset,
        }),
        arrow({ padding: arrowOffset }),
      ])

  const handleDelayedEntering = () => {
    computeFloating({
      placement,
      platform,
      elements: hasAnchor
        ? { floating, reference, alternativeReference }
        : { floating, reference },
      middleware,
    })
      .then((floatingResult: ComputePositionReturn) => {
        const { x, y, middlewareData } = floatingResult
        const arrowData = middlewareData.arrow as
          | { x: number, y: number }
          | undefined
        const { x: arrowX = null, y: arrowY = null } = arrowData ?? {}
        updateRects({ type: 'updateFloatingCoords', coords: { x, y } })
        updateRects({
          type: 'updateArrowCoords',
          coords: { x: arrowX, y: arrowY },
        })
      })
  }

  useEffect(() => {
    if (state === PresenceState.DelayedEntering) {
      handleDelayedEntering()
    }
  }, [state])

  return (
    <Presence
      show={show}
      state={state}
      setPresenceState={setPresenceState}
      enableDelay={true}
      onClose={onClose}
      onOpen={onOpen}
    >
      <PopoverPositionerContext.Provider
        value={{ placement }}
      >
        <PopoverOverlay
          placement={placement}
          style={{
            ...style,
            ...(maxContentSize
              && {
                maxWidth: maxContentSize.maxWidth,
                maxHeight: maxContentSize.maxHeight,
              }),
          }}
          className={className}
          placementOffset={placementOffset}
          transition={transition}
          popoverOverlayProps={popoverPositionerProps}
        >
          {children}
        </PopoverOverlay>
      </PopoverPositionerContext.Provider>
    </Presence>
  )
}

export const PopoverTrigger = (props: PopoverTriggerProps) => {
  const { style, children, className, onClick, disabled, transition } = props
  const { updateRects, setUncontrolledShow, state } = useContext(
    PopoverContext,
  )

  const resolveBusyState = (state: PresenceState) => {
    switch (state) {
      case PresenceState.Entering:
      case PresenceState.DelayedEntering:
      case PresenceState.Leaving:
        return true
      default:
        return false
    }
  }

  const busy = resolveBusyState(state)
  const actualDisabled = busy || disabled

  const handleLayoutChange = (e: LayoutChangeEvent) => {
    const { width = 0, height = 0, left: x = 0, top: y = 0 } = getEventDetail(e)
    updateRects({
      type: 'updateReference',
      rect: { width, height, x, y },
    })
  }

  const handleTriggered = () => {
    setUncontrolledShow?.(prev => !prev)
    onClick?.()
  }

  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })

  return (
    <Button
      buttonProps={{ 'bindlayoutchange': handleLayoutChange }}
      style={style}
      className={clsx(presenceClassName, {
        'ui-busy': busy,
      })}
      onClick={handleTriggered}
      disabled={actualDisabled}
    >
      {children}
    </Button>
  )
}

export const PopoverAnchor = (props: PopoverAnchorProps) => {
  const { children, style, className, transition } = props
  const { setHasAnchor, updateRects, state } = useContext(
    PopoverContext,
  )

  useEffect(() => {
    setHasAnchor?.(true)
  }, [])

  const handleLayoutChange = (e: LayoutChangeEvent) => {
    const { width = 0, height = 0, left: x = 0, top: y = 0 } = getEventDetail(e)
    updateRects({
      type: 'updateAlternativeReference',
      rect: { width, height, x, y },
    })
  }
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })

  return (
    <view
      style={style}
      className={presenceClassName}
      bindlayoutchange={handleLayoutChange}
    >
      {children}
    </view>
  )
}

const PopoverOverlay = (props: PopoverOverlayProps) => {
  const {
    className,
    style,
    children,
    container,
    transition,
    popoverOverlayProps,
  } = props
  const { controllers } = useContext(PresenceContext)
  const { state } = controllers
  const { sharedInfo, updateRects } = useContext(PopoverContext)
  const { floatingCoords } = sharedInfo
  const { x, y } = floatingCoords

  const handleLayoutChange = (e: LayoutChangeEvent) => {
    const { width = 0, height = 0, left = 0, top = 0 } = getEventDetail(e)
    updateRects({
      type: 'updateFloating',
      rect: {
        width,
        height,
        x: left,
        y: top,
      },
    })
  }

  const status = resolveAnimationStatus({ state, enableDelay: true })
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })

  const visibility = useVisibilityFromPresence(state)

  return (
    <OverlayView
      container={container}
      style={{ left: `${x}px`, top: `${y}px`, position: 'absolute' }}
      overlayViewProps={popoverOverlayProps}
    >
      <view
        bindlayoutchange={handleLayoutChange}
        className={presenceClassName}
        style={{
          ...style,
          visibility: visibility,
        }}
      >
        {renderPresenceChildren({ children, status })}
      </view>
    </OverlayView>
  )
}

export const PopoverContent = (props: PopoverContentProps) => {
  const { children, style, className, transition, popoverContentProps } = props
  const { animationHandlers, controllers } = useContext(PresenceContext)
  const state = controllers.state
  const { sharedInfo } = useContext(PopoverContext)
  const { maxContentSize } = sharedInfo
  const {
    handleKFStart,
    handleKFEnd,
    handleTransitionStart,
    handleTransitionEnd,
  } = animationHandlers

  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })

  return (
    <view
      bindanimationstart={handleKFStart}
      bindanimationend={handleKFEnd}
      bindtransitionstart={handleTransitionStart}
      bindtransitionend={handleTransitionEnd}
      bindanimationcancel={handleKFEnd}
      event-through={false}
      // turn off Android offscreen drawing so the animation with opacity can work properly
      overlap={false}
      // Only show the toast when it's animating or showing
      style={{
        ...style,
        ...(maxContentSize
          && {
            maxWidth: maxContentSize.maxWidth,
            maxHeight: maxContentSize.maxHeight,
          }),
      }}
      className={presenceClassName}
      {...popoverContentProps}
    >
      {children}
    </view>
  )
}

const PopoverPositionerContext = createContext<{
  placement: Placement
}>({
  placement: 'top',
})

export const PopoverArrow = (props: PopoverArrowProps) => {
  const {
    offset = 0,
    size,
    color = 'black',
    className,
    style,
    transition,
    children,
  } = props
  const custom = children != null

  const { sharedInfo, updateRects, state } = useContext(
    PopoverContext,
  )
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })
  // Normalize arrow size: if `size` is a number, use it directly;
  // if it's an object `{ width, height }`, use the larger one or the content may be clipped.
  const arrowSize = typeof size === 'number'
    ? size
    : Math.max(0, Number(size?.width ?? 0), Number(size?.height ?? 0))

  useEffect(() => {
    updateRects({ type: 'updateArrowInfo', info: { offset, size: arrowSize } })
  }, [])

  const { x, y } = sharedInfo.arrow.coords
  const side = getSide(useContext(PopoverPositionerContext).placement)

  const TRANSFORMS: Record<string, CSSProperties['transform']> = {
    top: `rotate(180deg) ${custom ? '' : 'translateX(50%)'}`,
    bottom: '',
    left: 'rotate(90deg)',
    right: 'rotate(270deg)',
  }

  const oppositeSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[side]

  const effectiveSide = custom ? oppositeSide : side

  return (
    <view
      className={presenceClassName}
      style={{
        width: '0px',
        height: '0px',
        left: x == null ? '' : `${x}px`,
        top: y == null ? '' : `${y}px`,
        [oppositeSide]: `-${arrowSize}px`,
        position: 'absolute',
        transform: TRANSFORMS[effectiveSide],
        borderLeft: `${arrowSize / 2}px solid transparent`,
        borderRight: `${arrowSize / 2}px solid transparent`,
        borderBottom: `${arrowSize}px solid ${color}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...(custom
          ? {
            border: 'none',
            width: `${arrowSize}px`,
            height: `${arrowSize}px`,
          }
          : {}),
        ...style,
      }}
    >
      {children}
    </view>
  )
}
