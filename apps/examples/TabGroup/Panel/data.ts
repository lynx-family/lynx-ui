// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TabsData } from '@lynx-js/lynx-ui'

import { moonPhases } from '../shared/moonPhases'

const pageClassNames = [
  'page page-rose',
  'page page-berry',
  'page page-afterglow',
  'page page-ocean',
  'page page-afterglow',
  'page page-berry',
  'page page-rose',
] as const

export const pages = moonPhases.map((phase, index) => ({
  ...phase,
  className: pageClassNames[index] ?? 'page page-rose',
}))

export const tabs: TabsData<(typeof pages)[number]>[] = pages.map(page => ({
  tabItem: page,
  getTabKey: () => page.id,
}))
