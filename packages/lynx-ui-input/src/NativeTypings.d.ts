// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface InputFocusEvent {
  /**
   * Input content
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  value: string
}

export interface InputBlurEvent {
  /**
   * Input content
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  value: string
}

export interface InputConfirmEvent {
  /**
   * Input content
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  value: string
}

export interface InputInputEvent {
  /**
   * Input content
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  value: string
  /**
   * The start position of the selection
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  selectionStart: number
  /**
   * The end position of the selection
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  selectionEnd: number
  /**
   * Is composing or not
   * @iOS
   * @Android
   * @Harmony
   * @Web
   * @since 3.4
   */
  isComposing: boolean
}

export interface InputSelectionEvent {
  /**
   * The start position of the selection
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  selectionStart: number
  /**
   * The end position of the selection
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.4
   */
  selectionEnd: number
}
