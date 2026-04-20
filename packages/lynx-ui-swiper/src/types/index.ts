// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties, MainThread } from '@lynx-js/types'

import type {
  BounceConfig,
  SwipeToOptions,
  SwiperPropsReal as SwiperProps,
  SwiperRef,
  onBounceParams,
} from './index.docs'

export interface SwiperContextProps extends
  Pick<
    SwiperProps<unknown>,
    'itemWidth' | 'itemHeight' | 'customAnimationFirstScreen' | 'RTL'
  >,
  Required<Pick<SwiperProps<unknown>, 'initialIndex' | 'loop'>>
{
  setChildrenRef: (ref: MainThread.Element, index: number) => void
  spaceBetween: number
  modeConfig: CompoundModeConfig
}

export interface CompoundNormalModeConfig {
  mode: 'normal'
  align: 'start' | 'center' | 'end'
}

export interface CompoundCustomModeConfig {
  mode: 'custom'
}

export type CompoundModeConfig =
  | CompoundNormalModeConfig
  | CompoundCustomModeConfig

export type customAnimation = (
  progress: number,
  props: SwiperProps<unknown>,
) => CSSProperties

export interface CustomTouch {
  identifier: number
  pageX: number
  pageY: number
  clientX: number
  clientY: number
  x: number
  y: number
}

/**
 * Rewrite forwardRef to make it supports generic
 * see: https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref
 */
declare module 'react' {
  // biome-ignore lint/complexity/noBannedTypes: Expected
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
  ): (props: P & React.RefAttributes<T>) => React.ReactElement | null
}

declare module '@lynx-js/types' {
  interface GlobalProps {
    screenWidth: number
  }
}

export interface ResetOptions {
  fullReset?: boolean
  resetIndex?: number
}

export interface UpdateSwiperInnerContainerOptions {
  itemWidth: number
  loopDuplicateCount: number
  loop: boolean
  dataCount: number
  spaceBetween: number
  itemHeight: SwiperProps<unknown>['itemHeight']
  mode: CompoundModeConfig['mode']
}

export enum SwipeDirection {
  NORMAL = -1,
  NONE = 0,
  REVERT = 1,
}

export interface OffsetLimitResult {
  startLimit: number
  endLimit: number
  isNotEnoughForScreen: boolean
}

export type {
  BounceConfig,
  SwiperRef,
  onBounceParams,
  SwipeToOptions,
  SwiperProps,
}
