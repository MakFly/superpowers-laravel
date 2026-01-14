#!/usr/bin/env bash
set -euo pipefail
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"

# Detect Laravel apps by composer.json with laravel/framework
find_apps() {
  local root="${1:-.}"
  local apps=()
  while IFS= read -r -d '' f; do
    if grep -q '"laravel/framework"' "$f" 2>/dev/null; then
      apps+=("$(dirname "$f")")
    fi
  done < <(find "$root" -name composer.json -not -path "*/vendor/*" -not -path "*/.git/*" -print0 2>/dev/null)
  printf '%s
' "${apps[@]}"
}

get_version() {
  local app="$1"
  local v=""
  if [[ -f "$app/composer.lock" ]]; then
    v=$(grep -A5 '"name": "laravel/framework"' "$app/composer.lock" 2>/dev/null | grep '"version"' | head -1 | sed -E 's/.*"version": "v?([0-9]+\.[0-9]+).*//')
  fi
  if [[ -z "$v" && -f "$app/composer.json" ]]; then
    v=$(grep '"laravel/framework"' "$app/composer.json" 2>/dev/null | sed -E 's/.*"[\^~]?([0-9]+\.[0-9]+).*//')
  fi
  echo "${v:-unknown}"
}

detect_test() {
  local app="$1"
  local t="phpunit"
  if [[ -f "$app/composer.lock" ]] && grep -q '"pestphp/pest"' "$app/composer.lock"; then
    t="pest"
  elif [[ -f "$app/composer.json" ]] && grep -q '"pestphp/pest"' "$app/composer.json"; then
    t="pest"
  fi
  echo "$t"
}

main() {
  local cwd="$PWD"
  mapfile -t apps < <(find_apps "$cwd")
  if [[ ${#apps[@]} -eq 0 ]]; then
    exit 0
  fi
  local active=""
  for app in "${apps[@]}"; do
    if [[ "$cwd" == "$app"* ]]; then
      active="$app"; break;
    fi
  done
  [[ -z "$active" ]] && active="${apps[0]}"

  local v
  local test
  v=$(get_version "$active")
  test=$(detect_test "$active")

  cat <<EOF
{
  "plugin": "superpowers-laravel",
  "active_app": "$active",
  "laravel": {
    "version": "$v"
  },
  "test_framework": "$test"
}
EOF
}

main "$@"
