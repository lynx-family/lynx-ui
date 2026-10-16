# Video example

An interactive video player using the aggregate `@lynx-js/lynx-ui` entry.
Playback controls exercise play, pause, stop, seek, replay, source changes,
mute, and looping. Playback events provide the displayed status and timeline.

```bash
pnpm turbo watch dev --filter @lynx-example/lynx-ui-video
```

Open `Basic.lynx.bundle` in a host with the Lynx 4.1+ experimental `<video>`
element. Run `pnpm check:luna-vars` and `pnpm turbo build` after edits.
