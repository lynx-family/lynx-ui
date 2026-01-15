// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function lynxSDKVersionStringToNumber(lynxSDKVersion: string): number {
  const ver: string[] = lynxSDKVersion.split('.')
  const major: number = Number(ver[0] ? ver[0] : 0) * 10000
  const minor: number = Number(ver[1] ? ver[1] : 0) * 100
  const patch = Number(ver[2] ? ver[2] : 0)
  return major + minor + patch
}

export function mtsLynxSDKVersionStringToNumber(
  lynxSDKVersion: string,
): number {
  'main thread'
  const ver: string[] = lynxSDKVersion.split('.')
  const major: number = Number(ver[0] ? ver[0] : 0) * 10000
  const minor: number = Number(ver[1] ? ver[1] : 0) * 100
  const patch = Number(ver[2] ? ver[2] : 0)
  return major + minor + patch
}

export function nativeLynxSDKVersionGreaterThan(
  lynxSDKVersion: string,
): boolean {
  return (
    lynxSDKVersionStringToNumber(SystemInfo.lynxSdkVersion)
      > lynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}

export function nativeLynxSDKVersionLessThan(lynxSDKVersion: string): boolean {
  return (
    lynxSDKVersionStringToNumber(SystemInfo.lynxSdkVersion)
      < lynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}

export function mtsNativeLynxSDKVersionLessThan(
  lynxSDKVersion: string,
): boolean {
  'main thread'
  return (
    mtsLynxSDKVersionStringToNumber(
      SystemInfo.engineVersion ?? SystemInfo.lynxSdkVersion,
    )
      < mtsLynxSDKVersionStringToNumber(lynxSDKVersion)
  )
}
