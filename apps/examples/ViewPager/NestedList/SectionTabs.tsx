// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Section } from './data'

interface SectionTabsProps {
  activeIndex: number
  sections: readonly Section[]
}

export function SectionTabs({ activeIndex, sections }: SectionTabsProps) {
  return (
    <view className='tabs'>
      {sections.map((section, index) => (
        <text
          key={section.id}
          className={`tab ${index === activeIndex ? 'active' : ''}`}
        >
          {section.title}
        </text>
      ))}
    </view>
  )
}
