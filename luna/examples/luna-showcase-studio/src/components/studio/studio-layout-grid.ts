// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  InteractionParams,
  LynxRuntimeCall,
  StudioModeGrid,
  StudioResolvedLayout,
  StudioResolvedStage,
} from '@lynx-js/luna-studio'
import type { CSSProperties } from 'react'

import { LynxUIComponentsRegistry } from '../../constants'
import type { LunaThemeKey, StudioViewMode } from '../../types'

const getMeta = LynxUIComponentsRegistry.getMeta

interface StudioComponentMetadata {
  key: string
  meta?: ReturnType<typeof getMeta>
}

interface StudioStageMetadata {
  component?: StudioComponentMetadata
}

interface StudioStageDefinition {
  entry: string
  theme: LunaThemeKey
  studio?: StudioStageMetadata
}

interface Cell {
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
}

const stageCatalog = {
  Bloom: { entry: 'ActBloom', theme: 'lunaris-light' },
  MoonRise: {
    entry: 'ActMoonrise',
    theme: 'luna-light',
    studio: {
      component: {
        key: 'button',
        meta: getMeta('button'),
      },
    },
  },
  MoonRiseDark: { entry: 'ActMoonrise', theme: 'luna-dark' },
  Switch: {
    entry: 'ActSwitch',
    theme: 'lunaris-dark',
    studio: {
      component: {
        key: 'switch',
        meta: getMeta('switch'),
      },
    },
  },
  Slider: {
    entry: 'ActTwo',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'slider',
        meta: getMeta('slider'),
      },
    },
  },
  Radio: {
    entry: 'ActRadioGroup',
    theme: 'lunaris-dark',
    studio: {
      component: {
        key: 'radio-group',
        meta: getMeta('radio-group'),
      },
    },
  },
  ScrollView: {
    entry: 'OffstageActScrollView',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'scroll-view',
        meta: getMeta('scroll-view'),
      },
    },
  },
  FeedList: {
    entry: 'OffstageActFeedList',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'feed-list',
        meta: getMeta('feed-list'),
      },
    },
  },
  Swiper: {
    entry: 'OffstageActSwiper',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'swiper',
        meta: getMeta('swiper'),
      },
    },
  },
  Popover: {
    entry: 'ActPopover',
    theme: 'luna-light',
    studio: {
      component: {
        key: 'popover',
        meta: getMeta('popover'),
      },
    },
  },
  Sheet: {
    entry: 'ActOne',
    theme: 'lunaris-dark',
    studio: {
      component: {
        key: 'sheet',
        meta: getMeta('sheet'),
      },
    },
  },
  Dialog: {
    entry: 'ActDialog',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'dialog',
        meta: getMeta('dialog'),
      },
    },
  },
  Checkbox: {
    entry: 'ActCheckbox',
    theme: 'lunaris-dark',
    studio: {
      component: {
        key: 'checkbox',
        meta: getMeta('checkbox'),
      },
    },
  },
  Input: {
    entry: 'ActTwo',
    theme: 'luna-dark',
    studio: {
      component: {
        key: 'input',
        meta: getMeta('input'),
      },
    },
  },
} satisfies Record<string, StudioStageDefinition>

type StageId = keyof typeof stageCatalog
type StudioAppStage = StudioResolvedStage & { studio?: StudioStageMetadata }

type ModeLayoutItem = StageId | {
  id: StageId
  cell: Cell
}

function cell(
  col: number,
  row: number,
  colSpan = 1,
  rowSpan = 1,
): Cell {
  return { col, row, colSpan, rowSpan }
}

const modeGrid = {
  compare: { cols: 4, rows: 1 },
  focus: { cols: 3, rows: 1 },
  lineup: { cols: 5, rows: 2 },
} satisfies StudioModeGrid

const modeLayout = {
  // Keep compare array order aligned with the legacy layout to avoid DOM reordering.
  compare: [
    { id: 'MoonRiseDark', cell: cell(4, 1) },
    { id: 'Sheet', cell: cell(2, 1) },
    { id: 'MoonRise', cell: cell(3, 1) },
    { id: 'Bloom', cell: cell(1, 1) },
  ],
  focus: [
    { id: 'Radio', cell: cell(2, 1, 2) },
    { id: 'Switch', cell: cell(2, 1, 2) },
    { id: 'ScrollView', cell: cell(2, 1, 2) },
    { id: 'Checkbox', cell: cell(2, 1, 2) },
    { id: 'FeedList', cell: cell(2, 1, 2) },
    { id: 'Sheet', cell: cell(2, 1, 2) },
    { id: 'Swiper', cell: cell(2, 1, 2) },
    { id: 'Dialog', cell: cell(2, 1, 2) },
    { id: 'Popover', cell: cell(2, 1, 2) },
    { id: 'MoonRise', cell: cell(2, 1, 2) },
    { id: 'Bloom', cell: cell(1, 1) },
  ],
  lineup: [
    { id: 'Radio', cell: cell(5, 1) },
    { id: 'Switch', cell: cell(1, 1) },
    { id: 'ScrollView', cell: cell(5, 2) },
    { id: 'Checkbox', cell: cell(2, 1) },
    { id: 'FeedList', cell: cell(3, 1) },
    { id: 'Sheet', cell: cell(4, 1) },
    { id: 'Swiper', cell: cell(1, 2) },
    { id: 'Dialog', cell: cell(4, 2) },
    { id: 'Popover', cell: cell(3, 2) },
    { id: 'MoonRise', cell: cell(2, 2) },
  ],
} satisfies Record<StudioViewMode, ModeLayoutItem[]>

function getModeItemId(item: ModeLayoutItem): StageId {
  return typeof item === 'string' ? item : item.id
}

function getModeItemCell(
  item: ModeLayoutItem,
  index: number,
): Cell {
  if (typeof item === 'string') {
    return cell(index + 1, 1)
  }
  return item.cell
}

function toGridStyle(cellValue: Cell): CSSProperties {
  const colEnd = cellValue.col + (cellValue.colSpan ?? 1)
  const rowEnd = cellValue.row + (cellValue.rowSpan ?? 1)

  return {
    gridColumnStart: cellValue.col,
    gridColumnEnd: colEnd,
    gridRowStart: cellValue.row,
    gridRowEnd: rowEnd,
  }
}

function findStageIdByComponentKey(componentKey: string): StageId | undefined {
  const entry = Object.entries(
    stageCatalog as Record<string, StudioStageDefinition>,
  )
    .find(([, stage]) => stage.studio?.component?.key === componentKey)
  return entry?.[0] as StageId | undefined
}

function resolveModeLayout(mode: StudioViewMode): StudioAppStage[] {
  return modeLayout[mode].map((item, index) => {
    const id = getModeItemId(item)
    const stage: StudioStageDefinition = stageCatalog[id]
    const stageCell = getModeItemCell(item, index)

    return {
      id,
      style: toGridStyle(stageCell),
      ...(stage.studio === undefined ? {} : { studio: stage.studio }),
      ...(stage.studio?.component === undefined ? {} : { focusKey: id }),
      entry: stage.entry,
      theme: stage.theme,
    }
  })
}

const DEFAULT_STUDIO_FOCUS_KEY: StageId = 'MoonRise'

function resolveStudioFocusKey(
  interaction: InteractionParams,
): string | undefined {
  if (interaction.target !== 'content') return undefined
  const call: LynxRuntimeCall | undefined = interaction.runtimeCall
  if (call === undefined) return undefined
  if (call.name !== 'emitStudioEvent') return undefined
  if (call.data === null || typeof call.data !== 'object') return undefined

  const data = call.data as { type?: unknown, payload?: unknown }
  if (data.type !== 'studioFocusKey') return undefined
  if (data.payload === null || typeof data.payload !== 'object') {
    return undefined
  }

  const focusKey = (data.payload as { focusKey?: unknown }).focusKey
  if (typeof focusKey !== 'string') return undefined

  return findStageIdByComponentKey(focusKey)
}

function buildStudioStageGlobalProps(params: {
  stage: StudioResolvedStage
  viewMode: StudioViewMode
  activeFocusKey: string
}): Record<string, unknown> {
  const focusedStage = (stageCatalog as Record<string, StudioStageDefinition>)[
    params.activeFocusKey
  ]
  const studioFocusKey = focusedStage?.studio?.component?.key

  return {
    studioViewMode: params.viewMode,
    ...(studioFocusKey === undefined ? {} : { studioFocusKey }),
  }
}

/** Draft grid-first layout data kept next to the current Tailwind-string version for comparison. */
const studioLayoutGridDraft: StudioResolvedLayout = {
  compare: resolveModeLayout('compare'),
  focus: resolveModeLayout('focus'),
  lineup: resolveModeLayout('lineup'),
}

export type { Cell, ModeLayoutItem, StudioStageDefinition, StageId }
export {
  buildStudioStageGlobalProps,
  DEFAULT_STUDIO_FOCUS_KEY,
  modeGrid,
  modeLayout,
  resolveStudioFocusKey,
  stageCatalog,
  studioLayoutGridDraft,
}
