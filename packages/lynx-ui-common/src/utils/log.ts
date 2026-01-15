// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const log = (showLog: boolean, ...data: unknown[]): void => {
  if (showLog) {
    console.info(...data)
  }
}

export const mtsLog = (showLog: boolean, ...data: unknown[]): void => {
  'main thread'
  if (showLog) {
    console.info(...data)
  }
}
