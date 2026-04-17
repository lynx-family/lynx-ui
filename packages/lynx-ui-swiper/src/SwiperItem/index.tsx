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

import './styles.css'

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
    | 'enableFixedSpaceBetween'
  >
{
  itemRef: RefObject<MainThread.Element | undefined>
  itemLeftRef: RefObject<MainThread.Element | undefined>
  itemRightRef: RefObject<MainThread.Element | undefined>
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
    enableFixedSpaceBetween,
    itemLeftRef,
    itemRightRef,
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
    enableFixedSpaceBetween: boolean
  }) {
    'main thread'
    if (!propsFromJS.enableFixedSpaceBetween) {
      if (itemRef.current) {
        itemRef.current.setStyleProperties({
          width: `${propsFromJS.itemWidth}px`,
          height: `${propsFromJS.itemHeight}px`,
          marginInlineEnd: `${propsFromJS.spaceBetween}px`,
        })
      }
      return
    }

    if (itemRef.current) {
      itemRef.current.setStyleProperties({
        width: `${propsFromJS.itemWidth}px`,
        height: `${propsFromJS.itemHeight}px`,
      })
    }

    if (itemLeftRef.current) {
      itemLeftRef.current.setStyleProperties({
        width: `${propsFromJS.spaceBetween}px`,
      })
    }

    if (itemRightRef.current) {
      itemRightRef.current.setStyleProperties({
        width: `${propsFromJS.spaceBetween}px`,
      })
    }
  }

  useEffect(() => {
    runOnMainThread(updateMainThreadR)({
      itemWidth,
      itemHeight,
      spaceBetween,
      enableFixedSpaceBetween,
    })
  }, [itemWidth, itemHeight, spaceBetween, enableFixedSpaceBetween])

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
    enableFixedSpaceBetween = false,
    RTL,
  } = useContext(SwiperContext)
  const swiperItemRef = useMainThreadRef<MainThread.Element>()
  const swiperItemLeftRef = useMainThreadRef<MainThread.Element>()
  const swiperItemRightRef = useMainThreadRef<MainThread.Element>()

  const { containerStyle } = useFirstScreenStyle({
    itemWidth,
    itemHeight,
    spaceBetween,
    enableFixedSpaceBetween,
    itemRef: swiperItemRef,
    itemLeftRef: swiperItemLeftRef,
    itemRightRef: swiperItemRightRef,
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

  function setLeftRef(ref: MainThread.Element) {
    'main thread'
    swiperItemLeftRef.current = ref
  }

  function setRightRef(ref: MainThread.Element) {
    'main thread'
    swiperItemRightRef.current = ref
  }

  const { marginLeft, marginRight, ...restContainerStyle } = containerStyle ?? {}

  if (!enableFixedSpaceBetween) {
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

  return (
    <view class='swiper-item-container'>
      {marginLeft
        ? (
          <view
            class='swiper-item-left'
            style={{ width: marginLeft }}
            main-thread:ref={setLeftRef}
            overlap={overlap}
          />
        )
        : null}
      <view
        class='swiper-item'
        style={restContainerStyle}
        main-thread:ref={setRef}
        overlap={overlap}
      >
        {children}
      </view>
      {marginRight
        ? (
          <view
            class='swiper-item-right'
            style={{ width: marginRight }}
            main-thread:ref={setRightRef}
            overlap={overlap}
          />
        )
        : null}
    </view>
  )
}

const MemoSwiperItem = memo(SwiperItem) as typeof SwiperItem

export { MemoSwiperItem as SwiperItem }
