// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { BaseGesture } from '@lynx-js/gesture-runtime'
import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type {
  ScrollCoordinatorProps as NativeScrollCoordinatorProps,
  ScrollCoordinatorOffset,
} from '@lynx-js/types'

export type { ScrollCoordinatorOffset }

export interface ScrollCoordinatorRef {
  /**
   * Start the outer refresh through its native node. Requires enableRefresh.
   * onStartRefresh reports triggeredBy: 'startRefresh'. Does not control slot refresh instances.
   * @Android
   * @iOS
   */
  startRefresh: () => void
  /**
   * End the outer refresh, including after a failed request. An existing refresh
   * can still finish after enableRefresh becomes false. Does not reset list offsets.
   * @Android
   * @iOS
   */
  finishRefresh: () => void
  /**
   * Expand the header. Does not reset the nested list's own scroll position.
   * @Android
   * @iOS
   */
  scrollToTop: (
    animated: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => void
  /**
   * Collapse the header to its sticky position.
   * @Android
   * @iOS
   */
  scrollToSticky: (
    animated: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => void
  /**
   * Set the header offset. The native coordinator clamps it to the scrollable range.
   * @Android
   * @iOS
   */
  scrollTo: (
    offset: `${number}px` | `${number}rpx`,
    animated: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => void
  /**
   * Scroll to an element inside headers, measured relative to this instance's header.
   * @Android
   * @iOS
   */
  scrollIntoView: (
    id: string,
    animated: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => void
}

export interface ScrollCoordinatorUIVariants {
  /** Applied to the coordinator and outer refresh wrapper while the header is collapsed. */
  'ui-sticky'?: boolean
}

/** Native refresh options with the same callback shapes as FeedList. */
export interface ScrollCoordinatorRefreshOptions {
  /**
   * Allow pull gestures and startRefresh() to start the outer refresh.
   * Toggle this flag to preserve the mounted content and its scroll position.
   * @Android
   * @iOS
   */
  enableRefresh: boolean
  /**
   * Refresh header content. Give it a nonzero height to define the pull threshold.
   * Keep its dimensions stable while refreshing to avoid resetting the native header position.
   * @Android
   * @iOS
   */
  headerContent: ReactNode
  /**
   * Start loading data. Always call ref.finishRefresh() when the request settles.
   * Returning a Promise does not automatically end the refresh.
   * @Android
   * @iOS
   */
  onStartRefresh?: (event: { triggeredBy: 'startRefresh' | 'drag' }) => void
  /**
   * Pull offset and measured header height in px. The height is zero until layout.
   * Progress is offset / headerSize when headerSize > 0, and may exceed 1.
   * @Android
   * @iOS
   */
  onRefreshOffsetChange?: (
    event: { offset: number, headerSize: number, isDragging: boolean },
  ) => void
  /**
   * Native state: 0 idle, 1 released past the threshold, 2 refreshing.
   * Event order is platform-dependent. Use isDragging from the offset event for drag state.
   * @Android
   * @iOS
   */
  onRefreshStateChange?: (event: { state: number }) => void
  /**
   * The native header was released. Reports the latest offset and measured height in px.
   * @Android
   * @iOS
   */
  onHeaderReleased?: (event: { offset: number, headerSize: number }) => void
}

/** Coordinates a collapsible header with nested vertical lists or scroll views. */
export interface ScrollCoordinatorProps extends ComponentBasicProps {
  /**
   * Optional native coordinator ID. Imperative methods use instance-local node refs.
   * @Android
   * @iOS
   */
  id?: string
  /**
   * Collapsible header content.
   * @Android
   * @iOS
   */
  headers?: ReactNode
  /**
   * Persistent toolbar. Its height is subtracted from the header's collapse range.
   * @Android
   * @iOS
   */
  toolbar?: ReactNode
  /**
   * Content below the header, typically a vertical List, ScrollView, or ViewPager of lists.
   * @Android
   * @iOS
   */
  slot?: ReactNode
  /**
   * Configure outer native refresh. Enabled outer refresh takes precedence over refreshInSlot.
   * Providing an options object mounts the refresh wrapper, even while enableRefresh is false.
   * className and style apply to this wrapper; otherwise they apply to the native coordinator.
   * No implementation mode is required. @defaultValue false
   * @Android
   * @iOS
   */
  refreshOptions?: false | ScrollCoordinatorRefreshOptions
  /**
   * Enable bounce on supported platforms. Outer refresh always enables it unless popupOptions disables it. @defaultValue false
   * @iOS
   */
  bounces?: boolean
  /**
   * Enable vertical coordinator scrolling. @defaultValue true
   * @Android
   * @iOS
   */
  enableScroll?: boolean
  /**
   * Place the overflowing header above the slot. @defaultValue false
   * @Android
   * @iOS
   */
  headerOverSlot?: boolean
  /**
   * Use independent refresh elements inside the slot. Each nested refresh must
   * finish its own refresh through its ref; finishRefresh only affects the outer wrapper.
   * @defaultValue false
   * @Android
   * @iOS
   */
  refreshInSlot?: boolean
  /**
   * Show the coordinator scrollbar on supported platforms. @defaultValue false
   * @Android
   * @iOS
   */
  scrollBarEnable?: boolean
  /**
   * Offset event granularity as a fraction of the collapse range. Also sets the sticky threshold. @defaultValue 0.01
   * @Android
   * @iOS
   */
  granularity?: number
  /**
   * Native host popup integration for hosts that support half-to-full-screen expansion.
   * @Android
   * @iOS
   */
  popupOptions?: {
    /**
     * Name identifying the coordinator to the native popup container.
     * @Android
     * @iOS
     */
    name: string
    /**
     * Enable native popup coordination and disable bounce.
     * @Android
     * @iOS
     */
    enableHalfToFullScreen: boolean
  }
  /**
   * Participate as a nested scrolling child of a native Android container. @defaultValue false
   * @Android
   */
  scrollWithNative?: boolean
  /**
   * Native gesture attached to the coordinator.
   * @Android
   * @iOS
   */
  'main-thread:gesture'?: BaseGesture
  /**
   * Native properties passed explicitly to the coordinator. Managed properties take precedence.
   * @Android
   * @iOS
   */
  coordinatorProps?: Omit<
    NativeScrollCoordinatorProps,
    'ref' | 'children' | 'id' | 'style' | 'className'
  >
  /**
   * Header offset and total collapse range, in px.
   * @Android
   * @iOS
   */
  onOffsetChange?: (event: ScrollCoordinatorOffset) => void
  /**
   * Header offset callback on the main thread. Pass a function with the 'main thread' directive.
   * @Android
   * @iOS
   */
  'main-thread:onOffsetChange'?: (event: ScrollCoordinatorOffset) => void
  /**
   * Called once when the header reaches the sticky threshold.
   * @Android
   * @iOS
   */
  onSticky?: () => void
  /**
   * Called once when the header leaves the sticky threshold.
   * @Android
   * @iOS
   */
  onLeaveSticky?: () => void
}
