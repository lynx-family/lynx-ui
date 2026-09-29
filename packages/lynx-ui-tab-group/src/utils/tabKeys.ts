// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function findUniqueTabIndex(
  tabKeys: readonly string[],
  tabKey: string,
): number | undefined {
  const index = tabKeys.indexOf(tabKey)
  if (index < 0 || index !== tabKeys.lastIndexOf(tabKey)) {
    return undefined
  }
  return index
}

export function getUniqueTabKey(
  tabKeys: readonly string[],
  index: number,
): string | undefined {
  const tabKey = tabKeys[index]
  if (tabKey === undefined || findUniqueTabIndex(tabKeys, tabKey) !== index) {
    return undefined
  }
  return tabKey
}
