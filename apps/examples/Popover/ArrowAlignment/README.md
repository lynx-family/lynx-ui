# Arrow alignment

Compare corner clearance and positioning parents for a custom 32 × 11 arrow.
The example uses a generic curved SVG with a contrasting fill so gaps are
visible on a native device.

## Run

From the repository root:

```sh
pnpm --filter @lynx-example/lynx-ui-popover exec rspeedy dev --environment lynx
```

Open `PopoverArrowAlignment.lynx.bundle?fullscreen=true` from the development
server in LynxExplorer or another native Lynx host.

## Compare the cases

The initial configuration uses rectangular arrow positioning: **Size: 32 × 11**,
**Padding: R (8px)**, **Radius: 8px**, and **Placement: bottom-start**.

- **Rounded corner:** a 16px anchor opens a 216px bubble. Switch Size to
  **11 (legacy)** and Padding to **0px** to reproduce the corner intrusion.
  Return to **32 × 11** and **Padding: R** to use the real arrow dimensions
  and the selected radius. Radius switches between 8px and 16px.
- **Size: 32 (legacy):** the artwork is still 32 × 11, but the positioning
  box and protrusion are 32px. This intentionally demonstrates why increasing
  a numeric size alone leaves a gap between the artwork and the bubble.
- **Padding:** cycles between the selected radius, 0px, 16px, and 27px.
  A correctly sized rectangle with zero padding can still touch a corner.
- **Narrow wrapper:** a centered inner wrapper is smaller than the bubble.
  Switch the arrow parent between the wrapper and the bubble, and compare all
  four placements. A nested arrow uses the wrong coordinate origin even with
  the correct size.
- **Matching wrapper:** the inner wrapper matches the bubble dimensions.
  This is the control case: both parents have the same origin. Use it to
  compare all four placements with Size: 32 × 11.
- **Reopen:** remount the current configuration and repeat its measurements.

Each control change remounts the popover for fresh measurements.

## Size contract

For a custom arrow, `size={{ width: 32, height: 11 }}` describes its
**original, downward-pointing artwork**. Width is the base; height is the
protrusion. Keep this object the same for every placement:

| Placement | Positioned box | Protrusion | Base used for corner clearance |
| --- | --- | --- | --- |
| top / bottom | 32 × 11 | 11px | 32px |
| left / right | 11 × 32 | 11px | 32px |

The component rotates the artwork inside the positioned box. Size the custom
child to 32 × 11 and do not rotate it again. `placementOffset` remains the gap
between the anchor and the arrow tip; the bubble is another 11px away.

Numeric sizes retain their existing behavior. `size={11}` still uses an
11 × 11 box and an 11px protrusion. A 32px child then extends 10.5px beyond
each horizontal side; this is useful as a regression comparison, not the
recommended integration. Without custom children, object sizes retain the
legacy default triangle behavior, using the larger dimension.

## Custom arrow composition

Pass the original artwork dimensions to `PopoverArrow` and keep it a direct
child of `PopoverContent`. Place any content wrappers beside the arrow so
its coordinates remain relative to the bubble.

`offset` adjusts the arrow's positioning along the bubble edge. For rounded
bubbles, it can also keep the arrow clear of the corners. This example uses
the larger radius of the two adjacent corners, expressed in layout pixels.

```tsx
<PopoverContent style={{ borderRadius: `${radius}px` }}>
  <view>{children}</view>
  <PopoverArrow size={{ width: 32, height: 11 }} offset={radius}>
    <svg className='arrow-artwork' content={downwardArrowSvg} overlap={false} />
  </PopoverArrow>
</PopoverContent>
```

Set `.arrow-artwork` to 32px wide and 11px high to match the input dimensions.

For unequal corner radii, bottom placement uses the top two corners, top
uses the bottom two, left uses the right two, and right uses the left two.
The component does not read or modify the bubble's radius.

## Limits and compatibility checks

A bubble edge shorter than `base + leadingRadius + trailingRadius` cannot
contain the full arrow between both corners. The positioning middleware may
reduce padding for a small bubble; viewport constraints can also limit anchor
alignment. The caller chooses a fallback, such as hiding the arrow while
keeping the bubble and its radii. This change does not automatically hide
arrows or resize corners.

Verify centered/start/end placements, small anchors, 8px/16px/custom radii,
viewport edges, narrow bubbles, and enter/exit animations on Android and iOS.
Existing custom object sizes now use their documented rectangular geometry;
review callers that relied on the former maximum-dimension square. Numeric
sizes and default triangles retain their previous geometry.
