#!/usr/bin/env bash
# Stop hook: before the agent may finish a turn with uncommitted changes, the
# whole project must pass types, lint and architecture. On failure it exits 2,
# which keeps the agent working with the report in front of it. CI runs the
# same three commands, so whatever slips past here is stopped there.
set -uo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" || exit 0

# Already continuing because of this hook: let it stop, or it loops forever.
stop_hook_active="$(node -e '
let data = "";
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => {
  try {
    process.stdout.write(JSON.parse(data).stop_hook_active === true ? "true" : "false");
  } catch {
    process.stdout.write("false");
  }
});
')"
[ "$stop_hook_active" = "true" ] && exit 0

# Nothing changed: nothing to check.
[ -z "$(git status --porcelain 2>/dev/null)" ] && exit 0

report=""
failed=0

run_check() {
  local title="$1"
  shift
  local output
  if ! output="$("$@" 2>&1)"; then
    failed=1
    report+=$'\n'"── $title ──"$'\n'"$output"$'\n'
  fi
}

# The tools run directly, as in CI: the pnpm scripts would re-run
# `api:generate` each time, and app/(api)/generated/ already exists after
# `pnpm install`.
run_check "tipos (tsc --noEmit)" node node_modules/typescript/bin/tsc --noEmit
run_check "lint (eslint .)" node node_modules/eslint/bin/eslint.js . --max-warnings=0
run_check "arquitectura (dependency-cruiser)" bash scripts/check-arch.sh

[ "$failed" -eq 0 ] && exit 0

{
  echo "No termines todavía: la comprobación de cierre encontró errores."
  echo "$report"
  echo "Corrígelos. No edites reglas ni baselines (eslint.config.mjs, .dependency-cruiser.cjs,"
  echo ".dependency-cruiser-known-violations.json) para que pase (constitución, principio I)."
  echo "Si una regla no tiene sentido aquí, explícaselo al usuario en lugar de esquivarla."
} >&2
exit 2
