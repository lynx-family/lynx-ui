#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# lynx-ui cover asset batch processor
# Resize, center-crop, compress, rename, convert
#   - Images → .jpg (85% quality)
#   - Videos → .webm (VP9, crf 30)
#
# -t / -b values are in OUTPUT coordinate space.
# They are proportionally mapped to source pixels via:
#   scale_factor = source_width / output_width
#   actual_crop  = value x scale_factor
#
# If pre-crop leaves insufficient height for the target,
# the crop region expands symmetrically around the pre-crop
# center (pulling in original content, not black bars),
# and a warning is printed with recommended max -t/-b values.
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ── Device presets (bash 3 compatible) ───────────────────────
# Each entry: "top bottom description"
# Looked up by device_preset_lookup(); avoids declare -A.
DEVICE_PRESET_KEYS="iphone-11-pro iphone-12-pro-max iphone-13 iphone-16 iphone-16-pro"

device_preset_lookup() {
  case "$1" in
    iphone-11-pro)     echo "38 16 iPhone 11 Pro (1080x2338)" ;;
    iphone-12-pro-max) echo "41 18 iPhone 12 Pro Max (1284x2778)" ;;
    iphone-13)         echo "44 20 iPhone 13 / 13 Pro (1170x2532)" ;;
    iphone-16)         echo "60 20 iPhone 16 (1179x2556)" ;;
    iphone-16-pro)     echo "61 16 iPhone 16 Pro / Pro Max (1206x2622)" ;;
    *) return 1 ;;
  esac
}

list_devices() {
  echo "Available device presets:"
  echo ""
  for key in $DEVICE_PRESET_KEYS; do
    local preset
    preset=$(device_preset_lookup "$key")
    local t b
    read -r t b _ <<< "$preset"
    local desc="${preset#$t $b }"
    printf "  %-20s -t %-4s -b %-4s  %s\n" "$key" "$t" "$b" "$desc"
  done
}

apply_device_preset() {
  local device="$1"
  local preset
  if ! preset=$(device_preset_lookup "$device"); then
    echo "Error: Unknown device '$device'"
    echo ""
    list_devices
    exit 1
  fi

  local t b
  read -r t b _ <<< "$preset"
  CROP_TOP="$t"
  CROP_BOTTOM="$b"
}

# ── Configuration ────────────────────────────────────────────
INPUT_DIR=""
OUTPUT_DIR=""
WIDTH=480
HEIGHT=960
QUALITY=85
VIDEO_CRF=30
PREFIX="lynx-ui-cover-"
CROP_TOP=44
CROP_BOTTOM=20
DRY_RUN=false
VERBOSE=false
DEVICE=""

# ── Usage ────────────────────────────────────────────────────
usage() {
  local exit_code="${1:-0}"
  cat <<EOF
Usage: $(basename "$0") [options]

Options:
  -i DIR    Input directory (required)
  -o DIR    Output directory (default: <input>/processed)
  -w NUM    Target width   (default: 480)
  -h NUM    Target height  (default: 960)
  -q NUM    JPEG quality 1-100 (default: 85)
  -c NUM    Video CRF 0-63, lower=better (default: 30)
  -p STR    Filename prefix (default: "lynx-ui-cover-")
  -t NUM    Top crop in output-space pixels (default: 44)
  -b NUM    Bottom crop in output-space pixels (default: 20)
  --device  Device preset for -t/-b values (overrides -t/-b if set before)
  --devices List available device presets
  -d        Dry run — print actions without executing
  -v        Verbose — show ffmpeg/ImageMagick warnings (default: errors only)
  --help    Show this help

Device presets:
  --device iphone-11-pro     -t 38 -b 16
  --device iphone-12-pro-max -t 41 -b 18
  --device iphone-13         -t 44 -b 20  (default)
  --device iphone-16         -t 60 -b 20
  --device iphone-16-pro     -t 61 -b 16

  Explicit -t/-b after --device overrides the preset values.

Crop behavior:
  -t and -b are specified in the output coordinate system.
  They are mapped to source pixels proportionally:
    scale = source_width / output_width
    actual_top_crop = -t x scale
    actual_bottom_crop = -b x scale
  Horizontal axis is never cropped.

  If pre-crop leaves insufficient height for the target, the crop
  region expands symmetrically around the pre-crop center point
  (using original content, not black bars). A warning is printed
  with recommended max -t/-b values.

Examples:
  ./process_covers.sh -i ./screenshots -w 1280 -h 720
  ./process_covers.sh -i ./raw --device iphone-16-pro
  ./process_covers.sh -i ./raw --device iphone-16 -t 50
  ./process_covers.sh -i ./raw -w 480 -h 920 -t 40 -b 20
  ./process_covers.sh -i ./raw -o ./covers -p "lynx-" -w 960 -h 540
  ./process_covers.sh -i ./raw -d
EOF
  exit "$exit_code"
}

# ── Parse args ───────────────────────────────────────────────
require_arg() {
  local option="$1"
  if [[ $# -lt 2 ]]; then
    echo "Error: Option '$option' requires an argument"
    usage 1
  fi
}

validate_positive_int() {
  local option="$1"
  local value="$2"

  if [[ ! "$value" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: Option '$option' requires a positive integer, got '$value'"
    usage 1
  fi
}

validate_non_negative_int() {
  local option="$1"
  local value="$2"

  if [[ ! "$value" =~ ^[0-9]+$ ]]; then
    echo "Error: Option '$option' requires a non-negative integer, got '$value'"
    usage 1
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i) require_arg "$@"; INPUT_DIR="$2"; shift 2 ;;
    -o) require_arg "$@"; OUTPUT_DIR="$2"; shift 2 ;;
    -w) require_arg "$@"; WIDTH="$2"; validate_positive_int "-w" "$WIDTH"; shift 2 ;;
    -h) require_arg "$@"; HEIGHT="$2"; validate_positive_int "-h" "$HEIGHT"; shift 2 ;;
    -q) require_arg "$@"; QUALITY="$2"; validate_positive_int "-q" "$QUALITY"; shift 2 ;;
    -c) require_arg "$@"; VIDEO_CRF="$2"; validate_positive_int "-c" "$VIDEO_CRF"; shift 2 ;;
    -p) require_arg "$@"; PREFIX="$2"; shift 2 ;;
    -t) require_arg "$@"; CROP_TOP="$2"; validate_non_negative_int "-t" "$CROP_TOP"; shift 2 ;;
    -b) require_arg "$@"; CROP_BOTTOM="$2"; validate_non_negative_int "-b" "$CROP_BOTTOM"; shift 2 ;;
    --device) require_arg "$@"; DEVICE="$2"; apply_device_preset "$DEVICE"; shift 2 ;;
    --devices) list_devices; exit 0 ;;
    -d) DRY_RUN=true; shift ;;
    -v) VERBOSE=true; shift ;;
    --help) usage 0 ;;
    *) echo "Unknown option: $1"; usage 1 ;;
  esac
done

validate_positive_int "-w" "$WIDTH"
validate_positive_int "-h" "$HEIGHT"
validate_positive_int "-q" "$QUALITY"
validate_positive_int "-c" "$VIDEO_CRF"
validate_non_negative_int "-t" "$CROP_TOP"
validate_non_negative_int "-b" "$CROP_BOTTOM"

if [[ -z "$INPUT_DIR" ]]; then
  echo "Error: -i INPUT_DIR is required"
  usage 1
fi

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "Error: '$INPUT_DIR' is not a directory"
  exit 1
fi

[[ -z "$OUTPUT_DIR" ]] && OUTPUT_DIR="$INPUT_DIR/processed"

HAS_PRE_CROP=false
if [[ "$CROP_TOP" -gt 0 || "$CROP_BOTTOM" -gt 0 ]]; then
  HAS_PRE_CROP=true
fi

# Set ffmpeg log level
if [[ "$VERBOSE" == true ]]; then
  FFMPEG_LOGLEVEL="warning"
else
  FFMPEG_LOGLEVEL="error"
fi

# ── Dependency check ─────────────────────────────────────────
check_dep() {
  if ! command -v "$1" &>/dev/null; then
    echo "Error: '$1' not found. Install it first."
    echo "  macOS:  brew install $2"
    echo "  Linux:  sudo apt install $2"
    exit 1
  fi
}

check_dep ffmpeg ffmpeg
check_dep ffprobe ffmpeg

if command -v magick &>/dev/null; then
  MAGICK_CMD=(magick)
  IDENTIFY_CMD=(magick identify)
  # IM7: -quiet suppresses warnings
  if [[ "$VERBOSE" == true ]]; then
    MAGICK_FLAGS=()
  else
    MAGICK_FLAGS=(-quiet)
  fi
elif command -v convert &>/dev/null && command -v identify &>/dev/null; then
  MAGICK_CMD=(convert)
  IDENTIFY_CMD=(identify)
  # IM6: no -quiet flag
  MAGICK_FLAGS=()
else
  echo "Error: ImageMagick not found (need 'magick' or both 'convert' and 'identify'). Install it first."
  echo "  macOS:  brew install imagemagick"
  echo "  Linux:  sudo apt install imagemagick"
  exit 1
fi

# ── Helper: get source dimensions ────────────────────────────
get_image_dims() {
  local file="$1"
  local dims=""

  if ! dims=$("${IDENTIFY_CMD[@]}" -format "%w %h" "$file" 2>/dev/null); then
    dims=""
  fi

  if [[ "$dims" =~ ^[[:space:]]*([0-9]+)[[:space:]]+([0-9]+)[[:space:]]*$ ]]; then
    printf '%s %s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi

  echo "  ⚠️  $(basename "$file"): unable to read image dimensions, skipping." >&2
  return 0
}

get_video_dims() {
  local file="$1"
  local dims=""

  if ! dims=$(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height \
    -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null); then
    dims=""
  fi

  dims="${dims//$'\n'/ }"

  if [[ "$dims" =~ ^[[:space:]]*([0-9]+)[[:space:]]+([0-9]+)[[:space:]]*$ ]]; then
    printf '%s %s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi

  echo "  ⚠️  $(basename "$file"): unable to read video dimensions, skipping." >&2
  return 0
}

# ── Helper: compute crop with overflow handling ──────────────
# Usage: compute_crop <src_width> <src_height> <filename>
# Sets: crop_y, crop_h (source-space crop region)
#        scale_display, had_overflow
compute_crop() {
  local src_w="$1"
  local src_h="$2"
  local filename="$3"

  had_overflow=false
  local scale_display_hundredths=$(( (src_w * 100 + WIDTH / 2) / WIDTH ))
  scale_display=$(printf "%d.%02d" \
    $(( scale_display_hundredths / 100 )) \
    $(( scale_display_hundredths % 100 )))

  local requested_top=$(( CROP_TOP * src_w / WIDTH ))
  local requested_bot=$(( CROP_BOTTOM * src_w / WIDTH ))

  # Height needed in source pixels to fill target aspect ratio
  # after cropping: need at least (HEIGHT * src_w / WIDTH) pixels tall
  local needed_h=$(( HEIGHT * src_w / WIDTH ))
  local available_h=$(( src_h - requested_top - requested_bot ))

  if [[ "$available_h" -ge "$needed_h" ]]; then
    # Normal case: enough height after pre-crop
    crop_y="$requested_top"
    crop_h="$available_h"
  else
    # Overflow: not enough height. Expand symmetrically around
    # the center point determined by the pre-crop.
    had_overflow=true

    # Center of the pre-cropped region in source pixels
    local center=$(( requested_top + available_h / 2 ))

    # Try to place needed_h centered on that point
    local half=$(( needed_h / 2 ))
    crop_y=$(( center - half ))
    crop_h="$needed_h"

    # Clamp to source bounds
    if [[ "$crop_y" -lt 0 ]]; then
      crop_y=0
    fi
    if [[ $(( crop_y + crop_h )) -gt "$src_h" ]]; then
      crop_y=$(( src_h - crop_h ))
      if [[ "$crop_y" -lt 0 ]]; then
        crop_y=0
        crop_h="$src_h"
      fi
    fi

    # Compute recommended max -t/-b that would exactly fit
    # Budget in source pixels: src_h - needed_h
    # Distribute proportionally to original -t/-b ratio
    local budget=$(( src_h - needed_h ))
    if [[ "$budget" -lt 0 ]]; then
      budget=0
    fi

    local total_tb=$(( CROP_TOP + CROP_BOTTOM ))
    local needed_h_output=$(( needed_h * WIDTH / src_w ))
    local available_h_output=$(( available_h * WIDTH / src_w ))
    if [[ "$total_tb" -gt 0 && "$budget" -gt 0 ]]; then
      # Scale down -t and -b proportionally, convert back to output space
      local rec_top=$(( budget * CROP_TOP / total_tb * WIDTH / src_w ))
      local rec_bot=$(( budget * CROP_BOTTOM / total_tb * WIDTH / src_w ))
      echo "  ⚠️  $filename: pre-crop leaves insufficient height"
      echo "      need ${needed_h}px / have ${available_h}px in source (${needed_h_output}px / ${available_h_output}px in output)"
      echo "      Expanding crop region symmetrically around pre-crop center."
      echo "      Recommended max (in output coords): -t ${rec_top} -b ${rec_bot}"
    else
      echo "  ⚠️  $filename: source height (${src_h}px) too short for target even without crop."
    fi
  fi
}

# ── Helper: collision guard ───────────────────────────────────
# Usage: check_collision <out_file> <src_filename>
# Prints a warning to stderr and returns 1 if out_file already
# exists (written by a previous file in this run), so the caller
# can skip processing. Returns 0 if the path is free.
check_collision() {
  local out_file="$1"
  local src_filename="$2"
  if [[ -e "$out_file" ]]; then
    echo "  ⚠️  collision: $(basename "$out_file") already exists (from a previous input file)." >&2
    echo "      Skipping '$src_filename' to avoid silent overwrite." >&2
    echo "      Rename the source file so it normalizes to a unique basename." >&2
    return 1
  fi
  return 0
}

# ── Setup ────────────────────────────────────────────────────
if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$OUTPUT_DIR"
fi

IMAGE_EXTS="jpg|jpeg|png|bmp|tiff|tif|webp|heic|heif|avif"
VIDEO_EXTS="mp4|mov|avi|mkv|webm|m4v|gif"

img_count=0
vid_count=0
skip_count=0

# Build device label for banner
DEVICE_LABEL=""
if [[ -n "$DEVICE" ]]; then
  DEVICE_LABEL=" (--device $DEVICE)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  lynx-ui cover processor"
echo "  Input:   $INPUT_DIR"
echo "  Output:  $OUTPUT_DIR"
echo "  Size:    ${WIDTH}x${HEIGHT}"
echo "  Pre-crop (output-space): top=${CROP_TOP}px  bottom=${CROP_BOTTOM}px${DEVICE_LABEL}"
echo "  Quality: JPEG ${QUALITY}% / Video CRF ${VIDEO_CRF}"
echo "  Prefix:  ${PREFIX:-"(none)"}"
echo "  Dry run: $DRY_RUN"
echo "  Verbose: $VERBOSE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Process files ────────────────────────────────────────────
for file in "$INPUT_DIR"/*; do
  [[ -f "$file" ]] || continue

  filename=$(basename "$file")
  name="${filename%.*}"
  ext="${filename##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  # Sanitize name: camelCase/PascalCase → kebab-case, spaces → hyphens
  # Preserves underscore as example separator (e.g. input_KeyboardAwareView → input_keyboard-aware-view)
  clean_name=$(echo "$name" \
    | sed 's/ /-/g' \
    | sed 's/\([a-z0-9]\)\([A-Z]\)/\1-\2/g' \
    | sed 's/\([A-Z]\)\([A-Z][a-z]\)/\1-\2/g' \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9_-]//g' \
    | sed 's/--*/-/g')
  clean_name="${PREFIX}${clean_name}"

  # ── Image ──────────────────────────────────────────────────
  if echo "$ext_lower" | grep -qE "^($IMAGE_EXTS)$"; then
    out_file="$OUTPUT_DIR/${clean_name}.jpg"

    check_collision "$out_file" "$filename" || { ((skip_count+=1)); continue; }

    if [[ "$HAS_PRE_CROP" == true ]]; then
      dims=$(get_image_dims "$file")
      if [[ -z "$dims" ]]; then
        ((skip_count+=1))
        continue
      fi
      read -r src_w src_h <<< "$dims"
      compute_crop "$src_w" "$src_h" "$filename"
      echo "📷 $filename → $(basename "$out_file")  [crop: y=${crop_y} h=${crop_h} @ scale=${scale_display}x]"
    else
      echo "📷 $filename → $(basename "$out_file")"
    fi

    if [[ "$DRY_RUN" == false ]]; then
      if [[ "$HAS_PRE_CROP" == true ]]; then
        # Crop to computed region, then resize to target
        "${MAGICK_CMD[@]}" "${MAGICK_FLAGS[@]}" "$file" \
          -crop "${src_w}x${crop_h}+0+${crop_y}" +repage \
          -resize "${WIDTH}x${HEIGHT}^" \
          -gravity center \
          -extent "${WIDTH}x${HEIGHT}" \
          -strip \
          -quality "$QUALITY" \
          -sampling-factor 4:2:0 \
          -interlace Plane \
          "$out_file"
      else
        "${MAGICK_CMD[@]}" "${MAGICK_FLAGS[@]}" "$file" \
          -resize "${WIDTH}x${HEIGHT}^" \
          -gravity center \
          -extent "${WIDTH}x${HEIGHT}" \
          -strip \
          -quality "$QUALITY" \
          -sampling-factor 4:2:0 \
          -interlace Plane \
          "$out_file"
      fi
    fi

    ((img_count+=1))

  # ── Video ──────────────────────────────────────────────────
  elif echo "$ext_lower" | grep -qE "^($VIDEO_EXTS)$"; then
    out_file="$OUTPUT_DIR/${clean_name}.webm"

    check_collision "$out_file" "$filename" || { ((skip_count+=1)); continue; }

    if [[ "$HAS_PRE_CROP" == true ]]; then
      vid_dims=$(get_video_dims "$file")
      if [[ -z "$vid_dims" ]]; then
        ((skip_count+=1))
        continue
      fi
      read -r src_w src_h <<< "$vid_dims"
      compute_crop "$src_w" "$src_h" "$filename"
      echo "🎬 $filename → $(basename "$out_file")  [crop: y=${crop_y} h=${crop_h} @ scale=${scale_display}x]"
    else
      echo "🎬 $filename → $(basename "$out_file")"
    fi

    if [[ "$DRY_RUN" == false ]]; then
      if [[ "$HAS_PRE_CROP" == true ]]; then
        ffmpeg -y -i "$file" \
          -vf "crop=in_w:${crop_h}:0:${crop_y},scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}" \
          -c:v libvpx-vp9 \
          -crf "$VIDEO_CRF" \
          -b:v 0 \
          -an \
          -pix_fmt yuv420p \
          -threads 4 \
          -loglevel "$FFMPEG_LOGLEVEL" \
          "$out_file"
      else
        ffmpeg -y -i "$file" \
          -vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT}" \
          -c:v libvpx-vp9 \
          -crf "$VIDEO_CRF" \
          -b:v 0 \
          -an \
          -pix_fmt yuv420p \
          -threads 4 \
          -loglevel "$FFMPEG_LOGLEVEL" \
          "$out_file"
      fi
    fi

    ((vid_count+=1))

  # ── Skip ───────────────────────────────────────────────────
  else
    echo "⏭️  $filename (unsupported format, skipped)"
    ((skip_count+=1))
  fi

done

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Done!"
echo "  Images processed:  $img_count → .jpg"
echo "  Videos processed:  $vid_count → .webm"
echo "  Skipped:           $skip_count"
echo "  Output:            $OUTPUT_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
