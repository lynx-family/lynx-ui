---
name: Video
description: Build VideoEngine-compatible headless Video players with the native Lynx video element.
---

# Video

## Prompt Formula

Build a video player with `Video` from `@lynx-js/lynx-ui`, an HTTP(S) `playUrl`,
explicit dimensions, and a `VideoRef` for playback controls. Render state from
the playback events and provide controls with `Button`.

## Contract

- Keep VideoEngine naming: `playUrl`, `mute`, `objectfit`, and `playbackSpeed`.
- Use milliseconds for `seek`, `getDuration`, and `onTimeUpdate.detail.current`
  and `.total`. The underlying native element uses seconds; the component
  performs the conversion.
- `seek(position, play)` and `replay(play)` choose whether playback continues.
  `onSeek` receives that same boolean.
- A playback callback receives `(success, errCode?, errMsg?)`; it reports the
  operation result. Listen to `onPlay`, `onPause`, and `onStop` for player state.
- `onPrepared` precedes `onFirstFrame` once the native first frame is available.
  `onSrcChanged` also fires on initial mount. The poster disappears when the
  first frame renders.
- `onEnded` fires at the end of each loop. A non-looping completion first
  reports `onStop`. `replay` stops and starts the player, then pauses when
  requested; it does not emit `onSeek`.
- A source change or `attached={false}` releases the previous player. Commands
  against an absent source fail instead of silently succeeding.
- Use `aspectFit`, `aspectFill`, or `scaleToFill` for `objectfit`; use a playback
  speed between 0.1 and 2 and volume between 0 and 1.
- Video scaling applies when `playUrl` changes or the player mounts, including
  reattaching with `attached`. Changing `objectfit` for the current source
  updates the poster immediately and takes effect on the video at that next
  source change or mount.

## Scope

Requires a host with the experimental Lynx 4.1+ `<video>` element. VideoEngine's
private source models, resource redirection, player options, fullscreen methods,
manual preparation, and audio mode are outside this public subset. Native
error codes and precise event timing depend on the host player.

## Validation

Run the package's Vitest tests and the Video example on a device. Include source
replacement, stop followed by seek or replay, and both values of the seek play
flag when comparing with the internal VideoEngine-backed Video.
