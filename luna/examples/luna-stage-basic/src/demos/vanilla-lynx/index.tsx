// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/web-core/client'

import { useState } from 'react'

function TestAttr() {
  return (
    <lynx-view
      url='/SwitchBasic.web.bundle'
      style={{ width: 375, height: 812, display: 'block' }}
    />
  )
}

function TestProp() {
  return (
    <lynx-view
      ref={(el) => {
        if (el) {
          // @ts-expect-error custom element type
          el.url = '/SwitchBasic.web.bundle'
        }
      }}
      style={{ width: 375, height: 812, display: 'block' }}
    />
  )
}

export default function Demo() {
  const [mode, setMode] = useState<'attr' | 'prop'>('attr')
  return (
    <>
      <button onClick={() => setMode(m => m === 'attr' ? 'prop' : 'attr')}>
        {mode}
      </button>
      {mode === 'attr' ? <TestAttr /> : <TestProp />}
    </>
  )
}
