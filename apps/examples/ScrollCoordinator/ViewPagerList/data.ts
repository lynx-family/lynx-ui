// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const storyTitles = [
  'Small details, big ideas',
  'A quieter kind of interface',
  'Color in everyday places',
  'The rhythm of a good day',
  'Built for curiosity',
]

export const sections = [
  { id: 'discover', title: 'Discover' },
  { id: 'saved', title: 'Saved' },
  { id: 'editors', title: 'Editors' },
].map(section => ({
  ...section,
  items: Array.from({ length: 30 }, (_, index) => ({
    id: `${section.id}-${index}`,
    number: String(index + 1).padStart(2, '0'),
    title: storyTitles[index % storyTitles.length],
  })),
}))
