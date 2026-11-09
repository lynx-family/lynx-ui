# Sheet Examples

This directory contains examples for the Sheet component.

## Examples

- **Basic**: Basic usage of Sheet.
- **Controlled**: Controlled usage of Sheet.
- **Directional**: Top, bottom, physical sides, and logical sides with `enableRTL`.
- **ControlledOpen**: Controlled usage of Sheet with initial open state.
- **DefaultOpen**: Uncontrolled Sheet with `defaultShow` enabled.
- **Imperative**: Imperative usage of Sheet.
- **AutoHeight**: Sheet with auto height.
- **Attached**: Default extended background coverage during upward rubber-banding.
- **Floating**: Bounded coverage, independent 0px/8px bottom gap, and live coverage changes without replacing the scroll node.
- **FloatingFit**: A content-sized floating panel that responds to content changes.
- **SurfaceRef**: A custom Motion spring animates the painted surface width on the main thread.
- **Transition**: Floating-to-fullscreen styling after snap selection, including an intermediate snap and an immediate snap.
- **Tablet**: Tablet-friendly Sheet layout.
- **GestureScrollView**: Default same-finger handoff between Sheet and ScrollView.
- **GestureList**: Coordinated handoff between the Sheet and native list scrolling.
- **GestureFixedFooter**: Scrollable content with a fixed action area and tablet width.
- **GestureComposite**: A drag handle, vertical owner, and horizontal child composed together.
- **InternalTest**: Internal test for Sheet.

## Surface and gesture coverage

| Case | Entry | What to try |
| --- | --- | --- |
| Attached background | Attached | Pull past 75%; the lower background continues to cover the viewport. |
| Floating with or without a gap | Floating | Toggle 0px/8px independently of coverage; the requested panel height does not include the external gap. |
| Live surface changes | Floating | Scroll, then change coverage; the same native scroll node and content remain mounted. |
| Intrinsic height | FloatingFit | Toggle more detail; the panel fits its content while keeping the external gap. |
| Fullscreen appearance | Transition | Release at 100% or use Fullscreen; 70% remains floating. Close and reopen to restore the initial appearance. |
| Immediate appearance | Transition | Use Instant fullscreen; both the snap and companion appearance update without animation. |
| Same-finger handoff | GestureScrollView / Transition | Drag up to the maximum and continue scrolling; reverse to scroll to the start before collapsing. |
| Native list | GestureList | Repeat the handoff with recycled list content. |
| Fixed footer | GestureFixedFooter | Scroll to the final item; verify it remains reachable above the fixed actions. |
| Composed gestures | GestureComposite | Drag the handle, scroll vertically, then swipe the horizontal child. |
| Other sides and RTL | Directional | Exercise top/bottom, physical edges, and logical start/end with RTL. |

The Transition example uses an independently timed CSS width transition. Its
snap-start callback does not expose per-frame progress or promise synchronization
with the Sheet spring. Native gesture examples require Lynx SDK 3.2 or newer and
`enableNewGesture: true`, which is enabled by the shared example configuration.
