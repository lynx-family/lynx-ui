// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { moonPhases } from '../shared/moonPhases'

const descriptions = [
  'The moon rests beyond view.',
  'A slim arc begins to return.',
  'Half of the moon is illuminated.',
  'Moonlight continues to grow.',
  'The lunar face is fully lit.',
  'Moonlight begins to recede.',
  'A final arc remains.',
] as const

const contentVariants = [
  'content-rose',
  'content-berry',
  'content-afterglow',
  'content-ocean',
  'content-afterglow',
  'content-berry',
  'content-rose',
] as const

export const tabs = moonPhases.map((phase, index) => ({
  ...phase,
  description: descriptions[index] ?? descriptions[0],
  contentVariant: contentVariants[index] ?? contentVariants[0],
}))
