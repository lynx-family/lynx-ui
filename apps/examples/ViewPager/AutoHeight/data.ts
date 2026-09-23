// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const stories = [
  {
    id: 'short',
    label: 'SHORT',
    title: 'Content defines the height',
    lines: ['No height is set on ViewPager.', 'This page only needs two rows.'],
  },
  {
    id: 'medium',
    label: 'MEDIUM',
    title: 'Pages can contain different amounts of content',
    lines: [
      'The generated pager item participates in layout.',
      'Keep each page width at 100%.',
      'Swipe to compare the resulting page sizes.',
      'Use DynamicHeight when the container must follow every page.',
    ],
  },
  {
    id: 'long',
    label: 'LONG',
    title: 'Natural layout remains data-driven',
    lines: [
      'The render function receives the current data item.',
      'Stable keys preserve each page across collection updates.',
      'Shared wrapper styles belong in itemClassName or itemStyle.',
      'Content stays focused on the page itself.',
      'No explicit ViewPagerItem is required.',
      'The component creates the direct native children.',
    ],
  },
]
