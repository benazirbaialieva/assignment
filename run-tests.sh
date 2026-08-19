#!/usr/bin/env bash
#
# One-shot test runner.
#
#   ./run-tests.sh                 # every scenario
#   ./run-tests.sh @api            # only scenarios tagged @api
#   ./run-tests.sh "@ui and not @slow"
#   ./run-tests.sh @auth --no-open # do not open the HTML report at the end
#
# Starts the mock backend and frontend (reusing them if they are already up),
# runs the Cucumber suite headless, writes the reports and then summarises
# them — including any failure screenshots.

set -uo pipefail

cd "$(dirname "$0")"

API_URL="${API_BASE_URL:-http://127.0.0.1:4000}"
WEB_URL="${BASE_URL:-http://127.0.0.1:5173}"
REPORTS_DIR="${REPORTS_DIR:-reports}"
LOG_DIR="$REPORTS_DIR/logs"

TAG=""
OPEN_REPORT=true
for arg in "$@"; do
  case "$arg" in
    --no-open) OPEN_REPORT=false ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) TAG="$arg" ;;
  esac
done

# Servers this script started itself; only these get stopped on exit.
STARTED_PIDS=()

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
info() { printf '  %s\n' "$1"; }

cleanup() {
  for pid in "${STARTED_PIDS[@]:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      wait "$pid" 2>/dev/null
    fi
  done
  (( ${#STARTED_PIDS[@]:-0} > 0 )) && info "stopped services started by this run"
}
trap cleanup EXIT

is_up() { curl -sf -o /dev/null --max-time 2 "$1"; }
port_of() { sed -E 's|.*://[^:/]+:([0-9]+).*|\1|' <<<"$1"; }

# start_service <name> <directory> <url> <logfile> <port> <entrypoint>
start_service() {
  local name="$1" directory="$2" url="$3" logfile="$4" port="$5" entrypoint="$6"

  if is_up "$url"; then
    info "$name already running at $url"
    return 0
  fi

  # Only the API server has dependencies; skip the install when there are none.
  if grep -q '"dependencies"' "$directory/package.json" && [[ ! -d "$directory/node_modules" ]]; then
    info "installing $name dependencies…"
    (cd "$directory" && npm install --silent) || { echo "npm install failed for $name"; exit 1; }
  fi

  # node directly rather than `npm start`, so the pid we record is the pid we
  # can stop again on exit.
  (cd "$directory" && PORT="$port" API_BASE_URL="$API_URL" exec node "$entrypoint" >"../$logfile" 2>&1) &
  STARTED_PIDS+=("$!")

  for _ in $(seq 1 40); do
    is_up "$url" && { info "$name started at $url"; return 0; }
    sleep 0.25
  done

  echo "ERROR: $name did not come up at $url — see $logfile"
  exit 1
}

bold "1/4  Preparing"
rm -rf "$REPORTS_DIR"
mkdir -p "$LOG_DIR"
info "cleared $REPORTS_DIR/"

bold "2/4  Starting services"
start_service "mock-server"   "mock-server"   "$API_URL/health" "$LOG_DIR/mock-server.log"   "$(port_of "$API_URL")" "src/server.js"
start_service "mock-frontend" "mock-frontend" "$WEB_URL"        "$LOG_DIR/mock-frontend.log" "$(port_of "$WEB_URL")" "server.js"

bold "3/4  Running scenarios"
if [[ -n "$TAG" ]]; then
  info "tag: $TAG"
  HEADLESS=true npx cucumber-js --tags "$TAG"
else
  info "tag: (all scenarios)"
  HEADLESS=true npx cucumber-js
fi
STATUS=$?

bold "4/4  Reports"
for report in \
  "$REPORTS_DIR/cucumber-report.html:HTML report" \
  "$REPORTS_DIR/cucumber-report.json:Cucumber JSON" \
  "$REPORTS_DIR/junit-report.xml:JUnit XML" \
  "$REPORTS_DIR/cucumber-messages.ndjson:Cucumber messages" \
  "$REPORTS_DIR/run.log:Run log (all)" \
  "$REPORTS_DIR/api.log:API request log"
do
  file="${report%%:*}"
  label="${report##*:}"
  [[ -f "$file" ]] && info "$(printf '%-18s %s' "$label" "$file")"
done

shopt -s nullglob
SCREENSHOTS=("$REPORTS_DIR"/screenshots/*.png)
shopt -u nullglob

if (( ${#SCREENSHOTS[@]} > 0 )); then
  bold "Failure screenshots (${#SCREENSHOTS[@]})"
  for shot in "${SCREENSHOTS[@]}"; do info "$shot"; done
fi

shopt -s nullglob
TRACES=("$REPORTS_DIR"/traces/*.zip)
shopt -u nullglob

if (( ${#TRACES[@]} > 0 )); then
  bold "Traces (${#TRACES[@]})"
  for trace in "${TRACES[@]}"; do info "npx playwright show-trace $trace"; done
fi

if (( STATUS != 0 )) && [[ -f "$REPORTS_DIR/run.log" ]]; then
  bold "Errors from the log"
  node -e '
    const entries = require("fs").readFileSync(process.argv[1], "utf8").trim().split("\n")
      .flatMap((line) => { try { return [JSON.parse(line)] } catch { return [] } })
      .filter((entry) => entry.level === "error");
    [...new Set(entries.map((entry) => `${entry.source}: ${entry.message}`))]
      .slice(-10).forEach((line) => console.log(`  ${line}`));
  ' "$REPORTS_DIR/run.log"
fi

if [[ "$OPEN_REPORT" == true && -z "${CI:-}" && -f "$REPORTS_DIR/cucumber-report.html" ]]; then
  if command -v open >/dev/null; then
    open "$REPORTS_DIR/cucumber-report.html"
    for shot in "${SCREENSHOTS[@]}"; do open "$shot"; done
  elif command -v xdg-open >/dev/null; then
    xdg-open "$REPORTS_DIR/cucumber-report.html" >/dev/null 2>&1
  fi
fi

if (( STATUS == 0 )); then
  bold "PASSED"
else
  bold "FAILED (exit $STATUS)"
fi
exit $STATUS
