#!/bin/bash
set -e

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

# Run Rslint with auto-fix and capture its exit code
echo "Running Rslint with auto-fix..."
pnpm exec rslint -c rslint.config.mjs --fix $FILES
RSLINT_RESULT=$?

# Run dprint formatter and capture its exit code
echo "Running dprint formatter..."
pnpm exec dprint fmt --allow-no-files
DPRINT_RESULT=$?

# Re-enable exit on error
set -e

# Set error flag if any linter had issues
HAS_ERRORS=0
if [ $RSLINT_RESULT -ne 0 ] || [ $DPRINT_RESULT -ne 0 ]; then
    HAS_ERRORS=1
fi

echo "Linting completed."

# Exit with error if any linter found issues
exit $HAS_ERRORS
