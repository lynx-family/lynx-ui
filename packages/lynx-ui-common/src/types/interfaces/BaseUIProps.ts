// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface BaseUIExposureProps {
  /**
   * exposure-scene for global exposure
   * @zh 用于全局曝光的 exposure-scene
   * @iOS
   * @Android
   * @Harmony
   */
  exposureScene?: string
  /**
   * exposure-id for global exposure
   * @zh 用于全局曝光的 exposure-id
   * @iOS
   * @Android
   * @Harmony
   */
  exposureID?: string
}
