// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './layouts/AppLayout'
import { TokensPage } from './pages/TokensPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route element={<TokensPage />} path='/tokens' />
      </Route>
      <Route element={<Navigate replace to='/tokens' />} path='*' />
    </Routes>
  )
}

export default App
