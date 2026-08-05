// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  StudioResolvedLayout,
  StudioResolvedStage,
} from '@lynx-js/luna-studio'

import { LynxUIComponentsRegistry } from '../../constants'
import type { LunaThemeKey, StudioViewMode } from '../../types'

const getMeta = LynxUIComponentsRegistry.getMeta

/** Legacy layout snapshot kept only for side-by-side comparison with the new data-driven grid config. */

/** App-local stage catalog that keeps demo-specific entry and registry metadata out of choreography core. */
type StudioStageDefinition = {
  entry: string
  theme: LunaThemeKey
  componentId?: string
} & Record<string, unknown>

interface LegacyLayoutItem {
  id: string
  className: string
}

const stageCatalog: Record<string, StudioStageDefinition> = {
  Bloom: { entry: 'ActBloom', theme: 'lunaris-light' },
  MoonRise: {
    entry: 'ActMoonrise',
    theme: 'luna-light',
    meta: getMeta('button'),
    componentId: 'button',
  },
  MoonRiseDark: { entry: 'ActMoonrise', theme: 'luna-dark' },
  Switch: {
    entry: 'ActSwitch',
    theme: 'lunaris-dark',
    meta: getMeta('switch'),
    componentId: 'switch',
  },
  Slider: {
    entry: 'ActTwo',
    theme: 'luna-dark',
    meta: getMeta('slider'),
    componentId: 'slider',
  },
  Radio: {
    entry: 'ActRadioGroup',
    theme: 'lunaris-dark',
    meta: getMeta('radio-group'),
    componentId: 'radio-group',
  },
  ScrollView: {
    entry: 'OffstageActScrollView',
    theme: 'luna-dark',
    meta: getMeta('scroll-view'),
    componentId: 'scroll-view',
  },
  FeedList: {
    entry: 'OffstageActFeedList',
    theme: 'luna-dark',
    meta: getMeta('feed-list'),
    componentId: 'feed-list',
  },
  Swiper: {
    entry: 'OffstageActSwiper',
    theme: 'luna-dark',
    meta: getMeta('swiper'),
    componentId: 'swiper',
  },
  Popover: {
    entry: 'ActPopover',
    theme: 'luna-light',
    meta: getMeta('popover'),
    componentId: 'popover',
  },
  Sheet: {
    entry: 'ActOne',
    theme: 'lunaris-dark',
    meta: getMeta('sheet'),
    componentId: 'sheet',
  },
  Dialog: {
    entry: 'ActDialog',
    theme: 'luna-dark',
    meta: getMeta('dialog'),
    componentId: 'dialog',
  },
  Checkbox: {
    entry: 'ActCheckbox',
    theme: 'lunaris-dark',
    meta: getMeta('checkbox'),
    componentId: 'checkbox',
  },
  Input: {
    entry: 'ActTwo',
    theme: 'luna-dark',
    meta: getMeta('input'),
    componentId: 'input',
  },
}

const baseLayout = {
  compare: [
    { id: 'MoonRiseDark', className: 'flex-1 order-4' },
    { id: 'Sheet', className: 'flex-1 order-2' },
    { id: 'MoonRise', className: 'flex-1 order-3' },
    { id: 'Bloom', className: 'flex-1 order-1' },
  ],
  focus: [
    {
      id: 'Radio',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-12',
    },
    {
      id: 'Switch',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-11',
    },
    {
      id: 'ScrollView',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-10',
    },
    {
      id: 'Checkbox',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-9',
    },
    {
      id: 'FeedList',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-8',
    },
    {
      id: 'Sheet',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-2',
    },
    {
      id: 'Swiper',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-6',
    },
    {
      id: 'Dialog',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-5',
    },
    {
      id: 'Popover',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-4',
    },
    {
      id: 'MoonRise',
      className: 'col-start-2 col-end-4 row-start-1 row-end-2 order-3',
    },
    {
      id: 'Bloom',
      className: 'col-start-1 col-end-2 row-start-1 row-end-2 order-1',
    },
  ],
  lineup: [
    {
      id: 'Radio',
      className: 'col-start-5 col-end-6 row-start-1 row-end-2 order-12',
    },
    {
      id: 'Switch',
      className: 'col-start-1 col-end-2 row-start-1 row-end-2 order-11',
    },
    {
      id: 'ScrollView',
      className: 'col-start-5 col-end-6 row-start-2 row-end-3 order-10',
    },
    {
      id: 'Checkbox',
      className: 'col-start-2 col-end-3 row-start-1 row-end-2 order-9',
    },
    {
      id: 'FeedList',
      className: 'col-start-3 col-end-4 row-start-1 row-end-2 order-8',
    },
    {
      id: 'Sheet',
      className: 'col-start-4 col-end-5 row-start-1 row-end-2 order-2',
    },
    {
      id: 'Swiper',
      className: 'col-start-1 col-end-2 row-start-2 row-end-3 order-6',
    },
    {
      id: 'Dialog',
      className: 'col-start-4 col-end-5 row-start-2 row-end-3 order-5',
    },
    {
      id: 'Popover',
      className: 'col-start-3 col-end-4 row-start-2 row-end-3 order-4',
    },
    {
      id: 'MoonRise',
      className: 'col-start-2 col-end-3 row-start-2 row-end-3 order-3',
    },
  ],
} satisfies Record<StudioViewMode, LegacyLayoutItem[]>

function mapStageEntries(
  entries: LegacyLayoutItem[],
): StudioResolvedStage[] {
  return entries.map((entry) => {
    const stage = stageCatalog[entry.id]
    if (stage === undefined) {
      throw new Error(`Unknown stage id: ${entry.id}`)
    }

    const stageEntry: StudioResolvedStage = {
      id: entry.id,
      className: entry.className,
      ...stage,
    }
    return stageEntry
  })
}

/** Legacy demo layout kept for reference only; the active Studio shell now uses `studio-layout-grid.ts`. */
const studioLayout: StudioResolvedLayout = {
  compare: mapStageEntries(baseLayout.compare),
  focus: mapStageEntries(baseLayout.focus),
  lineup: mapStageEntries(baseLayout.lineup),
}

export { studioLayout }
