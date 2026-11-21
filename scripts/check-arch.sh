#!/usr/bin/env bash
# Architecture rules (.dependency-cruiser.cjs, taken from docs/architecture.md).
# Violations listed in .dependency-cruiser-known-violations.json are skipped;
# new ones fail.
#
# dependency-cruiser only runs on Node 22, 24 or >= 26. With another Node
# active (e.g. 25), the one in .nvmrc is used through fnm or nvm when present.
set -euo pipefail

cd "$(dirname "$0")/.."

cmd=(node node_modules/dependency-cruiser/bin/dependency-cruiser.mjs
  app tests types --config .dependency-cruiser.cjs --ignore-known --output-type err)

major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$major" -eq 22 ] || [ "$major" -eq 24 ] || [ "$major" -ge 26 ]; then
  exec "${cmd[@]}"
fi

wanted="$(cat .nvmrc)"
if command -v fnm >/dev/null 2>&1; then
  exec fnm exec --using="$wanted" "${cmd[@]}"
fi

nvm_dir="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$nvm_dir/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$nvm_dir/nvm.sh"
  nvm use "$wanted" >/dev/null
  exec "${cmd[@]}"
fi

echo "check-arch: dependency-cruiser no corre en Node $major. Activa el Node de .nvmrc ($wanted) con nvm o fnm." >&2
exit 1
