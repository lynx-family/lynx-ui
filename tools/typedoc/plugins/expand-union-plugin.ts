// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Application, JSONOutput, Serializer } from 'typedoc'

import { expandPolymorphicUnions } from '../expand-polymorphic-unions.js'

/**
 * Hooks the polymorphic union expansion into TypeDoc serialization.
 * @param app The TypeDoc application.
 */
export function load(app: Application) {
  app.serializer.on(
    Serializer.EVENT_END,
    (event: any) => {
      const json = event.output as JSONOutput.ProjectReflection | undefined
      if (json) expandPolymorphicUnions(json)
    },
  )
}
