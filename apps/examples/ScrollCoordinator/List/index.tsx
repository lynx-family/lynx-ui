// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { ScrollCoordinator } from '@lynx-js/lynx-ui'
import type { ScrollCoordinatorRef } from '@lynx-js/lynx-ui'

import {
  CoordinatorControls,
  Cover,
  DemoLayout,
  StoryList,
  Toolbar,
} from '../shared/Demo'

function App() {
  const coordinator = useRef<ScrollCoordinatorRef>(null)
  const [enabled, setEnabled] = useState(true)
  const [offset, setOffset] = useState(0)
  const [sticky, setSticky] = useState(false)

  return (
    <DemoLayout
      title='Collapsible collection'
      controls={
        <CoordinatorControls
          enabled={enabled}
          onExpand={() => coordinator.current?.scrollToTop(true)}
          onCollapse={() => coordinator.current?.scrollToSticky(true)}
          onShowDetails={() =>
            coordinator.current?.scrollIntoView('collection-details', true)}
          onToggleEnabled={() => setEnabled(value => !value)}
        />
      }
    >
      <ScrollCoordinator
        ref={coordinator}
        id='collection'
        className='sc-coordinator'
        style={{ width: '100%', height: '100%' }}
        enableScroll={enabled}
        onOffsetChange={event => setOffset(Math.round(event.offset))}
        onSticky={() => setSticky(true)}
        onLeaveSticky={() => setSticky(false)}
        toolbar={
          <Toolbar
            status={`${sticky ? 'Pinned' : `${offset}px`}${
              enabled ? '' : ' · locked'
            }`}
          />
        }
        headers={<Cover status='Latest stories' />}
        slot={<StoryList listId='collection-list' />}
      />
    </DemoLayout>
  )
}

root.render(<App />)

export default App
