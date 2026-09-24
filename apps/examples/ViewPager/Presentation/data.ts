// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const pages = [
  { id: 'v', letter: 'V', cardHeight: 500, pagerHeight: 600 },
  { id: 'i', letter: 'I', cardHeight: 360, pagerHeight: 460 },
  { id: 'e-1', letter: 'E', cardHeight: 500, pagerHeight: 600 },
  { id: 'w', letter: 'W', cardHeight: 320, pagerHeight: 420 },
  { id: 'p', letter: 'P', cardHeight: 410, pagerHeight: 510 },
  { id: 'a', letter: 'A', cardHeight: 500, pagerHeight: 600 },
  { id: 'g', letter: 'G', cardHeight: 410, pagerHeight: 510 },
  { id: 'e-2', letter: 'E', cardHeight: 320, pagerHeight: 420 },
  { id: 'r', letter: 'R', cardHeight: 410, pagerHeight: 510 },
]

export type PresentationPage = (typeof pages)[number]
