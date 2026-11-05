// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { getEventDetail, log } from '@lynx-js/lynx-ui-common'
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
  getArrowDimensions,
  getTransformOrigin,
  resolveArrowSize,
} from './arrowGeometry'
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
import {
  PopoverAnimationContext,
  PopoverGeometryContext,
} from './motionContext'
import type { PopoverAnimationDriver } from './motionContext'
import type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverBackdropProps,
  PopoverContentProps,
  PopoverOverlayProps,
  PopoverPositionerProps,
  PopoverRootProps,
  PopoverTriggerProps,
} from './types'
import { PopoverContext, useElementInfoReducer } from './useElementInfoReducer'
import './style.css'

export const PopoverRoot = (
  props: PopoverRootProps,
) => {
  const {
    children,
    onClose,
    onOpen,
    show,
    onVisibleChange,
    defaultShow = false,
    forceMount = false,
    debugLog,
  } = props

  const [state, setPresenceState] = useState<PresenceState>(
    PresenceState.Initial,
  )
  const [hasAnchor, setHasAnchor] = useState<boolean>(false)
  const isControlled = show !== undefined
  const [uncontrolledShow, setUncontrolledShow] = useState<boolean>(defaultShow)
  const actualShow = isControlled ? show : uncontrolledShow

  const { sharedInfo, updateRects: dispatchRects } = useElementInfoReducer()
  const [animation, setAnimation] = useState<
    { driver: PopoverAnimationDriver } | null
  >(null)
  const [positioned, setPositioned] = useState(false)
  const registerAnimation = useCallback((driver: PopoverAnimationDriver) => {
    const registration = { driver }
    setAnimation(registration)
    return () => {
      setAnimation(current => current === registration ? null : current)
    }
  }, [])
  const latest = useRef({ show: actualShow, animation, onClose, onOpen })
  latest.current = { show: actualShow, animation, onClose, onOpen }
  const currentState = useRef(state)
  currentState.current = state
  const didAnimate = useRef(false)
  const pendingOpenCompletion = useRef(false)
  const closeNotified = useRef(false)
  const openNotified = useRef(false)
  const animated = !!animation

  const updateRects = useCallback(
    (action: Parameters<typeof dispatchRects>[0]) => {
      dispatchRects(action)
      if (action.type === 'updateArrowCoords') setPositioned(true)
    },
    [dispatchRects],
  )
  const updatePresence: typeof setPresenceState = useCallback(next => {
    const resolved = typeof next === 'function'
      ? next(currentState.current)
      : next
    // Motion, rather than the CSS fallback timer, completes this lifecycle.
    if (
      latest.current.animation
      && (resolved === PresenceState.Entered || resolved === PresenceState.Left)
    ) return
    if (resolved === PresenceState.Entering && !didAnimate.current) {
      setPositioned(false)
    }
    setPresenceState(resolved)
  }, [])
  const handleClose = useCallback(() => {
    if (closeNotified.current) return
    closeNotified.current = true
    openNotified.current = false
    latest.current.onClose?.()
  }, [])
  const handleOpen = useCallback(() => {
    openNotified.current = true
    latest.current.onOpen?.()
  }, [])
  const finishOpen = useCallback(() => {
    // Presence considers an interrupted exit to be the same open cycle, so it
    // will not repeat onOpen when the reversed animation finishes.
    if (openNotified.current) latest.current.onOpen?.()
    setPresenceState(PresenceState.Entered)
  }, [])

  useEffect(() => {
    if (actualShow) closeNotified.current = false
  }, [actualShow])

  const entering = actualShow && positioned
    && (state === PresenceState.DelayedEntering
      || (didAnimate.current
        && (state === PresenceState.Leaving
          || state === PresenceState.Entering)))
  const leaving = !actualShow && state === PresenceState.Leaving
  const animationPhase = entering ? 'open' : (leaving ? 'close' : null)

  useEffect(() => {
    const driver = latest.current.animation?.driver
    if (!driver || !animationPhase) return
    const opening = animationPhase === 'open'
    didAnimate.current = true
    pendingOpenCompletion.current = false
    let active = true
    const cleanup = driver({
      open: opening,
      complete: () => {
        if (!active || latest.current.show !== opening) return
        active = false
        if (opening && currentState.current !== PresenceState.DelayedEntering) {
          // Presence still has a delayed entry scheduled after a reversal.
          pendingOpenCompletion.current = true
        } else if (opening) {
          finishOpen()
        } else {
          setPresenceState(PresenceState.Left)
        }
      },
    })
    return () => {
      active = false
      pendingOpenCompletion.current = false
      cleanup?.()
    }
  }, [animationPhase, animated, finishOpen])

  useEffect(() => {
    if (
      state === PresenceState.DelayedEntering && actualShow
      && pendingOpenCompletion.current
    ) {
      pendingOpenCompletion.current = false
      finishOpen()
    } else if (state === PresenceState.Left && didAnimate.current) {
      didAnimate.current = false
      handleClose()
    } else if (
      !animated && didAnimate.current
      && (state === PresenceState.DelayedEntering
        || state === PresenceState.Leaving)
    ) {
      if (actualShow) finishOpen()
      else setPresenceState(PresenceState.Left)
    }
  }, [state, animated, actualShow, finishOpen, handleClose])
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
      setPresenceState: updatePresence,
      onOpen: handleOpen,
      onClose: handleClose,
      isControlled,
      onVisibleChange,
      debugLog,
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
      updatePresence,
      handleOpen,
      handleClose,
      isControlled,
      onVisibleChange,
      debugLog,
    ],
  )

  return (
    <PopoverContext.Provider
      value={contextValue}
    >
      <PopoverAnimationContext.Provider value={registerAnimation}>
        {children}
      </PopoverAnimationContext.Provider>
    </PopoverContext.Provider>
  )
}

export const PopoverPositioner = (props: PopoverPositionerProps) => {
  const {
    children,
    placement = 'top',
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
    debugLog,
  } = useContext(
    PopoverContext,
  )
  const { reference, floating, alternativeReference, maxContentSize } =
    sharedInfo
  const { offset: arrowOffset, size: arrowSize, dimensions } = sharedInfo.arrow
  const arrowDimensions = dimensions ?? { width: arrowSize, height: arrowSize }
  const transformOrigin = getTransformOrigin(placement, floating, {
    coords: sharedInfo.arrow.coords,
    dimensions: arrowDimensions,
  })
  const arrowMainAxisSize = arrowDimensions.height
  const platform = popoverPlatform(floating, reference, {
    x: 0,
    y: 0,
    ...getArrowDimensions(arrowDimensions, placement),
  }, alternativeReference)

  const middleware: Middleware[] = autoAdjust === 'shift'
    ? [
      offset({
        mainAxis: arrowMainAxisSize + placementOffset,
        crossAxis: crossAxisOffset,
      }),
      shift({ crossAxis: true }),
      arrow({ padding: arrowOffset }),
    ]
    : (autoAdjust === 'size'
      ? [
        offset({
          mainAxis: arrowMainAxisSize + placementOffset,
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
            offset: arrowMainAxisSize + placementOffset,
          }),
        }),
        arrow({ padding: arrowOffset }),
      ]
      : [
        offset({
          mainAxis: arrowMainAxisSize + placementOffset,
          crossAxis: crossAxisOffset,
        }),
        arrow({ padding: arrowOffset }),
      ])

  const handleDelayedEntering = () => {
    const computeFloatingParams = {
      placement,
      platform,
      elements: hasAnchor
        ? { floating, reference, alternativeReference }
        : { floating, reference },
      middleware,
      debugLog,
    }

    log(
      !!debugLog,
      '[lynx-ui-popover] Compute Floating Params:',
      computeFloatingParams,
    )

    computeFloating(computeFloatingParams)
      .then((floatingResult: ComputePositionReturn) => {
        log(
          !!debugLog,
          '[lynx-ui-popover] Compute Floating Result:',
          floatingResult,
        )
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
      debugLog={debugLog}
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
          {typeof children === 'function'
            ? status => (
              <PopoverGeometryContext.Provider value={transformOrigin}>
                {children(status)}
              </PopoverGeometryContext.Provider>
            )
            : (
              <PopoverGeometryContext.Provider value={transformOrigin}>
                {children}
              </PopoverGeometryContext.Provider>
            )}
        </PopoverOverlay>
      </PopoverPositionerContext.Provider>
    </Presence>
  )
}

export const PopoverTrigger = (props: PopoverTriggerProps) => {
  const { style, children, className, onClick, disabled, transition } = props
  const {
    updateRects,
    setUncontrolledShow,
    state,
    show,
    isControlled,
    onVisibleChange,
  } = useContext(
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
    if (isControlled) {
      onVisibleChange?.(!show)
    } else {
      setUncontrolledShow?.(prev => !prev)
    }
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

export const PopoverBackdrop = (props: PopoverBackdropProps) => {
  const { className, style, onClick, transition, ...restProps } = props
  const { state, setUncontrolledShow, isControlled, onVisibleChange } =
    useContext(PopoverContext)

  const resolveBusyState = (currentState: PresenceState) => {
    switch (currentState) {
      case PresenceState.Entering:
      case PresenceState.DelayedEntering:
      case PresenceState.Leaving:
        return true
      default:
        return false
    }
  }
  const busy = resolveBusyState(state)

  const handleTap = () => {
    if (isControlled) {
      onVisibleChange?.(false)
    } else {
      setUncontrolledShow?.(false)
    }
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
      className={`lynx-ui-popover__backdrop ${presenceClassName}`}
      style={style}
      onClick={handleTap}
      disabled={busy}
      {...restProps}
    />
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
  const { sharedInfo, updateRects, show } = useContext(PopoverContext)
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
  const wasVisible = useRef(false)
  if (
    state === PresenceState.DelayedEntering || state === PresenceState.Entered
    || state === PresenceState.Leaving
  ) {
    wasVisible.current = true
  } else if (state === PresenceState.Initial || state === PresenceState.Left) {
    wasVisible.current = false
  }
  const reopening = show && state === PresenceState.Entering
    && wasVisible.current

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
          visibility: reopening ? 'visible' : visibility,
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
    handleKFCancel,
    handleKFEnd,
    handleTransitionStart,
    handleTransitionCancel,
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
      bindanimationcancel={handleKFCancel}
      bindtransitionstart={handleTransitionStart}
      bindtransitioncancel={handleTransitionCancel}
      bindtransitionend={handleTransitionEnd}
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
  const dimensions = resolveArrowSize(size, custom)
  const { width, height } = dimensions
  const rectangular = custom && typeof size !== 'number'

  useEffect(() => {
    updateRects({
      type: 'updateArrowInfo',
      info: { offset, size: height, dimensions },
    })
    return () => {
      updateRects({
        type: 'updateArrowInfo',
        info: { offset: 0, size: 0, dimensions: { width: 0, height: 0 } },
      })
    }
  }, [updateRects, offset, width, height])

  const { x, y } = sharedInfo.arrow.coords
  const placement = useContext(PopoverPositionerContext).placement
  const side = getSide(placement)
  const positionedDimensions = getArrowDimensions(dimensions, placement)

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
        left: x == null ? '' : `${x}px`,
        top: y == null ? '' : `${y}px`,
        [oppositeSide]: `-${height}px`,
        position: 'absolute',
        transform: rectangular ? undefined : TRANSFORMS[effectiveSide],
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        ...(custom
          ? {
            width: `${positionedDimensions.width}px`,
            height: `${positionedDimensions.height}px`,
          }
          : {
            width: '0px',
            height: '0px',
            borderLeft: `${width / 2}px solid transparent`,
            borderRight: `${width / 2}px solid transparent`,
            borderBottom: `${height}px solid ${color}`,
          }),
        ...style,
      }}
    >
      {rectangular
        ? (
          <view
            className='lynx-ui-popover__arrow-content'
            overlap={false}
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: TRANSFORMS[effectiveSide],
            }}
          >
            {children}
          </view>
        )
        : children}
    </view>
  )
}
