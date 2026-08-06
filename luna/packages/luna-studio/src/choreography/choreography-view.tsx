// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { inferThemeMode } from '@lynx-js/luna-core'
import { useEventCallback } from '@lynx-js/luna-stage'
import {
  MotionPresentation,
  MotionStage,
  MotionStageContainer,
} from '@lynx-js/luna-stage/motion'
import { AnimatePresence } from 'motion/react'
import type { SpringOptions, Transition } from 'motion/react'
import type {
  CSSProperties,
  JSX,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import { useMemo, useState } from 'react'

import { StudioLynxStage } from '../lynx-stage'
import type {
  ChoreographyViewProps,
  InteractionParams,
  LynxRuntimeCall,
  StudioResolvedStage,
} from '../types'
import { getStageWorldState, isForegroundStage } from '../utils/world'

type RenderData = StudioResolvedStage & {
  world: { x: number, y: number, z: number }
  zIndex: number
  maskOpacity: number
  // Pre-resolved props for StudioLynxStage. Optional so that omitting them
  // matches `exactOptionalPropertyTypes` semantics on the consuming side.
  resolvedBundleRoot?: string
  extraGlobalProps?: Record<string, unknown>
}

type FocusableStudioStage = StudioResolvedStage & {
  focusKey: string
}

const slidingVariants = {
  initial: { opacity: 0, x: -300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 },
}

const presentationTransition: Transition = {
  type: 'spring',
  visualDuration: 0.3,
  bounce: 0.3,
}

const fitTransition: SpringOptions = { visualDuration: 0.8, bounce: 0.1 }

const BASE_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  position: 'relative',
}

const DEFAULT_STAGE_APPEARANCE_BY_MODE = {
  light: {
    outlineColor: 'rgb(0 0 0 / 0.04)',
    maskColor: '#f5f5f5',
  },
  dark: {
    outlineColor: 'rgb(255 255 255 / 0.10)',
    maskColor: '#00000080',
  },
} as const

function hasFocusKey(
  stage: StudioResolvedStage,
): stage is FocusableStudioStage {
  return stage.focusKey !== undefined
}

function createStageInteraction(
  stage: StudioResolvedStage,
  containerEvent: MouseEvent | PointerEvent,
): InteractionParams {
  return {
    target: 'stage',
    stageId: stage.id,
    entry: stage.entry,
    containerEvent,
  }
}

function createContentInteraction(
  stage: StudioResolvedStage,
  call: LynxRuntimeCall,
): InteractionParams {
  return {
    target: 'content',
    stageId: stage.id,
    entry: stage.entry,
    runtimeCall: call,
    ...(call.data === undefined ? {} : { payload: call.data }),
  }
}

/**
 * Internal choreography renderer that resolves layout, focus state, interaction
 * normalization, and Lynx-stage wiring for the active presentation mode.
 */
function ChoreographyView({
  layout,
  modeGrid,
  mode = 'compare',
  defaultFocusKey,
  className,
  style,
  bundleRoot,
  resolveFocusKey,
  buildStageGlobalProps,
  themeKey,
  stageAppearance,
  interactionTarget = 'content',
  onLynxRuntimeCall,
  onInteraction,
}: ChoreographyViewProps): JSX.Element {
  const [activeFocusKey, setActiveFocusKey] = useState<string | undefined>(
    defaultFocusKey,
  )
  const containerInteractive = interactionTarget === 'stage'
  const contentInteractive = interactionTarget === 'content'
  const containerGrid = modeGrid?.[mode]

  // Stable proxies that always invoke the latest props. Safe to call from
  // event handlers.
  const resolveFocusKeyEvent = useEventCallback(resolveFocusKey)
  const onInteractionEvent = useEventCallback(onInteraction)
  const onLynxRuntimeCallEvent = useEventCallback(onLynxRuntimeCall)

  const dispatchInteractionEvent = useEventCallback((
    interaction: InteractionParams,
  ): void => {
    const nextActiveFocusKey = resolveFocusKeyEvent(interaction)
    if (nextActiveFocusKey !== undefined) {
      setActiveFocusKey(nextActiveFocusKey)
    }
    onInteractionEvent(interaction)
  })

  const stageContainerEventHandlers = useMemo(() => {
    const handlers = new Map<
      string,
      {
        onClick: (e: ReactMouseEvent | ReactPointerEvent) => void
        onPointerCancel: (e: ReactMouseEvent | ReactPointerEvent) => void
        onPointerDown: (e: ReactMouseEvent | ReactPointerEvent) => void
        onPointerUp: (e: ReactMouseEvent | ReactPointerEvent) => void
      }
    >()

    for (const stage of layout[mode]) {
      const dispatch = (e: ReactMouseEvent | ReactPointerEvent) => {
        dispatchInteractionEvent(createStageInteraction(stage, e.nativeEvent))
      }
      handlers.set(stage.id, {
        onClick: dispatch,
        onPointerCancel: dispatch,
        onPointerDown: dispatch,
        onPointerUp: dispatch,
      })
    }
    return handlers
  }, [dispatchInteractionEvent, layout, mode])

  const stageRuntimeCallHandlers = useMemo(() => {
    const handlers = new Map<string, (call: LynxRuntimeCall) => unknown>()

    for (const stage of layout[mode]) {
      handlers.set(stage.id, (call: LynxRuntimeCall) => {
        dispatchInteractionEvent(createContentInteraction(stage, call))
        return onLynxRuntimeCallEvent(call)
      })
    }
    return handlers
  }, [dispatchInteractionEvent, layout, mode, onLynxRuntimeCallEvent])

  const resolvedActiveFocusKey = useMemo(() => {
    const focusableStages = layout[mode].filter(stage => hasFocusKey(stage))

    if (
      activeFocusKey !== undefined
      && focusableStages.some(stage => stage.focusKey === activeFocusKey)
    ) {
      return activeFocusKey
    }

    return focusableStages[0]?.focusKey ?? ''
  }, [activeFocusKey, layout, mode])

  const rendered: RenderData[] = useMemo(() => {
    const stages = layout[mode]

    // Only stages with a focus key participate in focus selection and the
    // surrounding 3D fan. Stages without one remain persistent foreground
    // content, such as controls shared by every focused stage.
    const focusableStages = stages.filter(stage => hasFocusKey(stage))

    // The active focus stage escapes the fan, so only the remaining focusable
    // stages contribute to its ordering and midpoint.
    const focusableBackgroundStages = focusableStages.filter(
      stage => stage.focusKey !== resolvedActiveFocusKey,
    )

    const backgroundMidpoint = (focusableBackgroundStages.length - 1) / 2
    const activeFocusIndex = Math.max(
      0,
      focusableStages.findIndex(
        stage => stage.focusKey === resolvedActiveFocusKey,
      ),
    )

    return stages.map((stage) => {
      // Foreground stages intentionally resolve to -1 here. Their world state
      // ignores the background index while `escape` is true.
      const backgroundIndex = focusableBackgroundStages.findIndex(
        backgroundStage => backgroundStage.id === stage.id,
      )

      // Both persistent non-focusable content and the active focus stage stay
      // centered, elevated, and unmasked.
      const escape = isForegroundStage(
        stage.focusKey,
        resolvedActiveFocusKey,
      )
      const { world, zIndex, maskOpacity } = getStageWorldState({
        mode,
        backgroundIndex,
        backgroundMidpoint,
        activeFocusIndex,
        escape,
      })

      const resolvedBundleRoot = stage.bundleRoot ?? bundleRoot
      const extraGlobalProps = buildStageGlobalProps?.({
        stage,
        viewMode: mode,
        activeFocusKey: resolvedActiveFocusKey,
        focusKey: stage.focusKey,
      })

      return {
        ...stage,
        world,
        zIndex,
        maskOpacity,
        ...(resolvedBundleRoot === undefined ? {} : { resolvedBundleRoot }),
        ...(extraGlobalProps === undefined ? {} : { extraGlobalProps }),
      }
    })
  }, [bundleRoot, buildStageGlobalProps, layout, mode, resolvedActiveFocusKey])

  const mergedContainerStyle: CSSProperties = useMemo(() => {
    const gridStyle: CSSProperties | undefined = containerGrid && {
      display: 'grid',
      gridTemplateColumns: `repeat(${containerGrid.cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${containerGrid.rows}, minmax(0, 1fr))`,
      alignItems: 'stretch',
    }
    return {
      ...BASE_STYLE,
      ...gridStyle,
      ...style,
    }
  }, [containerGrid, style])

  const resolvedThemeKey = themeKey ?? 'lunaris-dark'
  const resolvedThemeMode = inferThemeMode(resolvedThemeKey) ?? 'dark'

  const resolvedStageAppearance = useMemo(() => {
    const fallback = DEFAULT_STAGE_APPEARANCE_BY_MODE[resolvedThemeMode]
    const fromDefault = stageAppearance?.default
    const fromMode = stageAppearance?.[resolvedThemeMode]

    return {
      outlineColor: fromMode?.outlineColor ?? fromDefault?.outlineColor
        ?? fallback.outlineColor,
      maskColor: fromMode?.maskColor ?? fromDefault?.maskColor
        ?? fallback.maskColor,
    } as const
  }, [resolvedThemeMode, stageAppearance])

  const stageOutlineStyle: CSSProperties = useMemo(
    () => ({
      backgroundColor: resolvedStageAppearance.outlineColor,
    }),
    [resolvedStageAppearance.outlineColor],
  )

  const maskColor = resolvedStageAppearance.maskColor

  return (
    <div className={className} style={mergedContainerStyle}>
      <AnimatePresence mode='popLayout'>
        {rendered.map((stage) => {
          const stageRuntimeCallHandler = stageRuntimeCallHandlers.get(stage.id)

          return (
            <MotionStageContainer
              layoutId={stage.id}
              key={stage.id}
              className={stage.className}
              {...(containerInteractive
                ? stageContainerEventHandlers.get(stage.id)
                : undefined)}
              style={{
                ...stage.style,
                zIndex: stage.zIndex,
                pointerEvents: containerInteractive ? 'auto' : 'none',
              }}
            >
              <MotionPresentation
                variants={slidingVariants}
                initial='initial'
                animate='animate'
                exit='exit'
                transition={presentationTransition}
              >
                <MotionStage
                  fitProgress={0}
                  fitTransition={fitTransition}
                  world={stage.world}
                  focalLength={mode === 'focus' ? 500 : 0}
                  style={stageOutlineStyle}
                  contentInteractive={contentInteractive}
                  maskColor={maskColor}
                  maskOpacity={stage.maskOpacity}
                >
                  <StudioLynxStage
                    entry={stage.entry}
                    lunaTheme={mode === 'compare'
                      ? stage.theme
                      : resolvedThemeKey}
                    {...(stageRuntimeCallHandler === undefined
                      ? {}
                      : { onLynxRuntimeCall: stageRuntimeCallHandler })}
                    {...(stage.resolvedBundleRoot === undefined
                      ? {}
                      : { bundleRoot: stage.resolvedBundleRoot })}
                    {...(stage.extraGlobalProps === undefined
                      ? {}
                      : { extraGlobalProps: stage.extraGlobalProps })}
                  />
                </MotionStage>
              </MotionPresentation>
            </MotionStageContainer>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export { ChoreographyView }
