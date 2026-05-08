// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface LetterItem {
  key: string
  letter: string
}

export const FEED_INITIAL: LetterItem[] = [
  { key: 'initial-F', letter: 'F' },
  { key: 'initial-E1', letter: 'E' },
  { key: 'initial-E2', letter: 'E' },
  { key: 'initial-D', letter: 'D' },
  { key: 'initial-L', letter: 'L' },
  { key: 'initial-I', letter: 'I' },
  { key: 'initial-S', letter: 'S' },
  { key: 'initial-T', letter: 'T' },
]

export const FEED_REFRESH: LetterItem[] = [
  { key: 'refresh-R1', letter: 'R' },
  { key: 'refresh-E3', letter: 'E' },
  { key: 'refresh-F2', letter: 'F' },
  { key: 'refresh-R2', letter: 'R' },
  { key: 'refresh-E4', letter: 'E' },
  { key: 'refresh-S2', letter: 'S' },
  { key: 'refresh-H', letter: 'H' },
]
