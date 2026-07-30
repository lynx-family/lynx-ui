// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaThemeKey, LunaThemeVariant } from '@lynx-js/luna-core'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import {
  CONTAINER_STYLE,
  DEFAULT_GROUP_ID,
  LYNX_VIEW_STYLE_INTERACTIVE,
  LYNX_VIEW_STYLE_NON_INTERACTIVE,
} from './lynx-stage-constants'
import type { UseLynxStageOptions } from './types'
import { useLynxStage } from './use-lynx-stage'
import { useIsClient } from '../hooks'
import type { LynxGlobalProps } from '../types/lynx-view'

export type LunaLynxStageProps =
  & Omit<UseLynxStageOptions, 'globalProps' | 'bundleRoot'>
  & {
    /** LUNA theme key, e.g. `'luna-light'`, `'lunaris-dark'`. */
    lunaTheme?: LunaThemeKey
    /**
     * Additional global props to inject alongside LUNA theme props.
     * Merged with the LUNA props — LUNA props take precedence on key conflicts.
     */
    extraGlobalProps?: LynxGlobalProps
    /**
     * Resource root used together with `entry` to locate the Lynx bundle.
     * The default resolver normalizes a trailing slash and builds
     * `${bundleRoot}${entry}.web.bundle`.
     * @defaultValue '/'
     */
    bundleRoot?: string
    /**
     * Shared Lynx worker group ID. Defaults to 7.
     * Override to isolate workers between unrelated view groups.
     */
    groupId?: number
    /**
     * Enables pointer interactions on the underlying `<lynx-view>` host element.
     * @defaultValue true
     */
    interactive?: boolean
  }

function LunaLynxStageImpl({
  lunaTheme = 'luna-light',
  extraGlobalProps,
  groupId = DEFAULT_GROUP_ID,
  bundleRoot = '/',
  interactive = true,
  ...stageOptions
}: LunaLynxStageProps): ReactNode {
  const globalProps = useMemo<LynxGlobalProps>(() => {
    const resolvedThemeVariant = lunaTheme.split('-')[0] as LunaThemeVariant

    return {
      ...(extraGlobalProps ?? {}),
      lunaTheme,
      lunaThemeVariant: resolvedThemeVariant,
    }
  }, [extraGlobalProps, lunaTheme])

  const { lynxViewRef, containerRef, src, ready } = useLynxStage({
    ...stageOptions,
    globalProps,
    bundleRoot,
  })

  return (
    <div ref={containerRef} style={CONTAINER_STYLE}>
      {ready && (
        <lynx-view
          key={src}
          ref={lynxViewRef}
          url={src}
          style={interactive
            ? LYNX_VIEW_STYLE_INTERACTIVE
            : LYNX_VIEW_STYLE_NON_INTERACTIVE}
          lynx-group-id={groupId}
          transform-vh={true}
          transform-vw={true}
        />
      )}
    </div>
  )
}

export function LunaLynxStage(props: LunaLynxStageProps): ReactNode {
  const isClient = useIsClient()

  if (!isClient) {
    return null
  }

  return <LunaLynxStageImpl {...props} />
}
