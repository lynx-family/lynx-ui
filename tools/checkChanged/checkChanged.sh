#!/bin/bash
set -e

# Parse command line arguments
UNSAFE_FIX=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --unsafe) UNSAFE_FIX=1 ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Get list of files changed compared to main.
CHANGED_FILES=$(git diff --name-only main)

# Filter for JavaScript/TypeScript files and ensure they exist
FILES=$(echo "$CHANGED_FILES" | grep -E '\.(js|jsx|ts|tsx|mjs|cjs|md|json|jsonc)$' | while read file; do
  if [ -f "$file" ]; then
    echo "$file"
  fi
done)

if [ -z "$FILES" ]; then
  echo "No changed JavaScript/TypeScript files to lint."
  exit 0
fi

echo "Files to lint/fix:"
echo "$FILES"
echo ""


echo "Running in local mode: attempting auto-fix..."

# Temporarily disable exit on error for linting commands
set +e

# Run ESLint with auto-fix and capture its exit code
if [ $UNSAFE_FIX -eq 1 ]; then
    echo "Running ESLint with unsafe fixes..."
    npx eslint --cache --fix --fix-type problem,suggestion,layout,directive --no-warn-ignored $FILES
else
    npx eslint --cache --fix --no-warn-ignored $FILES
fi
ESLINT_RESULT=$?

# Run Biome with auto-fix and capture its exit code
if [ $UNSAFE_FIX -eq 1 ]; then
    echo "Running Biome with unsafe fixes..."
    npx biome check --changed --write --unsafe --no-errors-on-unmatched --files-ignore-unknown=true
else
    npx biome check --changed --write --no-errors-on-unmatched --files-ignore-unknown=true
fi
BIOME_RESULT=$?

# Run dprint formatter and capture its exit code
echo "Running dprint formatter..."
npx dprint fmt --allow-no-files
DPRINT_RESULT=$?

# Re-enable exit on error
set -e

# Set error flag if any linter had issues
HAS_ERRORS=0
if [ $ESLINT_RESULT -ne 0 ] || [ $BIOME_RESULT -ne 0 ] || [ $DPRINT_RESULT -ne 0 ]; then
    HAS_ERRORS=1
fi

echo "Linting completed."

# Exit with error if any linter found issues
exit $HAS_ERRORS