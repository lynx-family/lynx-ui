// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const sections = [
  { id: 'recent', title: 'Recent', start: 1 },
  { id: 'saved', title: 'Saved', start: 11 },
  { id: 'shared', title: 'Shared', start: 21 },
].map(section => ({
  ...section,
  items: Array.from({ length: 12 }, (_, index) => ({
    id: `${section.id}-${index}`,
    number: section.start + index,
  })),
}))
