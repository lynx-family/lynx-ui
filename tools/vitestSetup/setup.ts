// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { vi } from 'vitest'

globalThis.__LEPUS__ = false
globalThis.__JS__ = true
globalThis.__DEV__ = true
globalThis.lynxCoreInject = {
  tt: {
    GlobalEventEmitter: {},
    _params: {
      initData: {},
      updateData: {},
    },
  },
}

globalThis.lynx = {
  __globalProps: {
    a: 1,
  },
}

class WorkletExecIdMap {
  lastExecId = 0
  execIdWorkletMap = new Map<number, any>()

  public add(worklet: any) {
    const execId = ++this.lastExecId
    this.execIdWorkletMap.set(execId, worklet)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    worklet._execId = execId
    return execId
  }

  public get(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.execIdWorkletMap.get(id)
  }

  clear() {
    this.lastExecId = 0
    this.execIdWorkletMap = new Map()
  }
}

// @ts-expect-error expected
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
lynx.lynxWorkletJsImpl = {
  _workletExecIdMap: new WorkletExecIdMap(),
}

globalThis.lynxWorkletImpl = {
  _jsFunctionLifecycleManager: {
    addRef: vi.fn(),
  },
  _eventDelayImpl: {
    runDelayedWorklet: vi.fn(),
  },
}
