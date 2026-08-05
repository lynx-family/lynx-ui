// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

type ComponentDefInput<ID extends string = string> =
  | string
  | { id: ID, name?: string }
  | { id: ID, name?: string, demoReady: true }
  | { id: ID, name?: string, demoReady: false }

interface ComponentDef<
  ID extends string = string,
  Ready extends boolean = boolean,
> {
  /** Stable identifier (prefer kebab-case) */
  id: ID
  /** Optional display name for UI or docs */
  name: string
  /** Whether the component is demo-ready */
  demoReady: Ready
}

type ReadyOf<T extends readonly ComponentDef[]> = Extract<
  T[number],
  { demoReady: true }
>
type ReadyIdOf<T extends readonly ComponentDef[]> = ReadyOf<T>['id']

interface Registry<T extends readonly ComponentDef[]> {
  readonly list: T
  readonly ids: { [K in keyof T]: T[K]['id'] }
  readonly names: readonly string[]
  readonly ready: readonly ReadyOf<T>[]
  readonly readyIds: readonly ReadyIdOf<T>[]
  readonly isId: (x: unknown) => x is T[number]['id']
  readonly getMeta: <K extends T[number]['id']>(
    id: K,
  ) => Extract<T[number], { id: K }> | undefined
  readonly [Symbol.toStringTag]: {
    _id: T[number]['id']
    _def: T[number]
  }
}

/** Extract the union of component IDs from a registry instance */
type RegistryIds<R> = R extends
  { readonly [Symbol.toStringTag]: { _id: infer I } } ? I : never

/** Extract the component definition type from a registry instance */
type RegistryDef<R> = R extends
  { readonly [Symbol.toStringTag]: { _def: infer D } } ? D : never

/** Extract the id type from a string | ComponentDefInput union */
type ExtractId<T> = T extends string ? T
  : T extends { id: infer I extends string } ? I
  : never

type NormalizedItem<T> = T extends string ? ComponentDef<T, false>
  : T extends { id: infer ID extends string, demoReady: true }
    ? ComponentDef<ID, true>
  : T extends { id: infer ID extends string, demoReady: false }
    ? ComponentDef<ID, false>
  : T extends { id: infer ID extends string } ? ComponentDef<ID, false>
  : never

type NormalizedTuple<T extends readonly (string | ComponentDefInput)[]> = {
  readonly [K in keyof T]: T[K] extends string ? ComponentDef<T[K], false>
    : T[K] extends { id: infer I extends string, demoReady: true }
      ? ComponentDef<I, true>
    : T[K] extends { id: infer I extends string, demoReady: false }
      ? ComponentDef<I, false>
    : T[K] extends { id: infer I extends string } ? ComponentDef<I, false>
    : never
}

export type {
  ComponentDef,
  ComponentDefInput,
  ExtractId,
  NormalizedItem,
  NormalizedTuple,
  ReadyOf,
  ReadyIdOf,
  Registry,
  RegistryIds,
  RegistryDef,
}
