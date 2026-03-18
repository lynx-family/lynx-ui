// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Ambient module declarations for static assets imported in library code.
// This mirrors what @rsbuild/core/types provides for rspeedy apps.

/** Side-effect CSS import */
declare module '*.css' {}
/** Side-effect SCSS import */
declare module '*.scss' {}
/** Side-effect Less import */
declare module '*.less' {}

/** SVG imported as URL string */
declare module '*.svg' {
  const src: string
  export default src
}

/** Image assets */
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.jpeg' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}
declare module '*.gif' {
  const src: string
  export default src
}
