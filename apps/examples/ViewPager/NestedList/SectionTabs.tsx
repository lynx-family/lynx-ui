// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button } from '@lynx-js/lynx-ui'

import type { Section } from './data'

interface SectionTabsProps {
  activeIndex: number
  onSelect: (index: number) => void
  sections: readonly Section[]
}

export function SectionTabs(
  { activeIndex, onSelect, sections }: SectionTabsProps,
) {
  return (
    <view className='tabs'>
      {sections.map((section, index) => (
        <Button
          key={section.id}
          className={`tab ${index === activeIndex ? 'active' : ''}`}
          onClick={() => onSelect(index)}
        >
          <text className='tab-label'>{section.title}</text>
        </Button>
      ))}
    </view>
  )
}
