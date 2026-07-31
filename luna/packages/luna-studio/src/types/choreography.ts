// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from 'react'

import type { LynxRuntimeCall } from './lynx-stage'
import type {
  LunaThemeKey,
  LunaThemeMode,
  StageGlobalPropsBuilder,
  StudioModeGrid,
  StudioResolvedLayout,
  StudioViewMode,
} from './studio'
import type { Prettify } from './utils'

export type InteractionTarget = 'stage' | 'content'

interface BaseInteractionParams {
  /** Stage instance identity used by the choreography layer to correlate interactions. */
  stageId: string
  /** Lynx entry rendered inside the stage associated with this interaction. */
  entry: string
  /** Optional app-defined payload forwarded from the interaction source. */
  payload?: unknown
}

type StageInteractionParams = BaseInteractionParams & {
  /**
   * Interaction is attributed to the host-side stage layer.
   * The original browser event payload is exposed separately as `containerEvent`.
   */
  target: 'stage'
  /**
   * Original browser event captured from the stage container.
   * Currently this is sourced from the host-side `onClick`, `onPointerCancel`,
   * `onPointerDown`, and `onPointerUp` handlers; inspect `containerEvent.type`
   * for the concrete event kind.
   */
  containerEvent: MouseEvent | PointerEvent
}

type ContentInteractionParams = BaseInteractionParams & {
  /** Interaction originated from the embedded Lynx content layer. */
  target: 'content'
  /**
   * Original runtime callback emitted from the embedded Lynx content.
   * Currently this is sourced from `onNativeModulesCall`; inspect
   * `runtimeCall.name` for the concrete content-side interaction kind.
   */
  runtimeCall: LynxRuntimeCall
}

export type InteractionParams =
  | StageInteractionParams
  | ContentInteractionParams

export type FocusKeyResolver = (
  interaction: InteractionParams,
) => string | undefined

/**
 * Visual appearance of the host-side stage chrome (outline + mask).
 * These values are forwarded to the underlying MotionStage props.
 */
export interface StageAppearance {
  /** Color of the overlay mask above the device frame. */
  maskColor?: string
  /** Color of the visible device outline (implemented as outline-layer background). */
  outlineColor?: string
}

export interface ChoreographyBaseProps {
  /** Optional class name applied to the outer choreography container. */
  className?: string
  /** Optional inline style merged onto the outer choreography container. */
  style?: CSSProperties
  /**
   * Optional host-level default resource root used when a stage does not define
   * its own `bundleRoot`.
   */
  bundleRoot?: string
  /** Fully resolved stage layout used by the choreography layer. */
  layout: StudioResolvedLayout
  /** Optional grid config that drives the container layout for each mode. */
  modeGrid?: StudioModeGrid
  /** Optional initial focus key used when no runtime selection has been made yet. */
  defaultFocusKey?: string
  /** Optional builder for app-specific Lynx global props derived from stage + focus state. */
  buildStageGlobalProps?: StageGlobalPropsBuilder
  /** Shared theme key applied to all stages in focus/lineup modes. */
  themeKey?: LunaThemeKey
  /** Per-theme-mode stage chrome configuration (falls back to built-in defaults). */
  stageAppearance?: Partial<Record<LunaThemeMode, StageAppearance>> & {
    /** Fallback appearance used when the current theme mode is not configured. */
    default?: StageAppearance
  }
}

export interface ChoreographyInteractionProps {
  /** Optional resolver that maps a generic interaction to a choreography focus key. */
  resolveFocusKey?: FocusKeyResolver
  /** Chooses whether pointer interaction is handled by stage container or embedded content. */
  interactionTarget?: InteractionTarget
  /**
   * Receives normalized stage/content interaction events.
   * This is the primary high-level callback for choreography consumers: when
   * `interaction.target === 'stage'`, the payload includes `containerEvent`;
   * when `interaction.target === 'content'`, it includes `runtimeCall`.
   */
  onInteraction?: (interaction: InteractionParams) => unknown
  /**
   * Receives raw runtime calls emitted from the embedded Lynx content.
   * This is a lower-level escape hatch for consumers that need to inspect or
   * handle the original Lynx bridge callback directly, rather than the
   * normalized `onInteraction` abstraction.
   */
  onLynxRuntimeCall?: (call: LynxRuntimeCall) => unknown
}

export type ChoreographyViewProps =
  & ChoreographyBaseProps
  & ChoreographyInteractionProps
  & {
    /** Active mode selecting which layout slice to render. */
    mode?: StudioViewMode
  }

export type ChoreographyProps = Prettify<
  & Omit<ChoreographyViewProps, 'mode'>
  & {
    /** Active presentation mode for the current choreography render. */
    viewMode?: StudioViewMode
  }
>

export function getPayloadString(
  data: unknown,
  field = 'id',
): string | undefined {
  if (typeof data === 'string') return data
  if (data === null || typeof data !== 'object') return undefined

  const value = (data as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}
