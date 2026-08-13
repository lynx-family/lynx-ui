// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface LayerCardData {
  key: string
  title: string
  subtitle: string
  badge: string
  surfaceClassName:
    | 'layer-card--canvas'
    | 'layer-card--paper'
    | 'layer-card--paper-clear'
  raised?: boolean
}

export const CARDS: LayerCardData[] = [
  {
    key: 'card-1',
    title: 'Canvas Surface',
    subtitle: 'The first content layer above the canvas-ambient viewport.',
    badge: 'canvas · z-index: 1',
    surfaceClassName: 'layer-card--canvas',
  },
  {
    key: 'card-2',
    title: 'Raised Paper Surface',
    subtitle: 'The raised badge overlaps neighboring cards while scrolling.',
    badge: 'paper · z-index: 3',
    surfaceClassName: 'layer-card--paper',
    raised: true,
  },
  {
    key: 'card-3',
    title: 'Paper Surface',
    subtitle: 'Standard content card sitting under the raised layer.',
    badge: 'paper · z-index: 1',
    surfaceClassName: 'layer-card--paper',
  },
  {
    key: 'card-4',
    title: 'Paper Clear Surface',
    subtitle: 'A lighter surface variant to compare stacked elevation.',
    badge: 'paper-clear · z-index: 1',
    surfaceClassName: 'layer-card--paper-clear',
  },
]
