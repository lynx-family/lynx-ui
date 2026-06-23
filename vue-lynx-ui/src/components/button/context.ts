// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { inject, provide } from 'vue-lynx'
import type { InjectionKey, Ref } from 'vue-lynx'

/**
 * The interactive status shared from a Button to its descendants.
 *
 * Mirrors ReactLynx's `ButtonContext` ({ active, disabled }). Because Vue's
 * reactivity is ref-based, the context carries `Ref`s instead of plain values
 * so descendants stay reactive without re-rendering the whole subtree.
 * @zh 对齐 ReactLynx 的 `ButtonContext`，用 Ref 承载响应式状态。
 */
export interface ButtonContextValue {
  active: Ref<boolean>
  disabled: Ref<boolean>
}

const ButtonContextKey: InjectionKey<ButtonContextValue> = Symbol('ButtonContext')

/**
 * Provide the Button context to descendants. Called by `Button.vue`.
 * Mirrors `<ButtonContext.Provider>`.
 */
export const provideButtonContext = (value: ButtonContextValue): void => {
  provide(ButtonContextKey, value)
}

/**
 * Read the nearest Button context. Mirrors `useButtonContext()`.
 *
 * Falls back to a non-active, non-disabled default when used outside a Button,
 * matching the React `createContext` default value.
 */
export const useButtonContext = (): ButtonContextValue => {
  const fallback: ButtonContextValue = {
    active: { value: false } as Ref<boolean>,
    disabled: { value: false } as Ref<boolean>,
  }
  return inject(ButtonContextKey, fallback)
}
