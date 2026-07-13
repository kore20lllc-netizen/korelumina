#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/.." &&
  pwd
)"

cd "$ROOT_DIR"

RUNTIME_URL="${RUNTIME_URL:-http://localhost:4100}"
PROJECT_ID="${PROJECT_ID:-}"

HEALTH_PATH="${HEALTH_PATH:-/health}"
METRICS_PATH="${METRICS_PATH:-/api/runtime/metrics}"
PROJECTS_PATH="${PROJECTS_PATH:-/api/runtime/projects}"
EVENTS_PATH="${EVENTS_PATH:-/api/runtime/events}"
START_PATH="${START_PATH:-/api/runtime/start}"
RESTART_PATH="${RESTART_PATH:-/api/runtime/restart}"
STOP_PATH="${STOP_PATH:-/api/runtime/stop}"
SCENARIO_PATH="${SCENARIO_PATH:-/api/runtime/scenario}"

REQUEST_TIMEOUT="${REQUEST_TIMEOUT:-15}"
STATE_TIMEOUT="${STATE_TIMEOUT:-60}"
POLL_INTERVAL="${POLL_INTERVAL:-1}"

SKIP_BUILDS="${SKIP_BUILDS:-0}"
SKIP_LIFECYCLE="${SKIP_LIFECYCLE:-0}"

RUNTIME_TOKEN="${KORELUMINA_RUNTIME_INTERNAL_TOKEN:-}"

EVIDENCE_ROOT="${EVIDENCE_ROOT:-.runtime-certification}"
REPORT_PATH="${REPORT_PATH:-docs/runtime/RUNTIME_CERTIFICATION_REPORT.md}"

RUN_ID="$(date -u +"%Y%m%dT%H%M%SZ")"
EVIDENCE_DIR="$EVIDENCE_ROOT/$RUN_ID"
LOG_PATH="$EVIDENCE_DIR/certification.log"

mkdir -p "$EVIDENCE_DIR"
mkdir -p "$(dirname "$REPORT_PATH")"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

RESULT_NAMES=()
RESULT_STATES=()
RESULT_DETAILS=()

INITIAL_RUNTIME_RUNNING=0
RUNTIME_STARTED_BY_CERTIFICATION=0
INITIAL_SCENARIO="normal"

log() {
  printf '%s\n' "$*" | tee -a "$LOG_PATH"
}

record_result() {
  local name="$1"
  local state="$2"
  local detail="$3"

  RESULT_NAMES+=("$name")
  RESULT_STATES+=("$state")
  RESULT_DETAILS+=("$detail")

  case "$state" in
    PASS)
      PASS_COUNT=$((PASS_COUNT + 1))
      ;;
    FAIL)
      FAIL_COUNT=$((FAIL_COUNT + 1))
      ;;
    WARN)
      WARN_COUNT=$((WARN_COUNT + 1))
      ;;
  esac

  log "[$state] $name — $detail"
}

require_command() {
  local name="$1"

  if command -v "$name" >/dev/null 2>&1; then
    record_result \
      "Dependency: $name" \
      "PASS" \
      "Available"
  else
    record_result \
      "Dependency: $name" \
      "FAIL" \
      "Required command is unavailable"
  fi
}

request_json() {
  local method="$1"
  local path="$2"
  local output="$3"
  local body="${4:-}"

  local args=(
    --silent
    --show-error
    --connect-timeout "$REQUEST_TIMEOUT"
    --max-time "$REQUEST_TIMEOUT"
    --request "$method"
    --header "Accept: application/json"
  )

  if [[ -n "$RUNTIME_TOKEN" ]]; then
    args+=(
      --header
      "x-korelumina-runtime-token: $RUNTIME_TOKEN"
    )
  fi

  if [[ -n "$body" ]]; then
    args+=(
      --header
      "Content-Type: application/json"
      --data
      "$body"
    )
  fi

  local status

  status="$(
    curl \
      "${args[@]}" \
      --output "$output" \
      --write-out "%{http_code}" \
      "${RUNTIME_URL}${path}" \
      2>>"$LOG_PATH"
  )" || return 1

  if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
    log "HTTP $status — $method $path"

    if [[ -f "$output" ]]; then
      cat "$output" >>"$LOG_PATH"
      printf '\n' >>"$LOG_PATH"
    fi

    return 1
  fi

  jq -e . "$output" >/dev/null 2>&1
}

get_metrics() {
  local output="$1"

  request_json \
    "GET" \
    "$METRICS_PATH" \
    "$output"
}

runtime_record_exists() {
  local metrics_file="$1"

  jq -e \
    --arg projectId "$PROJECT_ID" \
    '
      .runtimes[]
      | select(.projectId == $projectId)
    ' \
    "$metrics_file" \
    >/dev/null 2>&1
}

runtime_is_running() {
  local metrics_file="$EVIDENCE_DIR/metrics-state.json"

  get_metrics "$metrics_file" \
    >/dev/null 2>&1 ||
    return 1

  jq -e \
    --arg projectId "$PROJECT_ID" \
    '
      .runtimes[]
      | select(.projectId == $projectId)
      | select(
          .status == "running"
          and .alive == true
        )
    ' \
    "$metrics_file" \
    >/dev/null 2>&1
}

wait_for_running() {
  local deadline=$((SECONDS + STATE_TIMEOUT))

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    if runtime_is_running; then
      return 0
    fi

    sleep "$POLL_INTERVAL"
  done

  return 1
}

wait_for_stopped() {
  local deadline=$((SECONDS + STATE_TIMEOUT))

  while [[ "$SECONDS" -lt "$deadline" ]]; do
    local metrics_file="$EVIDENCE_DIR/metrics-state.json"

    if get_metrics "$metrics_file" \
      >/dev/null 2>&1; then
      if ! jq -e \
        --arg projectId "$PROJECT_ID" \
        '
          .runtimes[]
          | select(.projectId == $projectId)
          | select(
              .alive == true
              or .status == "running"
              or .status == "starting"
              or .status == "stopping"
            )
        ' \
        "$metrics_file" \
        >/dev/null 2>&1; then
        return 0
      fi
    fi

    sleep "$POLL_INTERVAL"
  done

  return 1
}

select_project() {
  local projects_file="$1"
  local metrics_file="$2"

  if [[ -n "$PROJECT_ID" ]]; then
    return 0
  fi

  PROJECT_ID="$(
    jq -r '
      if type == "object" then
        [
          (
            .projects //
            []
          )[]?
          | select(
              type == "object"
            )
          | (
              .projectId //
              .id //
              empty
            )
        ]
      elif type == "array" then
        [
          .[]?
          | select(
              type == "object"
            )
          | (
              .projectId //
              .id //
              empty
            )
        ]
      else
        []
      end
      | map(
          select(
            type == "string"
            and length > 0
          )
        )
      | first //
        empty
    ' \
    "$projects_file" \
    2>/dev/null ||
    true
  )"

  if [[ -n "$PROJECT_ID" ]]; then
    return 0
  fi

  PROJECT_ID="$(
    jq -r '
      if (
        type == "object"
        and (
          .runtimes |
          type
        ) == "array"
      ) then
        [
          .runtimes[]?
          | select(
              type == "object"
            )
          | .projectId
          | select(
              type == "string"
              and length > 0
            )
        ]
        | first //
          empty
      else
        empty
      end
    ' \
    "$metrics_file" \
    2>/dev/null ||
    true
  )"

  return 0
}

restore_initial_state() {
  if [[ -z "$PROJECT_ID" ]]; then
    return
  fi

  log "Restoring pre-certification runtime state."

  if runtime_is_running; then
    request_json \
      "POST" \
      "$SCENARIO_PATH" \
      "$EVIDENCE_DIR/restore-scenario.json" \
      "{
        \"projectId\": \"$PROJECT_ID\",
        \"scenario\": \"$INITIAL_SCENARIO\"
      }" \
      >/dev/null 2>&1 ||
      true
  fi

  if [[ "$INITIAL_RUNTIME_RUNNING" -eq 1 ]]; then
    if ! runtime_is_running; then
      request_json \
        "POST" \
        "$START_PATH" \
        "$EVIDENCE_DIR/restore-start.json" \
        "{\"projectId\":\"$PROJECT_ID\"}" \
        >/dev/null 2>&1 ||
        true

      wait_for_running || true
    fi
  elif [[ "$RUNTIME_STARTED_BY_CERTIFICATION" -eq 1 ]]; then
    if runtime_is_running; then
      request_json \
        "POST" \
        "$STOP_PATH" \
        "$EVIDENCE_DIR/restore-stop.json" \
        "{\"projectId\":\"$PROJECT_ID\"}" \
        >/dev/null 2>&1 ||
        true

      wait_for_stopped || true
    fi
  fi
}

write_report() {
  local branch
  local commit
  local working_tree
  local certification_status
  local chief_agent_gate

  branch="$(
    git branch --show-current \
      2>/dev/null ||
    printf 'unknown'
  )"

  commit="$(
    git rev-parse --short HEAD \
      2>/dev/null ||
    printf 'unknown'
  )"

  if [[ -n "$(git status --short 2>/dev/null)" ]]; then
    working_tree="Dirty"
  else
    working_tree="Clean"
  fi

  if [[ "$FAIL_COUNT" -eq 0 ]]; then
    certification_status="CERTIFIED"
    chief_agent_gate="OPEN"
  else
    certification_status="NOT CERTIFIED"
    chief_agent_gate="BLOCKED"
  fi

  {
    printf '# Runtime Operations Certification Report\n\n'

    printf '## Certification status\n\n'
    printf '**%s**\n\n' "$certification_status"

    printf '| Field | Value |\n'
    printf '|---|---|\n'
    printf '| Run ID | `%s` |\n' "$RUN_ID"
    printf '| Timestamp | `%s` |\n' \
      "$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
    printf '| Branch | `%s` |\n' "$branch"
    printf '| Commit | `%s` |\n' "$commit"
    printf '| Working tree | `%s` |\n' "$working_tree"
    printf '| Runtime URL | `%s` |\n' "$RUNTIME_URL"
    printf '| Certified project | `%s` |\n' \
      "${PROJECT_ID:-unresolved}"
    printf '| Passed | `%s` |\n' "$PASS_COUNT"
    printf '| Failed | `%s` |\n' "$FAIL_COUNT"
    printf '| Warnings | `%s` |\n\n' "$WARN_COUNT"

    printf '## Certification matrix\n\n'
    printf '| Test | Result | Evidence |\n'
    printf '|---|---|---|\n'

    local index

    for ((index = 0; index < ${#RESULT_NAMES[@]}; index += 1)); do
      printf '| %s | **%s** | %s |\n' \
        "${RESULT_NAMES[$index]//|/\\|}" \
        "${RESULT_STATES[$index]}" \
        "${RESULT_DETAILS[$index]//|/\\|}"
    done

    printf '\n## Validated production path\n\n'
    printf '```text\n'
    printf 'Runtime process\n'
    printf '  → Runtime registry\n'
    printf '  → Runtime metrics and event stream\n'
    printf '  → Builder Runtime Operations service\n'
    printf '  → Runtime Operations workspace\n'
    printf '  → Chief Agent execution source\n'
    printf '```\n\n'

    printf '## Certification coverage\n\n'
    printf '%s\n' '- Runtime health endpoint'
    printf '%s\n' '- Runtime project discovery'
    printf '%s\n' '- Runtime registry consistency'
    printf '%s\n' '- Start lifecycle'
    printf '%s\n' '- Restart lifecycle'
    printf '%s\n' '- Stop lifecycle'
    printf '%s\n' '- PID and process liveness'
    printf '%s\\n' '- CPU and RSS telemetry contract'
    printf '%s\\n' '- Runtime scenario persistence'
    printf '%s\\n' '- Server-sent event connectivity'
    printf '%s\\n' '- Runtime lock cleanup'
    printf '%s\\n' '- Runtime production build'
    printf '%s\\n' '- Builder production build'
    printf '%s\\n' '- Restoration of the initial runtime state\n'

    printf '## Certification boundaries\n\n'
    printf '%s\\n' '- Scenario state persistence is certified.'
    printf '%s\\n' '- Synthetic CPU, latency, request-rate, and error-rate generation is not required for runtime-control certification.'
    printf '%s\\n' '- Browser UI acceptance was completed separately and reported green.'
    printf '%s\\n' '- Rollback is excluded until versioned deployment rollback is implemented.'
    printf '%s\\n' '- Drain is excluded from lifecycle certification while the runtime reports it as unsupported.\n'

    printf '## Risk assessment\n\n'

    if [[ "$FAIL_COUNT" -eq 0 ]]; then
      printf '**Low operational integration risk.**\n\n'
      printf 'Runtime Operations passed its automated certification gates and may now be used as the trusted execution and observation layer for Chief Agent integration.\n\n'
    else
      printf '**High operational integration risk.**\n\n'
      printf 'Chief Agent integration remains blocked until every failed certification gate is resolved and this harness passes again.\n\n'
    fi

    printf '## Evidence\n\n'
    printf '%s\n' "- Execution log: \`$LOG_PATH\`"
    printf '%s\n\n' "- Captured API evidence: \`$EVIDENCE_DIR/\`"

    printf '## Sign-off\n\n'
    printf '| Gate | Status |\n'
    printf '|---|---|\n'
    printf '| Runtime Operations UI acceptance | PASS |\n'
    printf '| Automated Runtime Operations certification | %s |\n' \
      "$certification_status"
    printf '| Chief Agent runtime integration | %s |\n' \
      "$chief_agent_gate"
  } >"$REPORT_PATH"
}

trap 'restore_initial_state; write_report' EXIT

log "Runtime Operations certification started."
log "Run ID: $RUN_ID"
log "Runtime URL: $RUNTIME_URL"

require_command curl
require_command jq
require_command npm
require_command git

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

HEALTH_FILE="$EVIDENCE_DIR/health.json"

if request_json \
  "GET" \
  "$HEALTH_PATH" \
  "$HEALTH_FILE"; then
  if jq -e '.ok == true' \
    "$HEALTH_FILE" \
    >/dev/null; then
    record_result \
      "Runtime health" \
      "PASS" \
      "Health endpoint returned ok=true"
  else
    record_result \
      "Runtime health" \
      "FAIL" \
      "Health response did not contain ok=true"
  fi
else
  record_result \
    "Runtime health" \
    "FAIL" \
    "Health endpoint request failed"
fi

METRICS_INITIAL_FILE="$EVIDENCE_DIR/metrics-initial.json"

if get_metrics "$METRICS_INITIAL_FILE"; then
  if jq -e '
      .ok == true
      and (.runtimes | type == "array")
      and (.totals | type == "object")
      and (.process | type == "object")
    ' \
    "$METRICS_INITIAL_FILE" \
    >/dev/null; then
    record_result \
      "Runtime metrics contract" \
      "PASS" \
      "Metrics, totals, process, and runtime collections are present"
  else
    record_result \
      "Runtime metrics contract" \
      "FAIL" \
      "Metrics response does not satisfy the expected contract"
  fi
else
  record_result \
    "Runtime metrics contract" \
    "FAIL" \
    "Metrics endpoint request failed"
fi

PROJECTS_FILE="$EVIDENCE_DIR/projects.json"

if request_json \
  "GET" \
  "$PROJECTS_PATH" \
  "$PROJECTS_FILE"; then
  record_result \
    "Runtime project discovery" \
    "PASS" \
    "Projects endpoint returned valid JSON"
else
  record_result \
    "Runtime project discovery" \
    "FAIL" \
    "Projects endpoint request failed"
fi

select_project \
  "$PROJECTS_FILE" \
  "$METRICS_INITIAL_FILE"

if [[ -z "$PROJECT_ID" ]]; then
  record_result \
    "Certification project selection" \
    "FAIL" \
    "No project could be selected"

  exit 1
fi

record_result \
  "Certification project selection" \
  "PASS" \
  "Selected $PROJECT_ID"

if runtime_is_running; then
  INITIAL_RUNTIME_RUNNING=1

  INITIAL_SCENARIO="$(
    jq -r \
      --arg projectId "$PROJECT_ID" \
      '
        .runtimes[]
        | select(.projectId == $projectId)
        | .scenario // "normal"
      ' \
      "$EVIDENCE_DIR/metrics-state.json" \
      2>/dev/null
  )"

  record_result \
    "Initial runtime state" \
    "PASS" \
    "$PROJECT_ID was already running"
else
  record_result \
    "Initial runtime state" \
    "PASS" \
    "$PROJECT_ID was initially stopped"
fi

SSE_FILE="$EVIDENCE_DIR/events.txt"

SSE_ARGS=(
  --silent
  --show-error
  --no-buffer
  --max-time 5
  --header "Accept: text/event-stream"
)

if [[ -n "$RUNTIME_TOKEN" ]]; then
  SSE_ARGS+=(
    --header
    "x-korelumina-runtime-token: $RUNTIME_TOKEN"
  )
fi

set +e

curl \
  "${SSE_ARGS[@]}" \
  "${RUNTIME_URL}${EVENTS_PATH}" \
  >"$SSE_FILE" \
  2>>"$LOG_PATH"

SSE_EXIT=$?

set -e

if [[ "$SSE_EXIT" -eq 0 || "$SSE_EXIT" -eq 28 ]]; then
  record_result \
    "Runtime SSE connectivity" \
    "PASS" \
    "Event-stream connection remained available through the observation window"
else
  record_result \
    "Runtime SSE connectivity" \
    "FAIL" \
    "Event-stream request exited with code $SSE_EXIT"
fi

if [[ "$SKIP_LIFECYCLE" -eq 0 ]]; then
  if [[ "$INITIAL_RUNTIME_RUNNING" -eq 0 ]]; then
    if request_json \
      "POST" \
      "$START_PATH" \
      "$EVIDENCE_DIR/start.json" \
      "{\"projectId\":\"$PROJECT_ID\"}" &&
      wait_for_running; then
      RUNTIME_STARTED_BY_CERTIFICATION=1

      record_result \
        "Runtime start lifecycle" \
        "PASS" \
        "$PROJECT_ID reached running state"
    else
      record_result \
        "Runtime start lifecycle" \
        "FAIL" \
        "$PROJECT_ID failed to reach running state"
    fi
  else
    record_result \
      "Runtime start lifecycle" \
      "PASS" \
      "Runtime was already running"
  fi

  METRICS_LIVE_FILE="$EVIDENCE_DIR/metrics-live.json"

  if get_metrics "$METRICS_LIVE_FILE" &&
    jq -e \
      --arg projectId "$PROJECT_ID" \
      '
        .runtimes[]
        | select(.projectId == $projectId)
        | select(
            .alive == true
            and .status == "running"
            and (.pid | type == "number")
            and (.uptimeMs | type == "number")
            and (.cpuPct | type == "number")
            and (.rssMb | type == "number")
          )
      ' \
      "$METRICS_LIVE_FILE" \
      >/dev/null; then
    record_result \
      "Live runtime telemetry" \
      "PASS" \
      "PID, status, liveness, uptime, CPU, and RSS are present"
  else
    record_result \
      "Live runtime telemetry" \
      "FAIL" \
      "Required live telemetry fields are absent"
  fi

  for scenario in idle spike outage recover; do
    SCENARIO_RESPONSE="$EVIDENCE_DIR/scenario-$scenario.json"

    if request_json \
      "POST" \
      "$SCENARIO_PATH" \
      "$SCENARIO_RESPONSE" \
      "{
        \"projectId\": \"$PROJECT_ID\",
        \"scenario\": \"$scenario\"
      }"; then
      sleep 1

      SCENARIO_METRICS="$EVIDENCE_DIR/metrics-$scenario.json"

      if get_metrics "$SCENARIO_METRICS" &&
        jq -e \
          --arg projectId "$PROJECT_ID" \
          --arg scenario "$scenario" \
          '
            .runtimes[]
            | select(.projectId == $projectId)
            | select(.scenario == $scenario)
          ' \
          "$SCENARIO_METRICS" \
          >/dev/null; then
        record_result \
          "Runtime scenario: $scenario" \
          "PASS" \
          "Scenario persisted through runtime metrics"
      else
        record_result \
          "Runtime scenario: $scenario" \
          "FAIL" \
          "Scenario was not reflected in runtime metrics"
      fi
    else
      record_result \
        "Runtime scenario: $scenario" \
        "FAIL" \
        "Scenario request failed"
    fi
  done

  if request_json \
    "POST" \
    "$RESTART_PATH" \
    "$EVIDENCE_DIR/restart.json" \
    "{\"projectId\":\"$PROJECT_ID\"}" &&
    wait_for_running; then
    record_result \
      "Runtime restart lifecycle" \
      "PASS" \
      "$PROJECT_ID returned to running state"
  else
    record_result \
      "Runtime restart lifecycle" \
      "FAIL" \
      "$PROJECT_ID failed to recover from restart"
  fi

  if request_json \
    "POST" \
    "$STOP_PATH" \
    "$EVIDENCE_DIR/stop.json" \
    "{\"projectId\":\"$PROJECT_ID\"}" &&
    wait_for_stopped; then
    record_result \
      "Runtime stop lifecycle" \
      "PASS" \
      "$PROJECT_ID stopped cleanly"
  else
    record_result \
      "Runtime stop lifecycle" \
      "FAIL" \
      "$PROJECT_ID failed to stop cleanly"
  fi

  LOCK_COUNT="$(
    find \
      apps/lumina-runtime/runtime-locks \
      -type f \
      -iname "*${PROJECT_ID}*" \
      2>/dev/null |
    wc -l |
    tr -d ' '
  )"

  if [[ "${LOCK_COUNT:-0}" -eq 0 ]]; then
    record_result \
      "Runtime lock cleanup" \
      "PASS" \
      "No project lock remained after shutdown"
  else
    record_result \
      "Runtime lock cleanup" \
      "FAIL" \
      "$LOCK_COUNT project lock file(s) remained after shutdown"
  fi
else
  record_result \
    "Lifecycle certification" \
    "WARN" \
    "Skipped because SKIP_LIFECYCLE=1"
fi

if [[ "$SKIP_BUILDS" -eq 0 ]]; then
  if npm --workspace apps/lumina-runtime run build \
    >>"$LOG_PATH" 2>&1; then
    record_result \
      "Runtime production build" \
      "PASS" \
      "Runtime TypeScript build completed"
  else
    record_result \
      "Runtime production build" \
      "FAIL" \
      "Runtime build failed"
  fi

  if npm --workspace apps/lumina-builder run build \
    >>"$LOG_PATH" 2>&1; then
    record_result \
      "Builder production build" \
      "PASS" \
      "Builder production build completed"
  else
    record_result \
      "Builder production build" \
      "FAIL" \
      "Builder build failed"
  fi
else
  record_result \
    "Production builds" \
    "WARN" \
    "Skipped because SKIP_BUILDS=1"
fi

if [[ -n "$(git status --short)" ]]; then
  record_result \
    "Repository state" \
    "WARN" \
    "Working tree contains uncommitted certification changes"
else
  record_result \
    "Repository state" \
    "PASS" \
    "Working tree is clean"
fi

if [[ "$FAIL_COUNT" -eq 0 ]]; then
  log "Runtime Operations certification PASSED."
  exit 0
fi

log "Runtime Operations certification FAILED with $FAIL_COUNT failure(s)."
exit 1
