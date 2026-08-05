// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaThemeKey, LynxUIComponentId } from '../types'

export { LynxUIComponentsRegistry } from './component-data.js'

export const ALL_LUNA_THEME_KEYS: LunaThemeKey[] = [
  'luna-light',
  'luna-dark',
  'lunaris-light',
  'lunaris-dark',
]

export const LUNA_SAVED_COMPONENT = 'luna-component'
export const LUNA_SAVED_THEME = 'luna-theme'
export const LUNA_DEFAULT_COMPONENT: LynxUIComponentId = 'button'
export const LUNA_STAGE_DEFAULT_THEME: LunaThemeKey = 'lunaris-dark'
export const LUNA_STUDIO_DEFAULT_THEME: LunaThemeKey = 'lunaris-light'

export const LUNA_STAGE_ONLY_COMPONENTS: LynxUIComponentId[] = [
  'swipe-action',
  'sortable',
  'motion-basic',
  'motion-spring',
  'motion-stagger',
  'motion-slider',
]

export const LUNA_STUDIO_ONLY_COMPONENTS: LynxUIComponentId[] = [
  'popover',
  'feed-list',
]

export const LUNA_OFFSTAGE_COMPONENTS: LynxUIComponentId[] = [
  'sheet',
  'swiper',
  'scroll-view',
  'feed-list',
  'swipe-action',
  'sortable',
  'motion-basic',
  'motion-spring',
  'motion-stagger',
  'motion-slider',
]

export const LUNA_STAGE_COMPONENTS: LynxUIComponentId[] = [
  'switch',
  'button',
  'checkbox',
  'radio-group',
  'popover',
  'dialog',
]
