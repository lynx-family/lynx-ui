// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  LunaThemeKey,
  LunaThemeMode,
  LunaThemeVariant,
} from '@lynx-js/luna-core'
import type { CSSProperties } from 'react'

import type { Prettify } from './utils'

export type { LunaThemeKey, LunaThemeMode, LunaThemeVariant }

/**
 * Built-in studio presentation modes.
 * `compare` allows each stage to render with its own theme for side-by-side comparison,
 * `focus` renders all stages under a single shared theme and applies 3D focal emphasis,
 * while `lineup` renders all stages under a single shared theme without that focus treatment.
 */
export type StudioViewMode = 'compare' | 'focus' | 'lineup'

export interface StudioGridSpec {
  cols: number
  rows: number
}

export interface StudioStage {
  /** Stable stage identifier used for pool lookup, layout references, and event correlation. */
  id: string
  /** Lynx bundle entry rendered by this stage. */
  entry: string
  /**
   * Optional resource root used together with `entry` to locate the Lynx bundle.
   * When omitted, `Choreography` may provide a host-level fallback via `bundleRoot`.
   */
  bundleRoot?: string
  /**
   * Stage-scoped theme key used when the active presentation mode allows
   * per-stage theming.
   */
  theme: LunaThemeKey
  /** Optional stage-level focus key used by choreography focus ordering and selection. */
  focusKey?: string
}

export type StudioResolvedStage = Prettify<
  StudioStage & {
    /** Optional layout className applied to the stage container. */
    className?: string
    /** Optional inline layout style applied to the stage container. */
    style?: CSSProperties
  }
>

/** Layout data for the three built-in studio presentation modes. */
export type StudioResolvedLayout = Record<
  StudioViewMode,
  StudioResolvedStage[]
>

/**
 * Stage slice in an authoring `StudioLayout`.
 *
 * This type intentionally excludes resource-locator fields such as `entry` and `bundleRoot`.
 * Instead, it references a pool stage by `id` and provides per-mode overrides like
 * `className/style` and optional semantic overrides like `theme/focusKey`.
 *
 * Slice ids must be unique within a single view mode. The resolved `stage.id` is used
 * as the render identity (React key, Motion layout id, and emitted `interaction.stageId`).
 */
export type StudioStageSlice = Prettify<
  & Pick<StudioResolvedStage, 'id' | 'className' | 'style' | 'focusKey'>
  & Partial<Pick<StudioResolvedStage, 'theme'>>
>

/**
 * Authoring layout specification keyed by `StudioViewMode`.
 * Each mode contains an ordered list of `StudioStageSlice` items.
 */
export type StudioLayout = Record<StudioViewMode, StudioStageSlice[]>

export interface ResolveStudioLayoutParams {
  /**
   * Resource pool keyed by stage id. Each pool item defines the stage's
   * resource locator (`entry`, optional `bundleRoot`) and its default semantics
   * (`theme`, optional `focusKey`).
   */
  stagePool: Record<string, StudioStage>
  /**
   * Layout specification keyed by view mode. Each item references a pool entry
   * by `id` and carries host-side projection overrides (e.g. `style`, `className`).
   */
  layoutSpec: StudioLayout
  /**
   * Optional host-level default bundle root used when a stage pool item does not
   * define its own `bundleRoot`.
   */
  bundleRoot?: string
}

/**
 * Resolves an authoring layout specification into a fully render-ready layout for `Choreography`.
 *
 * This helper merges three layers of data:
 * - `stagePool` provides the resource locator (`entry`, optional `bundleRoot`) and stage defaults.
 * - `layoutSpec` provides per-mode stage ordering and host-side overrides (`className`, `style`, etc.).
 * - `bundleRoot` provides an optional host-level fallback when a pool stage does not define one.
 *
 * Resolution rules:
 * - `entry`: pool-only
 * - `bundleRoot`: `pool.bundleRoot ?? params.bundleRoot ?? undefined`
 * - `theme`: `slice.theme ?? pool.theme`
 * - `focusKey`: `slice.focusKey ?? pool.focusKey`
 * - `className/style`: slice-only
 *
 * `layoutSpec` must not contain duplicate slice ids within the same view mode.
 * This is required because the resolved `stage.id` is used as the stable identity
 * for React keys, Motion layout ids, and emitted `interaction.stageId`.
 *
 * Throws if any `layoutSpec` item references a stage id that is missing from `stagePool`.
 */
export function resolveStudioLayout(
  params: ResolveStudioLayoutParams,
): StudioResolvedLayout {
  const { stagePool, layoutSpec, bundleRoot } = params

  const resolveSlice = (slice: StudioStageSlice): StudioResolvedStage => {
    const pool = stagePool[slice.id]
    if (!pool) {
      throw new Error(`Missing stagePool item for id: ${slice.id}`)
    }

    const resolved: StudioResolvedStage = {
      id: slice.id,
      entry: pool.entry,
      theme: slice.theme ?? pool.theme,
    }

    const resolvedBundleRoot = pool.bundleRoot ?? bundleRoot
    if (resolvedBundleRoot !== undefined) {
      resolved.bundleRoot = resolvedBundleRoot
    }

    const resolvedFocusKey = slice.focusKey ?? pool.focusKey
    if (resolvedFocusKey !== undefined) {
      resolved.focusKey = resolvedFocusKey
    }

    if (slice.className !== undefined) {
      resolved.className = slice.className
    }

    if (slice.style !== undefined) {
      resolved.style = slice.style
    }

    return resolved
  }

  const MODES: StudioViewMode[] = ['compare', 'focus', 'lineup']

  for (const mode of MODES) {
    const slices = (layoutSpec as Partial<StudioLayout>)[mode]
    if (slices === undefined) {
      throw new Error(`Missing StudioLayout mode: ${mode}`)
    }

    const seen = new Set<string>()
    for (const slice of slices) {
      if (seen.has(slice.id)) {
        throw new Error(
          `Duplicate StudioStageSlice.id in mode "${mode}": ${slice.id}. `
            + 'Each mode must use unique stage ids because stage.id is the render identity. '
            + 'To render the same entry multiple times, define multiple pool stages with different ids.',
        )
      }
      seen.add(slice.id)
    }
  }

  const resolved = {} as StudioResolvedLayout
  for (const mode of MODES) {
    resolved[mode] = layoutSpec[mode].map((slice) => resolveSlice(slice))
  }
  return resolved
}

export function indexResolvedLayout(layout: StudioResolvedLayout): {
  focusKeys: Set<string>
  stageIdToFocusKey: Map<string, string>
} {
  const focusKeys = new Set<string>()
  const stageIdToFocusKey = new Map<string, string>()
  const focusKeyToStageId = new Map<string, string>()

  const modes = Object.keys(layout) as (keyof StudioResolvedLayout)[]
  for (const mode of modes) {
    for (const stage of layout[mode]) {
      const focusKey = stage.focusKey
      if (focusKey === undefined) continue

      const focusKeyOwner = focusKeyToStageId.get(focusKey)
      if (focusKeyOwner !== undefined && focusKeyOwner !== stage.id) {
        throw new Error(
          `Duplicate focusKey "${focusKey}" found for stages "${focusKeyOwner}" and "${stage.id}".`,
        )
      }
      focusKeyToStageId.set(focusKey, stage.id)
      focusKeys.add(focusKey)

      const prevFocusKey = stageIdToFocusKey.get(stage.id)
      if (prevFocusKey !== undefined && prevFocusKey !== focusKey) {
        throw new Error(
          `Conflicting focusKey for stage "${stage.id}": "${prevFocusKey}" vs "${focusKey}".`,
        )
      }
      stageIdToFocusKey.set(stage.id, focusKey)
    }
  }

  return { focusKeys, stageIdToFocusKey }
}

/** Optional mode-to-grid mapping used by grid-driven choreography containers. */
export type StudioModeGrid = Record<StudioViewMode, StudioGridSpec>

/** Optional builder that derives Lynx global props for a stage render. */
export type StageGlobalPropsBuilder = (params: {
  /** Current stage being rendered. */
  stage: StudioResolvedStage
  /** Active studio presentation mode. */
  viewMode: StudioViewMode
  /** Resolved active focus key for the current choreography state. */
  activeFocusKey: string
  /** Stage-level focus key associated with `stage`, if any. */
  focusKey: string | undefined
}) => Record<string, unknown> | undefined
