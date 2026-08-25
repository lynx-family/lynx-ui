// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaThemeTokens } from '@lynx-js/luna-core'
import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { colorTokenIds } from '../../data/tokens'

interface TokenComparisonTableProps {
  leftTheme: LunaThemeTokens
  rightTheme: LunaThemeTokens
}

function TokenComparisonTable({
  leftTheme,
  rightTheme,
}: TokenComparisonTableProps) {
  return (
    <div className='scrollbar-subtle overflow-x-auto border border-line'>
      <div className='min-w-[720px]'>
        <div className='grid grid-cols-[minmax(11rem,1fr)_minmax(15rem,1fr)_minmax(15rem,1fr)] border-b border-line bg-paper-clear'>
          <div className='px-4 py-3 text-sm text-content-muted'>Token</div>
          <ThemeColumnHeading themeKey={leftTheme.key} />
          <ThemeColumnHeading themeKey={rightTheme.key} />
        </div>

        {colorTokenIds.map(tokenId => (
          <div
            className='grid grid-cols-[minmax(11rem,1fr)_minmax(15rem,1fr)_minmax(15rem,1fr)] border-b border-line last:border-b-0'
            key={tokenId}
          >
            <div className='flex items-center px-4 py-3 font-mono text-sm'>
              --{tokenId}
            </div>
            <TokenValue value={leftTheme.colors[tokenId]} />
            <TokenValue value={rightTheme.colors[tokenId]} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ThemeColumnHeading({ themeKey }: { themeKey: string }) {
  return (
    <div className='border-l border-line px-4 py-3 text-sm'>{themeKey}</div>
  )
}

function TokenValue({ value }: { value: string }) {
  const [copyStatus, setCopyStatus] = useState<
    'copied' | 'failed' | 'idle'
  >('idle')

  useEffect(() => {
    if (copyStatus === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus('idle')
    }, 1500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copyStatus])

  async function copyValue() {
    try {
      await window.navigator.clipboard.writeText(value)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const copyLabel = getCopyLabel(copyStatus, value)

  return (
    <div className='flex items-center gap-3 border-l border-line px-4 py-3'>
      <button
        aria-label={copyLabel}
        className='group relative size-7 shrink-0 border border-line p-0 transition-transform hover:scale-110 hover:border-content focus-visible:border-content focus-visible:outline focus-visible:outline-1 focus-visible:outline-content focus-visible:outline-offset-2'
        onClick={() => {
          void copyValue()
        }}
        style={{ backgroundColor: value }}
        title={copyLabel}
      >
        <Copy
          aria-hidden
          className='absolute inset-0 m-auto text-content-muted opacity-0 transition-opacity group-hover:opacity-80'
          size={15}
          strokeWidth={2}
        />
      </button>
      <code className='text-sm text-content-muted'>{value}</code>
      {copyStatus === 'copied'
        ? (
          <span
            aria-live='polite'
            className='inline-flex items-center gap-1 text-xs text-content'
          >
            <Check aria-hidden size={14} strokeWidth={2} />
            Copied
          </span>
        )
        : null}
      {copyStatus === 'failed'
        ? (
          <span aria-live='polite' className='text-xs text-content'>
            Copy failed
          </span>
        )
        : null}
    </div>
  )
}

function getCopyLabel(
  copyStatus: 'copied' | 'failed' | 'idle',
  value: string,
) {
  if (copyStatus === 'copied') {
    return 'Copied'
  }
  if (copyStatus === 'failed') {
    return 'Copy failed'
  }

  return `Copy ${value}`
}

export { TokenComparisonTable }
