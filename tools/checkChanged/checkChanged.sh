#!/bin/bash
set -e

# Collect changed JavaScript/TypeScript files while preserving path boundaries.
FILES=()
while IFS= read -r -d '' file; do
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.md|*.json|*.jsonc|*.json5)
      if [ -f "$file" ]; then
        FILES+=("$file")
      fi
      ;;
  esac
done < <(git diff --name-only -z main)

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "No changed JavaScript/TypeScript files to lint."
  exit 0
fi

echo "Files to lint/fix:"
printf '%s\n' "${FILES[@]}"
echo ""


echo "Running in local mode: attempting auto-fix..."

# Temporarily disable exit on error for linting commands
set +e

# Run Rslint with auto-fix and capture its exit code
echo "Running Rslint with auto-fix..."
pnpm exec rslint -c rslint.config.mjs --fix "${FILES[@]}"
RSLINT_RESULT=$?

echo "Running JSONC lint..."
node tools/scripts/lint-json.mjs "${FILES[@]}"
JSON_RESULT=$?

# Run dprint formatter and capture its exit code
echo "Running dprint formatter..."
pnpm exec dprint fmt --allow-no-files
DPRINT_RESULT=$?

# Re-enable exit on error
set -e

# Set error flag if any linter had issues
HAS_ERRORS=0
if [ $RSLINT_RESULT -ne 0 ] || [ $JSON_RESULT -ne 0 ] || [ $DPRINT_RESULT -ne 0 ]; then
    HAS_ERRORS=1
fi

echo "Linting completed."

# Exit with error if any linter found issues
exit $HAS_ERRORS
