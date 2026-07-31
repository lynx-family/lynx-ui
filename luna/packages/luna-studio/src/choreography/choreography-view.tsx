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
import { getStageWorldState } from '../utils/world'

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
  // event handlers. Only wrapping callbacks where stale-closure behavior would
  // matter; `onLynxRuntimeCall` is a pass-through with a runtime-meaningful
  // return value and stays as a direct prop call.
  const resolveFocusKeyEvent = useEventCallback(resolveFocusKey)
  const onInteractionEvent = useEventCallback(onInteraction)

  const handleInteraction = (interaction: InteractionParams): void => {
    const nextActiveFocusKey = resolveFocusKeyEvent(interaction)
    if (nextActiveFocusKey !== undefined) {
      setActiveFocusKey(nextActiveFocusKey)
    }
    onInteractionEvent(interaction)
  }

  // Container event handlers and runtime-call handlers close over `stage`, so
  // they're inherently per-stage per-render. We don't try to memoize the
  // factory functions — instead we keep them cheap and let React handle it.
  // These handlers all normalize into `interaction.containerEvent`; consumers
  // can inspect `containerEvent.type` to distinguish click vs pointer events.
  function getStageContainerEventHandlers(stage: StudioResolvedStage) {
    if (!containerInteractive) return undefined
    const dispatch = (e: ReactMouseEvent | ReactPointerEvent) => {
      handleInteraction(createStageInteraction(stage, e.nativeEvent))
    }
    return {
      onClick: dispatch,
      onPointerCancel: dispatch,
      onPointerDown: dispatch,
      onPointerUp: dispatch,
    }
  }

  function getStageRuntimeCallHandler(stage: StudioResolvedStage) {
    return (call: LynxRuntimeCall) => {
      handleInteraction(createContentInteraction(stage, call))
      return onLynxRuntimeCall?.(call)
    }
  }

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
    const focusableStages = stages.filter(stage => hasFocusKey(stage))
    const backgroundStages = focusableStages.filter(
      stage => stage.focusKey !== resolvedActiveFocusKey,
    )

    const mid = (backgroundStages.length - 1) / 2
    const focusedIndex = focusableStages.findIndex(
      stage => stage.focusKey === resolvedActiveFocusKey,
    )

    return stages.map((stage) => {
      const compOrder = backgroundStages.findIndex(
        bg => bg.focusKey === stage.focusKey,
      )
      const escape = compOrder === -1
      const { world, zIndex, maskOpacity } = getStageWorldState({
        mode,
        compOrder,
        mid,
        focusedIndex,
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
        {rendered.map(stage => (
          <MotionStageContainer
            layoutId={stage.id}
            key={stage.id}
            className={stage.className}
            {...getStageContainerEventHandlers(stage)}
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
                  onLynxRuntimeCall={getStageRuntimeCallHandler(stage)}
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
        ))}
      </AnimatePresence>
    </div>
  )
}

export { ChoreographyView }
