// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export type Subscriber<T> = (value: T) => void
export type Unsubscribe = () => void

export type ReactiveValueType =
  | 'number'
  | 'string'
  | 'boolean'
  | 'object'
  | 'array'

export interface ReactiveValueOptions {
  debug?: boolean
  label?: string
}

export interface ReactiveValueAPI<T> {
  subscribe(callback: Subscriber<T>): Unsubscribe
  unsubscribe(callback: Subscriber<T>): void
  addListener(callback: Subscriber<T>): Unsubscribe
  removeListener(callback: Subscriber<T>): void
  removeAllListeners(): void
  destroy(): void
}

export type ReactiveEventName = 'change' | 'animationstart'
