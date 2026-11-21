#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): lints the TypeScript file that was just
# edited. On a lint error it exits 2, which hands the error back to the agent
# so it has to fix it before going on. Runs after format-on-edit.sh, which
# already applied what ESLint can fix by itself.
#
# Budget: under 2 s. Only one file, ESLint cache on, no typecheck here (the
# Stop hook runs the slow checks once, at the end).
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" || exit 0

# Path of the edited file, relative to the project, with "/" separators.
rel_path="$(node .claude/hooks/hook-file-path.mjs "$project_dir")"

case "$rel_path" in
  app/\(api\)/generated/*) exit 0 ;;
  app/*.ts | app/*.tsx | tests/*.ts | tests/*.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$rel_path" ] || exit 0

if output="$(node node_modules/eslint/bin/eslint.js \
  --max-warnings=0 \
  --cache --cache-location node_modules/.cache/eslint-hook/ \
  "$rel_path" 2>&1)"; then
  exit 0
fi

{
  echo "ESLint falló en $rel_path:"
  echo
  echo "$output"
  echo
  echo "Corrige el código. No agregues eslint-disable ni @ts-ignore y no cambies eslint.config.mjs"
  echo "para que pase (constitución, principio I)."
} >&2
exit 2
