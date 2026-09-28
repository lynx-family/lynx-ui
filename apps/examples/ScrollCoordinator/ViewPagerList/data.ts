// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const sections = [
  { id: 'discover', title: 'Discover', topic: 'Fresh perspectives' },
  { id: 'saved', title: 'Saved', topic: 'Worth another look' },
  { id: 'editors', title: 'Editors', topic: 'Selected with care' },
].map(section => ({
  ...section,
  items: Array.from({ length: 30 }, (_, index) => ({
    id: `${section.id}-${index}`,
    number: String(index + 1).padStart(2, '0'),
    title: `${section.topic} / ${index + 1}`,
    description: 'Ideas, observations, and stories for a thoughtful day.',
  })),
}))
