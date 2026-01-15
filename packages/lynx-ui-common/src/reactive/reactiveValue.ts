// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  ReactiveValueAPI,
  ReactiveValueOptions,
  Subscriber,
  Unsubscribe,
} from './types'

export type ReactiveValue<T> = ReturnType<
  typeof createMainThreadReactiveValue<T>
>

export function createMainThreadReactiveValue<T>(
  initialValue: T,
  options: ReactiveValueOptions = {},
) {
  'main thread'
  class ReactiveValue<T> implements ReactiveValueAPI<T> {
    _value: T
    _subscribers = new Set<Subscriber<T>>()
    _options: ReactiveValueOptions
    _isDestroyed = false

    constructor(initialValue: T, options: ReactiveValueOptions = {}) {
      this._value = initialValue
      this._options = options
    }

    get value(): T {
      return this._value
    }

    set value(newValue: T) {
      if (this._isDestroyed) return

      if (this._value !== newValue) {
        this._value = newValue
        this._notifySubscribers()
      }
    }

    get(): T {
      return this._value
    }

    set(newValue: T): void {
      this.value = newValue
    }

    subscribe(callback: Subscriber<T>): Unsubscribe {
      // biome-ignore lint/suspicious/noEmptyBlockStatements: As expected
      if (this._isDestroyed) return () => {}

      this._subscribers.add(callback)

      // Call immediately with current value
      callback(this._value)

      return () => this.unsubscribe(callback)
    }

    unsubscribe(callback: Subscriber<T>): void {
      this._subscribers.delete(callback)
    }

    addListener(callback: Subscriber<T>): Unsubscribe {
      return this.subscribe(callback)
    }

    removeListener(callback: Subscriber<T>): void {
      this.unsubscribe(callback)
    }

    removeAllListeners(): void {
      this._subscribers.clear()
    }

    destroy(): void {
      this._isDestroyed = true
      this._subscribers.clear()
    }

    _notifySubscribers(): void {
      if (this._isDestroyed) return

      for (const subscriber of this._subscribers) {
        try {
          subscriber(this._value)
        } catch (error) {
          if (this._options.debug) {
            console.error(
              `[ReactiveValue${
                this._options.label ? ` ${this._options.label}` : ''
              }]: Error in subscriber:`,
              error,
            )
          }
        }
      }
    }
  }
  return new ReactiveValue(initialValue, options)
}
