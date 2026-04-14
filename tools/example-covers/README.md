# lynx-ui Cover Processor

Batch process screenshots and screen recordings into cover assets for lynx-ui examples.

- **Images** (png/jpg/heic/webp/…) → `.jpg` (85% quality, progressive)
- **Videos** (mp4/mov/mkv/…) → `.webm` (VP9, CRF 30, no audio)
- Auto-resize, center-crop, compress, and rename

## Prerequisites

```bash
brew install imagemagick ffmpeg
```

## Quick Start

```bash
chmod +x ./process_covers.sh

# 1. Put raw screenshots / recordings into ./raw
mkdir raw

# 2. Dry run to preview
./process_covers.sh -i ./raw -d

# 3. Process
./process_covers.sh -i ./raw
```

Output goes to `./raw/processed/` by default. Use `-o ./covers` to specify a different directory.

## Raw File Naming

This tool does **not** do video trimming — make sure the timeline is trimmed before placing files in `./raw`.

Name raw files to match the component name:

```text
raw/
├── button.mov
├── checkbox.mov
├── dialog.mov
├── feed-list.mov
├── scroll-view.mov
├── sheet.mov
```

For additional examples beyond the component's default demo, append `_ExampleName`:

```text
raw/
├── input.mov                    → lynx-ui-cover-input.webm
├── input_KeyboardAwareView.mov  → lynx-ui-cover-input_keyboard-aware-view.webm
```

### Filename Transform

Filenames are auto-converted to kebab-case. Underscores are preserved as the component/example separator.

| Raw filename              | Output                      |
| ------------------------- | --------------------------- |
| `FeedList.mov`            | `feed-list.webm`            |
| `popover_ExtraAnchor.mov` | `popover_extra-anchor.webm` |
| `swiper_RTLLoop.mov`      | `swiper_rtl-loop.webm`      |

## Device Presets

Use `--device` to automatically set `-t` and `-b` for a specific device's status bar and home indicator:

| Preset              | `-t` | `-b` | Device                              |
| ------------------- | ---- | ---- | ----------------------------------- |
| `iphone-11-pro`     | 38   | 16   | iPhone 11 Pro (1080x2338)           |
| `iphone-12-pro-max` | 41   | 18   | iPhone 12 Pro Max (1284x2778)       |
| `iphone-13`         | 44   | 20   | iPhone 13 / 13 Pro (1170x2532)      |
| `iphone-16`         | 60   | 20   | iPhone 16 (1179x2556)               |
| `iphone-16-pro`     | 61   | 16   | iPhone 16 Pro / Pro Max (1206x2622) |

```bash
# Use iPhone 16 Pro preset
./process_covers.sh -i ./raw --device iphone-16-pro

# Use a preset but override just the top crop
./process_covers.sh -i ./raw --device iphone-16 -t 50

# List all available presets
./process_covers.sh --devices
```

Explicit `-t`/`-b` flags after `--device` override the preset values.

## Default Configuration

Without `--device`, the script uses defaults tuned for **iPhone 13** screen recordings (1170 × 2532, viewport 390 × 844 @3x):

| Parameter | Default | Description                                         |
| --------- | ------- | --------------------------------------------------- |
| `-w`      | 480     | Output width                                        |
| `-h`      | 960     | Output height                                       |
| `-t`      | 44      | Top crop — removes status bar + recording indicator |
| `-b`      | 20      | Bottom crop — removes home indicator                |
| `-q`      | 85      | JPEG quality                                        |
| `-c`      | 30      | Video CRF (lower = better quality, larger file)     |

Crop values (`-t`, `-b`) are in **output coordinate space** and automatically scale to match any source resolution. The same values work across different devices.

If the crop values are too aggressive for the source (not enough height left), the script will warn and suggest recommended max values.

## Examples

```bash
# Custom output directory
./process_covers.sh -i ./raw -o ./covers

# iPhone 16 Pro preset
./process_covers.sh -i ./raw --device iphone-16-pro

# Adjust crop (less top, no bottom)
./process_covers.sh -i ./raw -t 30 -b 0

# Higher quality video
./process_covers.sh -i ./raw -c 24

# Show ffmpeg warnings (default: errors only)
./process_covers.sh -i ./raw -v

# Full help
./process_covers.sh --help
```

## Sample Output

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  lynx-ui cover processor
  Input:   ./raw
  Output:  ./raw/processed
  Size:    480x960
  Pre-crop (output-space): top=61px  bottom=16px (--device iphone-16-pro)
  Quality: JPEG 85% / Video CRF 30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 button.mov      → lynx-ui-cover-button.webm
🎬 checkbox.mov    → lynx-ui-cover-checkbox.webm
🎬 dialog.mov      → lynx-ui-cover-dialog.webm
🎬 sheet.mov       → lynx-ui-cover-sheet.webm
🎬 switch.mov      → lynx-ui-cover-switch.webm
```
