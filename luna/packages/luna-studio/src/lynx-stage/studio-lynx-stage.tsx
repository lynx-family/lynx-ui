// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LunaLynxStage } from '@lynx-js/luna-stage/lynx'
import { useCallback, useMemo } from 'react'
import type { JSX } from 'react'

import type { StudioLynxStageProps } from '../types'

type LynxStageGlobalProps = Record<string, unknown>

function StudioLynxStage({
  entry,
  onLynxRuntimeCall,
  extraGlobalProps,
  ...restProps
}: StudioLynxStageProps): JSX.Element {
  const mergedGlobalProps = useMemo<LynxStageGlobalProps>(() => (
    extraGlobalProps ?? {}
  ), [extraGlobalProps])

  const handleNativeModulesCall = useCallback((
    name: string,
    data: unknown,
    channel: string,
  ) => {
    return onLynxRuntimeCall?.({
      entry,
      channel,
      name,
      data,
    })
  }, [entry, onLynxRuntimeCall])

  return (
    <LunaLynxStage
      {...restProps}
      entry={entry}
      extraGlobalProps={mergedGlobalProps}
      onNativeModulesCall={handleNativeModulesCall}
    />
  )
}

export { StudioLynxStage }
