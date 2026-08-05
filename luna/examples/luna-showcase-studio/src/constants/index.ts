// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineComponents } from '@lynx-js/example-luna-showcase-catalog'

const components = [
  { id: 'button', demoReady: true },
  { id: 'checkbox', demoReady: true },
  { id: 'dialog', demoReady: true },
  { id: 'input', demoReady: false },
  { id: 'popover', demoReady: true },
  { id: 'radio-group', demoReady: true },
  { id: 'sheet', demoReady: true },
  { id: 'slider', demoReady: false },
  { id: 'switch', demoReady: true },
  { id: 'swiper', demoReady: true },
  { id: 'toast', demoReady: false },
  { id: 'scroll-view', demoReady: true, name: 'ScrollView' },
  { id: 'feed-list', demoReady: true, name: 'FeedList' },
] as const

export const LynxUIComponentsRegistry = defineComponents(
  components,
)
