// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <main className='min-h-screen bg-canvas text-content'>
      <div className='mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12'>
        <Outlet />
      </div>
    </main>
  )
}

export { AppLayout }
