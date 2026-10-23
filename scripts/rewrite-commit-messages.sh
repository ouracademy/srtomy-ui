#!/usr/bin/env bash
# Rewrites every commit message in history, replacing a literal string with
# another one (empty by default, i.e. a removal).
#
# Only the message is touched: file contents, authors, dates and the commit
# order stay as they are. The subject line and the body are treated as one
# blob, so the string is removed wherever it appears.
#
# This rewrites history: every commit gets a new SHA. Coordinate before
# pushing (see the notes printed at the end).
set -euo pipefail

usage() {
  cat <<'USAGE'
Uso:
  scripts/rewrite-commit-messages.sh [opciones] <texto-a-quitar>

Opciones:
  --replace <texto>   Texto de reemplazo (por defecto: vacío, o sea, lo borra)
  --range <rango>     Rango de revisiones a reescribir (por defecto: --all)
  --dry-run           Solo lista los commits afectados, no reescribe nada
  --yes               No pide confirmación
  -h, --help          Muestra esta ayuda

Ejemplos:
  scripts/rewrite-commit-messages.sh --dry-run "Co-Authored-By: Claude <noreply@anthropic.com>"
  scripts/rewrite-commit-messages.sh "🤖 Generated with Claude Code at The Home Depot"
  scripts/rewrite-commit-messages.sh --replace "equipo de datos" "Juan Pérez"
USAGE
}

search=""
replace=""
range="--all"
dry_run=0
assume_yes=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --replace) replace="${2-}"; shift 2 ;;
    --range) range="${2-}"; shift 2 ;;
    --dry-run) dry_run=1; shift ;;
    --yes) assume_yes=1; shift ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) echo "Opción desconocida: $1" >&2; usage >&2; exit 2 ;;
    *) break ;;
  esac
done

if [[ $# -lt 1 || -z "${1-}" ]]; then
  echo "Falta el texto a quitar." >&2
  usage >&2
  exit 2
fi
search="$1"

git rev-parse --git-dir >/dev/null 2>&1 || { echo "Esto no es un repositorio git." >&2; exit 1; }

if [[ -n "$(git status --porcelain)" ]]; then
  echo "El árbol de trabajo tiene cambios sin commitear. Guárdalos o haz stash primero." >&2
  exit 1
fi

# Commits whose message contains the literal string.
mapfile -t matches < <(git log "$range" --fixed-strings --grep="$search" --format='%H %s')

echo "Texto buscado : $search"
echo "Reemplazo     : ${replace:-(vacío — se elimina)}"
echo "Rango         : $range"
echo "Commits que lo contienen: ${#matches[@]}"
for m in "${matches[@]}"; do echo "  ${m:0:9} ${m#* }"; done

if [[ ${#matches[@]} -eq 0 ]]; then
  echo "Nada que hacer."
  exit 0
fi

if [[ $dry_run -eq 1 ]]; then
  echo "--dry-run: no se reescribió nada."
  exit 0
fi

# An empty refs/original directory is leftover plumbing, not a backup: only
# an actual ref there means a previous rewrite is still recoverable.
if [[ -n "$(git for-each-ref --format='%(refname)' refs/original)" ]]; then
  echo "Existe un backup previo en refs/original de una reescritura anterior." >&2
  echo "Bórralo antes de seguir:" >&2
  echo "  git for-each-ref --format='%(refname)' refs/original | xargs -r -n 1 git update-ref -d" >&2
  exit 1
fi

if [[ $assume_yes -eq 0 ]]; then
  echo
  echo "Esto reescribe la historia: todos los commits afectados (y los que vienen después) cambian de SHA."
  read -r -p "¿Continuar? [s/N] " answer
  [[ "$answer" == "s" || "$answer" == "S" ]] || { echo "Cancelado."; exit 1; }
fi

# Python does the literal replace: no escaping traps with quotes, slashes,
# emoji or newlines, unlike sed. An empty result falls back to the original
# message, because git refuses to create a commit without one.
export REWRITE_SEARCH="$search"
export REWRITE_REPLACE="$replace"

FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --msg-filter '
python3 -c "
import os, re, sys
original = sys.stdin.read()
rewritten = original.replace(os.environ[\"REWRITE_SEARCH\"], os.environ[\"REWRITE_REPLACE\"])
rewritten = re.sub(r\"[ \t]+\n\", \"\n\", rewritten)
rewritten = re.sub(r\"\n{3,}\", \"\n\n\", rewritten).strip()
sys.stdout.write((rewritten or original.strip()) + \"\n\")
"
' -- "$range"

echo
echo "Listo. La historia anterior quedó en refs/original/ por si hay que volver:"
echo "  git reset --hard refs/original/refs/heads/main   # deshace la reescritura en main"
echo
echo "Cuando estés conforme, limpia el backup y publica:"
echo "  git for-each-ref --format='%(refname)' refs/original | xargs -r -n 1 git update-ref -d"
echo "  git push --force-with-lease"