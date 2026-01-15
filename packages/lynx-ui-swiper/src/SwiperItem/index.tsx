// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  memo,
  runOnMainThread,
  useContext,
  useEffect,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { ReactElement, RefObject } from '@lynx-js/react'

import type { CSSProperties, MainThread } from '@lynx-js/types'

import { SwiperContext } from '../store'
import type { CompoundModeConfig, SwiperContextProps } from '../types'

export interface SwiperItemProps {
  /**
   * Index of current SwiperItem, out of Swiper's data.
   * @Android
   * @iOS
   * @Harmony
   */
  index: number
  /**
   * Children of SwiperItem
   * @Android
   * @iOS
   * @Harmony
   */
  children: ReactElement | ReactElement[]
  /**
   * Style of SwiperItem
   * @Android
   * @iOS
   * @Harmony
   */
  style?: CSSProperties
  /**
   * Real index of current SwiperItem, out of Swiper's data.
   * Same with `index`, but will be different from `index` when in loop mode.
   * @Android
   * @iOS
   * @Harmony
   */
  realIndex?: number
  /**
   * `overlap` attribute passed to SwiperItem's direct child.
   * This property is used only when opacity has issues.
   * Refer to {@link https://lynxjs.org/en/api/css/properties/opacity#opacity}
   * @Android
   * @iOS
   * @Harmony
   */
  overlap?: boolean
}

interface IFirstScreenStyle extends
  Pick<
    SwiperContextProps,
    | 'itemWidth'
    | 'itemHeight'
    | 'initialIndex'
    | 'customAnimationFirstScreen'
    | 'RTL'
  >
{
  itemRef: RefObject<MainThread.Element | undefined>
  spaceBetween: number
  realIndex: number
  modeConfig: CompoundModeConfig
}

function useFirstScreenStyle(props: IFirstScreenStyle) {
  const {
    itemWidth,
    spaceBetween,
    itemHeight,
    itemRef,
    customAnimationFirstScreen,
    realIndex,
    modeConfig,
    initialIndex,
    RTL,
  } = props

  const containerStyle = useMemo(() => {
    if (modeConfig.mode === 'normal') {
      let style: CSSProperties = {
        width: `${itemWidth}px`,
        height: `${itemHeight}px`,
        [RTL === true ? 'marginLeft' : 'marginRight']: `${spaceBetween}px`,
      }
      if (customAnimationFirstScreen) {
        const customStyle = customAnimationFirstScreen(
          -initialIndex + realIndex,
          realIndex,
        )
        style = {
          ...style,
          ...customStyle,
        }
      }

      return style
    } else if (modeConfig.mode === 'custom') {
      let style: CSSProperties = {
        width: `${itemWidth}px`,
        height: `${itemHeight}px`,
        position: 'absolute',
      }
      if (customAnimationFirstScreen) {
        const customStyle = customAnimationFirstScreen(
          -initialIndex + realIndex,
          realIndex,
        )
        style = {
          ...style,
          ...customStyle,
        }
      }

      return style
    }
  }, [])

  function updateMainThreadR(propsFromJS: {
    itemWidth: number
    itemHeight: SwiperContextProps['itemHeight']
    spaceBetween: number
  }) {
    'main thread'
    if (itemRef.current) {
      itemRef.current.setStyleProperties({
        width: `${propsFromJS.itemWidth}px`,
        height: `${propsFromJS.itemHeight}px`,
        marginInlineEnd: `${propsFromJS.spaceBetween}px`,
      })
    }
  }

  useEffect(() => {
    runOnMainThread(updateMainThreadR)({
      itemWidth,
      itemHeight,
      spaceBetween,
    })
  }, [itemWidth, itemHeight, spaceBetween])

  return {
    containerStyle,
  }
}

const SwiperItem = (
  { index, realIndex = index, children, overlap }: SwiperItemProps,
) => {
  const {
    itemWidth,
    itemHeight,
    setChildrenRef,
    modeConfig,
    customAnimationFirstScreen,
    initialIndex = 0,
    spaceBetween,
    RTL,
  } = useContext(SwiperContext)
  const swiperItemRef = useMainThreadRef<MainThread.Element>()

  const { containerStyle } = useFirstScreenStyle({
    itemWidth,
    itemHeight,
    spaceBetween,
    itemRef: swiperItemRef,
    modeConfig,
    realIndex,
    initialIndex,
    customAnimationFirstScreen,
    RTL,
  })

  function setRef(ref: MainThread.Element) {
    'main thread'
    swiperItemRef.current = ref
    setChildrenRef(ref, realIndex ?? index)
  }

  return (
    <view
      class='swiper-item'
      style={containerStyle}
      main-thread:ref={setRef}
      overlap={overlap}
    >
      {children}
    </view>
  )
}

const MemoSwiperItem = memo(SwiperItem) as typeof SwiperItem

export { MemoSwiperItem as SwiperItem }
