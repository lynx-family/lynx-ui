// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { renderContentWithExtraProps } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { clsx } from 'clsx'

import { DialogContext } from './DialogContext'
import type { DialogTriggerProps } from './types'

export const resolveBusyState = (state: PresenceState) => {
  switch (state) {
    case PresenceState.Entering:
    case PresenceState.DelayedEntering:
    case PresenceState.Leaving:
      return true
    default:
      return false
  }
}

export function DialogButton(
  props: DialogTriggerProps & { changeShow: boolean },
) {
  const { children, disabled = false, style, className, changeShow } = props
  const { setUncontrolledShow, groupState, onShowChange } = useContext(
    DialogContext,
  )
  const busy = resolveBusyState(groupState)
  const renderedContent = renderContentWithExtraProps<{ busy: boolean }>({
    busy,
  }, children)
  const actualDisabled = busy || disabled

  const handleClick = () => {
    onShowChange?.(changeShow)
    setUncontrolledShow(changeShow)
  }

  return (
    <Button
      style={style}
      className={clsx(className, {
        'ui-busy': busy,
      })}
      disabled={actualDisabled}
      onClick={handleClick}
    >
      {renderedContent}
    </Button>
  )
}
