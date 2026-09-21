// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/react/debug'
import { root, useEffect, useState } from '@lynx-js/react'

import { LunaTheme } from '../LunaTheme.js'

interface Rect {
  width: number
  height: number
}

interface ProbeResults {
  utility: Rect
  explicit: Rect
  legacy: Rect
}

const rectOptions = {
  androidEnableTransformProps: true,
  iosEnableTransformProps: true,
  harmonyEnableTransformProps: true,
}

function measureRect(id: string): Promise<Rect> {
  return new Promise((resolve, reject) => {
    const node = lynx.createSelectorQuery().select(`#${id}`)
    if (!node) {
      reject(new Error(`Unable to find #${id}`))
      return
    }

    node.invoke({
      method: 'boundingClientRect',
      params: rectOptions,
      success: (result) => {
        const { width, height } = result as Rect
        resolve({ width, height })
      },
      fail: () => reject(new Error(`Unable to measure #${id}`)),
    }).exec()
  })
}

function formatRect(rect: Rect): string {
  return `${rect.width.toFixed(2)} x ${rect.height.toFixed(2)}`
}

function TailwindTransformProbe() {
  const [transformed, setTransformed] = useState(true)
  const [results, setResults] = useState<ProbeResults | null>(null)
  const [measurementFailed, setMeasurementFailed] = useState(false)

  useEffect(() => {
    Promise.all([
      measureRect('tw-probe-utility'),
      measureRect('tw-probe-explicit'),
      measureRect('tw-probe-legacy'),
    ]).then(([utility, explicit, legacy]) => {
      setResults({ utility, explicit, legacy })
    }).catch(() => setMeasurementFailed(true))
  }, [])

  const utilityMatchesExplicit = results
    && Math.abs(results.utility.width - results.explicit.width) <= 1
    && Math.abs(results.utility.height - results.explicit.height) <= 1
  const utilityDiffersFromLegacy = results
    && Math.abs(results.utility.width - results.legacy.width) > 2

  return (
    <scroll-view
      className='size-full bg-canvas text-content'
      scroll-orientation='vertical'
    >
      <view className='self-center w-full max-w-[720px] min-h-full px-[32px] pt-[64px] pb-[48px] flex flex-col gap-[40px]'>
        <view className='flex flex-col gap-[8px]'>
          <text className='text-content text-xl font-semibold'>
            Tailwind Transform Probe
          </text>
          <text className='text-sm text-content-secondary'>
            Filled shape: utilities. Outline: explicit transform.
          </text>
        </view>

        <view className='flex flex-col gap-[20px]'>
          <text className='text-content text-base font-semibold'>
            Dual-axis skew
          </text>

          <view className='self-center w-full max-w-[560px] flex flex-col gap-[12px]'>
            <view className='flex flex-col gap-[4px]'>
              <text className='text-content text-sm font-semibold'>
                Case 1: utilities match the Tailwind v3 chain
              </text>
              <text className='text-xs text-content-secondary'>
                Fill: skew-x-12 skew-y-6
              </text>
              <text className='text-xs text-content-secondary'>
                Outline: skewX(12deg) skewY(6deg)
              </text>
              <text className='text-xs text-content-secondary'>
                Expected: exact overlap and equal bounds
              </text>
            </view>
            <view className='self-center relative w-[280px] h-[160px]'>
              <view
                id='tw-probe-utility'
                className='absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary bg-primary opacity-40 origin-top-left skew-x-12 skew-y-6'
              />
              <view
                id='tw-probe-explicit'
                className='absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary origin-top-left transform-[skewX(12deg)_skewY(6deg)]'
              />
            </view>
          </view>

          <view className='self-center w-full max-w-[560px] flex flex-col gap-[12px]'>
            <view className='flex flex-col gap-[4px]'>
              <text className='text-content text-sm font-semibold'>
                Case 2: utilities differ from the legacy shorthand
              </text>
              <text className='text-xs text-content-secondary'>
                Fill: skew-x-12 skew-y-6
              </text>
              <text className='text-xs text-content-secondary'>
                Outline: skew(12deg, 6deg)
              </text>
              <text className='text-xs text-content-secondary'>
                Expected: the legacy outline is narrower
              </text>
            </view>
            <view className='self-center relative w-[280px] h-[160px]'>
              <view className='absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary bg-primary opacity-40 origin-top-left skew-x-12 skew-y-6' />
              <view
                id='tw-probe-legacy'
                className='absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary origin-top-left transform-[skew(12deg,6deg)]'
              />
            </view>
          </view>

          <view className='self-center w-full max-w-[560px] flex flex-col gap-[4px]'>
            {results
              ? (
                <>
                  <text className='text-content text-sm'>
                    Utility: {formatRect(results.utility)}
                  </text>
                  <text className='text-content text-sm'>
                    Explicit chain: {formatRect(results.explicit)}
                  </text>
                  <text className='text-content text-sm'>
                    Legacy shorthand: {formatRect(results.legacy)}
                  </text>
                  <text className='text-content text-sm font-semibold'>
                    {utilityMatchesExplicit && utilityDiffersFromLegacy
                      ? 'PASS'
                      : 'FAIL'}
                  </text>
                </>
              )
              : (
                <text className='text-content text-sm'>
                  {measurementFailed
                    ? 'Measurement unavailable'
                    : 'Measuring...'}
                </text>
              )}
          </view>
        </view>

        <view className='self-center w-full max-w-[560px] flex flex-col gap-[20px]'>
          <view className='flex flex-col gap-[4px]'>
            <text className='text-content text-base font-semibold'>
              Mixed transform transition
            </text>
            <text className='text-xs text-content-secondary'>
              Utilities: translate-x-[16px] rotate-6 skew-x-12 skew-y-6 scale-95
            </text>
            <text className='text-xs text-content-secondary'>
              Reference: translate3d(16px, 0, 0) rotateZ(6deg) skewX(12deg)
              skewY(6deg) scale(.95, .95)
            </text>
            <text className='text-xs text-content-secondary'>
              Transition: transition-transform duration-500 ease-in-out
            </text>
            <text className='text-xs text-content-secondary'>
              Reset: transform-none
            </text>
          </view>
          <view
            className='self-start rounded-[8px] bg-primary px-[16px] py-[10px] active:opacity-80'
            bindtap={() => setTransformed(value => !value)}
          >
            <text className='text-sm text-primary-content'>
              {transformed ? 'Reset transform' : 'Apply transform'}
            </text>
          </view>

          <view className='self-center relative w-[280px] h-[160px]'>
            <view
              className={`absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary bg-primary opacity-40 origin-top-left transition-transform duration-500 ease-in-out ${
                transformed
                  ? 'translate-x-[16px] rotate-6 skew-x-12 skew-y-6 scale-95'
                  : 'transform-none'
              }`}
            />
            <view
              className={`absolute left-0 top-0 w-[240px] h-[120px] box-border border-[2px] border-primary origin-top-left transition-transform duration-500 ease-in-out ${
                transformed
                  ? 'transform-[translate3d(16px,0,0)_rotateZ(6deg)_skewX(12deg)_skewY(6deg)_scale(.95,.95)]'
                  : 'transform-none'
              }`}
            />
          </view>
        </view>
      </view>
    </scroll-view>
  )
}

export function App() {
  return (
    <LunaTheme themeKey='lunaris-light'>
      <TailwindTransformProbe />
    </LunaTheme>
  )
}

root.render(<App />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
