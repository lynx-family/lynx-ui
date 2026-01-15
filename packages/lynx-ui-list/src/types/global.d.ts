// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

interface LynxQueryBuilder {
  select(selector: string): LynxQueryBuilder
  invoke(options: {
    method: string
    params?: unknown
    success?: (res: unknown) => void
    fail?: (err: unknown) => void
  }): LynxQueryBuilder
  exec(): void
}

interface LynxElement {
  invoke(method: string, params?: unknown): Promise<unknown>
}

interface Lynx {
  createSelectorQuery(): LynxQueryBuilder
  querySelector(selector: string): LynxElement | null
}

declare const lynx: Lynx
