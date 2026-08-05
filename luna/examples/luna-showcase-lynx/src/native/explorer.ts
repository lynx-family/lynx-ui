// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const Explorer = NativeModules?.ExplorerModule ?? {}

function explorerRead(key: string, fallback: string | null): string | null {
  try {
    if (typeof Explorer.readFromLocalStorage === 'function') {
      return Explorer.readFromLocalStorage(key)
    }
  } catch {
    return fallback
  }
  return fallback
}

function explorerSave(key: string, value: string): boolean {
  try {
    if (typeof Explorer.saveToLocalStorage === 'function') {
      Explorer.saveToLocalStorage(key, value)
      return true
    }
  } catch {
    return false
  }
  return false
}

export { explorerRead, explorerSave }
