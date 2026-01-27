#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${CLARKSOFT_HMI_PRESENTER_ENV_FILE:-/mnt/g/ClarkSoft/.env}"

API_ROOT=""
if [ -d "$ROOT_DIR/../master_irrigator" ]; then
  API_ROOT="$ROOT_DIR/../master_irrigator"
elif [ -d "$ROOT_DIR/../projects/master_irrigator" ]; then
  API_ROOT="$ROOT_DIR/../projects/master_irrigator"
else
  echo "Unable to locate master_irrigator API directory." >&2
  exit 1
fi

HTML_DIR="$ROOT_DIR"

ALLOW_PATTERN="${CLARKSOFT_HMI_PRESENTER_PORT_ALLOW_PATTERN:-uvicorn|http\.server|python -m http\.server}"
VERIFY_RENDER="false"
OPEN_BROWSER="false"
MCP_PID=""
HEALTH_CHECK_RETRIES="${CLARKSOFT_HMI_PRESENTER_HEALTH_RETRIES:-60}"
HEALTH_CHECK_SLEEP="${CLARKSOFT_HMI_PRESENTER_HEALTH_SLEEP:-0.5}"

is_wsl() {
  if [ -f /proc/sys/kernel/osrelease ]; then
    grep -qi "microsoft" /proc/sys/kernel/osrelease
    return $?
  fi
  return 1
}

get_wsl_ip() {
  if command -v hostname >/dev/null 2>&1; then
    hostname -I 2>/dev/null | awk '{print $1}'
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --verify)
      VERIFY_RENDER="true"
      shift
      ;;
    --open)
      OPEN_BROWSER="true"
      shift
      ;;
    --help)
      echo "Usage: $0 [--verify] [--open]" >&2
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ENV_FILE"
  set +a
fi

HMI_PORT="${CLARKSOFT_HMI_PRESENTER_HMI_PORT:-52100}"
API_PORT="${CLARKSOFT_HMI_PRESENTER_API_PORT:-}"
MCP_PORT="${CLARKSOFT_HMI_PRESENTER_MCP_PORT:-}"

if [ -z "$API_PORT" ]; then
  echo "CLARKSOFT_HMI_PRESENTER_API_PORT is required. Set it in $ENV_FILE or export it." >&2
  exit 1
fi

if [ -z "$MCP_PORT" ]; then
  echo "CLARKSOFT_HMI_PRESENTER_MCP_PORT is required. Set it in $ENV_FILE or export it." >&2
  exit 1
fi

if [ "$API_PORT" = "$MCP_PORT" ]; then
  echo "CLARKSOFT_HMI_PRESENTER_API_PORT and CLARKSOFT_HMI_PRESENTER_MCP_PORT must be different." >&2
  exit 1
fi

"$API_ROOT/scripts/ensure_db_ready.sh"

"$API_ROOT/scripts/ensure_port_free.sh" "$HMI_PORT" --allow "$ALLOW_PATTERN"
if ! "$API_ROOT/scripts/ensure_port_free.sh" "$MCP_PORT" --allow "$ALLOW_PATTERN"; then
  echo "Port $MCP_PORT is busy. Set CLARKSOFT_HMI_PRESENTER_MCP_PORT to a free port." >&2
  exit 1
fi
if ! "$API_ROOT/scripts/ensure_port_free.sh" "$API_PORT" --allow "$ALLOW_PATTERN"; then
  echo "Port $API_PORT is busy. Set CLARKSOFT_HMI_PRESENTER_API_PORT to a free port." >&2
  exit 1
fi

check_health() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -sf "$url" >/dev/null 2>&1
    return $?
  fi
  python3 - <<PY >/dev/null 2>&1
import urllib.request
try:
    with urllib.request.urlopen("$url", timeout=2) as response:
        response.read()
    raise SystemExit(0)
except Exception:
    raise SystemExit(1)
PY
}

wait_for_health() {
  local url="$1"
  for _ in $(seq 1 "$HEALTH_CHECK_RETRIES"); do
    if check_health "$url"; then
      return 0
    fi
    sleep "$HEALTH_CHECK_SLEEP"
  done
  return 1
}

cleanup() {
  if [ -n "${API_PID:-}" ]; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [ -n "${HMI_PID:-}" ]; then
    kill "$HMI_PID" 2>/dev/null || true
  fi
  if [ -n "${MCP_PID:-}" ]; then
    kill "$MCP_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

(
  cd "$HTML_DIR"
  python -m http.server "$HMI_PORT"
) &
HMI_PID=$!

echo "Static server running on http://localhost:$HMI_PORT"

CACHE_BUSTER="$(date +%s)"
API_QUERY="?v=$CACHE_BUSTER"
HMI_URL="http://localhost:$API_PORT/hmi/clarksoft_hmi_presenter.html$API_QUERY"
PROJECTOR_URL="http://localhost:$API_PORT/hmi/clarksoft_projector_hmi.html$API_QUERY"
DATA_TOOLS_URL="http://localhost:$API_PORT/hmi/hmi_data_tools.html$API_QUERY"
SETTINGS_URL="http://localhost:$API_PORT/hmi/settings.html$API_QUERY"
VERSION_MANAGER_URL="http://localhost:$API_PORT/hmi/version_manager.html$API_QUERY"
DECK_EDITOR_URL="http://localhost:$API_PORT/hmi/deck_editor.html$API_QUERY"
THEME_PREVIEW_URL="http://localhost:$API_PORT/hmi/quality_irrigation_theme_preview.html$API_QUERY"
THEME_PREVIEW_PRINT_URL="http://localhost:$API_PORT/hmi/quality_irrigation_theme_preview_print.html$API_QUERY"
INDEX_URL="http://localhost:$API_PORT/hmi/index.html$API_QUERY"
IMG_GENERATOR_HMI_URL="http://localhost:$API_PORT/img-generator/hmi/index.html$API_QUERY"
IMG_GENERATOR_API_URL="http://localhost:$API_PORT/img-generator-api"
STATIC_URL="http://localhost:$HMI_PORT/src/clarksoft_hmi_presenter.html$API_QUERY"

echo "Starting API on http://0.0.0.0:$API_PORT"
echo "Entry: Presenter console: $HMI_URL"
echo "Entry: Projector view: $PROJECTOR_URL"
echo "Entry: Data tools: $DATA_TOOLS_URL"
echo "Entry: Settings: $SETTINGS_URL"
echo "Entry: Version manager: $VERSION_MANAGER_URL"
echo "Entry: Deck editor: $DECK_EDITOR_URL"
echo "Entry: Theme preview: $THEME_PREVIEW_URL"
echo "Entry: Theme preview print: $THEME_PREVIEW_PRINT_URL"
echo "Entry: Landing page: $INDEX_URL"
echo "Open Img Generator HMI: $IMG_GENERATOR_HMI_URL"
echo "Img Generator API (mounted): $IMG_GENERATOR_API_URL"
echo "Open static preview (no API): $STATIC_URL"
echo "Health check: http://localhost:$API_PORT/health"

WSL_IP=""
if is_wsl; then
  WSL_IP="$(get_wsl_ip)"
fi

if [ -n "$WSL_IP" ]; then
  HMI_URL="${HMI_URL}&wsl_ip=${WSL_IP}"
  PROJECTOR_URL="${PROJECTOR_URL}&wsl_ip=${WSL_IP}"
  DATA_TOOLS_URL="${DATA_TOOLS_URL}&wsl_ip=${WSL_IP}"
  SETTINGS_URL="${SETTINGS_URL}&wsl_ip=${WSL_IP}"
  VERSION_MANAGER_URL="${VERSION_MANAGER_URL}&wsl_ip=${WSL_IP}"
  DECK_EDITOR_URL="${DECK_EDITOR_URL}&wsl_ip=${WSL_IP}"
  THEME_PREVIEW_URL="${THEME_PREVIEW_URL}&wsl_ip=${WSL_IP}"
  THEME_PREVIEW_PRINT_URL="${THEME_PREVIEW_PRINT_URL}&wsl_ip=${WSL_IP}"
  INDEX_URL="${INDEX_URL}&wsl_ip=${WSL_IP}"
  IMG_GENERATOR_HMI_URL="${IMG_GENERATOR_HMI_URL}&wsl_ip=${WSL_IP}"
  STATIC_URL="${STATIC_URL}&wsl_ip=${WSL_IP}"
  WINDOWS_HMI_URL="http://$WSL_IP:$API_PORT/hmi/clarksoft_hmi_presenter.html$API_QUERY"
  WINDOWS_PROJECTOR_URL="http://$WSL_IP:$API_PORT/hmi/clarksoft_projector_hmi.html$API_QUERY"
  WINDOWS_DATA_TOOLS_URL="http://$WSL_IP:$API_PORT/hmi/hmi_data_tools.html$API_QUERY"
  WINDOWS_SETTINGS_URL="http://$WSL_IP:$API_PORT/hmi/settings.html$API_QUERY"
  WINDOWS_VERSION_MANAGER_URL="http://$WSL_IP:$API_PORT/hmi/version_manager.html$API_QUERY"
  WINDOWS_DECK_EDITOR_URL="http://$WSL_IP:$API_PORT/hmi/deck_editor.html$API_QUERY"
  WINDOWS_THEME_PREVIEW_URL="http://$WSL_IP:$API_PORT/hmi/quality_irrigation_theme_preview.html$API_QUERY"
  WINDOWS_THEME_PREVIEW_PRINT_URL="http://$WSL_IP:$API_PORT/hmi/quality_irrigation_theme_preview_print.html$API_QUERY"
  WINDOWS_INDEX_URL="http://$WSL_IP:$API_PORT/hmi/index.html$API_QUERY"
  WINDOWS_IMG_GENERATOR_HMI_URL="http://$WSL_IP:$API_PORT/img-generator/hmi/index.html$API_QUERY"
  WINDOWS_STATIC_URL="http://$WSL_IP:$HMI_PORT/src/clarksoft_hmi_presenter.html$API_QUERY"
  echo "Entry (Windows): Presenter console: $WINDOWS_HMI_URL"
  echo "Entry (Windows): Projector view: $WINDOWS_PROJECTOR_URL"
  echo "Entry (Windows): Data tools: $WINDOWS_DATA_TOOLS_URL"
  echo "Entry (Windows): Settings: $WINDOWS_SETTINGS_URL"
  echo "Entry (Windows): Version manager: $WINDOWS_VERSION_MANAGER_URL"
  echo "Entry (Windows): Deck editor: $WINDOWS_DECK_EDITOR_URL"
  echo "Entry (Windows): Theme preview: $WINDOWS_THEME_PREVIEW_URL"
  echo "Entry (Windows): Theme preview print: $WINDOWS_THEME_PREVIEW_PRINT_URL"
  echo "Entry (Windows): Landing page: $WINDOWS_INDEX_URL"
  echo "Open Img Generator HMI (Windows browser): $WINDOWS_IMG_GENERATOR_HMI_URL"
  echo "Open static preview (Windows browser): $WINDOWS_STATIC_URL"
fi

MCP_BASE_URL="$HMI_URL"

cd "$API_ROOT"
MCP_CMD=(bash /mnt/g/ClarkSoft/scripts/use_project_db.sh hmi_presenter \
  bash /mnt/g/ClarkSoft/scripts/ensure_venv.sh \
  env PYTHONPATH="$API_ROOT" \
  python -m src.mcp_wrapper \
    --host 0.0.0.0 \
    --port "$MCP_PORT" \
    --hmi-base-url "$MCP_BASE_URL")
API_CMD=(bash /mnt/g/ClarkSoft/scripts/use_project_db.sh hmi_presenter \
  bash /mnt/g/ClarkSoft/scripts/ensure_venv.sh \
  env PYTHONPATH="$API_ROOT" \
  uvicorn src.app:app --reload --host 0.0.0.0 --port "$API_PORT" --app-dir "$API_ROOT")

(
  "${MCP_CMD[@]}" &
) &
MCP_PID=$!
echo "MCP server running on http://0.0.0.0:$MCP_PORT"

if [ "$VERIFY_RENDER" = "true" ] || [ "$OPEN_BROWSER" = "true" ]; then
  "${API_CMD[@]}" &
  API_PID=$!
  if ! wait_for_health "http://localhost:$API_PORT/health"; then
    if [ "$VERIFY_RENDER" = "true" ]; then
      echo "API health check failed on port $API_PORT." >&2
      exit 1
    fi
    echo "API health check failed on port $API_PORT; continuing." >&2
  fi
  if [ "$OPEN_BROWSER" = "true" ] && [ -n "${WINDOWS_HMI_URL:-}" ] && command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "" "$WINDOWS_HMI_URL" >/dev/null 2>&1 || true
  fi
  if [ "$VERIFY_RENDER" = "true" ]; then
    "$API_ROOT/scripts/verify_hmi_render.sh" --url "$HMI_URL"
  fi
  wait "$API_PID"
else
  exec "${API_CMD[@]}"
fi
