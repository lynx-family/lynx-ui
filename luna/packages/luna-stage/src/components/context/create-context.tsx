// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

/**
 * Creates a Context with an auto-generated Provider and Hook.
 * @param contextName - The Context name, used in error messages.
 * @param defaultValue - The default value (optional).
 * @returns A tuple containing [Provider, useContext].
 *
 * @example
 * ```tsx
 * // Define the type.
 * interface UserContextType {
 *   user: { id: string; name: string } | null;
 *   setUser: (user: { id: string; name: string } | null) => void;
 * }
 *
 * // Create the Context.
 * const [UserProvider, useUser] = createContextWithProvider<UserContextType>('User');
 *
 * // Use the Context in an application.
 * function App() {
 *   const [user, setUser] = useState(null);
 *
 *   return (
 *     <UserProvider user={user} setUser={setUser}>
 *       <UserProfile />
 *     </UserProvider>
 *   );
 * }
 *
 * function UserProfile() {
 *   const { user, setUser } = useUser();
 *   // ...
 * }
 * ```
 */
function createContextWithProvider<T extends object | null>(
  contextName: string,
  defaultValue: T,
  options?: { throwIfMissing?: true },
): readonly [(p: T & { children: ReactNode }) => JSX.Element, () => T]

function createContextWithProvider<T extends object | null>(
  contextName: string,
  defaultValue: undefined,
  options: { throwIfMissing: false },
): readonly [
  (p: T & { children: ReactNode }) => JSX.Element,
  () => T | undefined,
]

function createContextWithProvider<T extends object | null>(
  contextName: string,
  defaultValue?: undefined,
  options?: { throwIfMissing?: true },
): readonly [(p: T & { children: ReactNode }) => JSX.Element, () => T]

function createContextWithProvider<
  T extends object | null,
>(
  contextName: string,
  defaultValue?: T,
  options?: { throwIfMissing?: boolean },
) {
  const { throwIfMissing = true } = options ?? {}

  const Context = createContext<T | undefined>(defaultValue)

  // Generates a clearer displayName for the Provider and Hook.
  Context.displayName = `${contextName}Context`

  const Provider = (
    props: T & { children: ReactNode },
  ) => {
    const { children, ...context } = props

    // Uses JSON.stringify to ensure dependency array stability.
    // biome-ignore lint/correctness/useExhaustiveDependencies: context values intentionally form the memo key.
    const memoizedValue = useMemo(
      () => context,
      Object.values(context),
    ) as T

    return (
      <Context.Provider value={memoizedValue}>
        {children}
      </Context.Provider>
    )
  }

  // Sets the displayName of the Provider for easier debugging.
  Provider.displayName = `${contextName}Provider`

  function useContextValue(): T {
    const context = useContext(Context)
    if (context) return context
    if (defaultValue) return defaultValue

    if (throwIfMissing) {
      throw new Error(
        `use${contextName} must be used within a ${contextName}Provider.`,
      )
    }

    return undefined as unknown as T
  }

  // Sets the name of the Hook function.
  Object.defineProperty(useContextValue, 'name', {
    value: `use${contextName}`,
    configurable: true,
  })

  return [Provider, useContextValue] as const
}

export { createContextWithProvider }
