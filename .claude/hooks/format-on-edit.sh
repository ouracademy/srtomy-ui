#!/usr/bin/env bash
# PostToolUse hook: runs Prettier (and ESLint --fix for JS/TS) on whatever
# file Edit/Write just touched. Reads the hook payload from stdin.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

file_path="$(node -e '
let data = "";
process.stdin.on("data", (c) => (data += c));
process.stdin.on("end", () => {
  try {
    const json = JSON.parse(data);
    const fp = json.tool_input?.file_path ?? json.tool_input?.path ?? "";
    process.stdout.write(fp);
  } catch {
    process.stdout.write("");
  }
});
')"

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# The tools are called by path, not through pnpm: hooks run with the PATH
# Claude Code started with, where pnpm may not be (e.g. when pnpm lives inside
# an fnm- or nvm-managed Node). A missing pnpm used to make this hook a silent
# no-op.
case "$file_path" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs | *.json | *.css | *.md)
    node node_modules/prettier/bin/prettier.cjs --write "$file_path" >/dev/null 2>&1 || true
    ;;
  *)
    exit 0
    ;;
esac

case "$file_path" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.cjs)
    node node_modules/eslint/bin/eslint.js --fix "$file_path" >/dev/null 2>&1 || true
    ;;
esac

exit 0
