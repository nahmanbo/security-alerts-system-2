#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3000"

hit() {
  local method="${1}"; shift
  local url="${1}"; shift
  local data="${1-}"
  echo -e "\n===> ${method} ${url}"
  if [[ -n "${data}" ]]; then
    http_code=$(curl -s -o /tmp/out.json -w "%{http_code}" -X "${method}" -H "Content-Type: application/json" -d "${data}" "${url}")
  else
    http_code=$(curl -s -o /tmp/out.json -w "%{http_code}" -X "${method}" "${url}")
  fi
  echo "HTTP ${http_code}"
  cat /tmp/out.json | jq . || cat /tmp/out.json
}

# System
hit GET  "$BASE/health"
hit GET  "$BASE/info"

# Aircraft
hit GET  "$BASE/api/aircraft"
hit GET  "$BASE/api/aircraft/test"

# Monitor (כולל קונפליקטים 409)
hit POST "$BASE/api/monitor/start"        "{}"
hit GET  "$BASE/api/monitor/status"
hit POST "$BASE/api/monitor/manual"       "{}"
hit POST "$BASE/api/monitor/start"        "{}"   # should be 409
hit POST "$BASE/api/monitor/stop"         "{}"
hit POST "$BASE/api/monitor/stop"         "{}"   # should be 409

# Alerts
hit GET  "$BASE/api/alerts"
hit GET  "$BASE/api/alerts/active"
hit GET  "$BASE/api/alerts/stats"
hit POST "$BASE/api/alerts/analyze"       "{}"
hit GET  "$BASE/api/alerts/filtered?since=not-a-date"   # should be 400
hit GET  "$BASE/api/alerts/filtered?limit=10"
hit GET  "$BASE/api/alerts/history"
hit GET  "$BASE/api/alerts/history/range?startDate=2025-09-01&endDate=2025-09-17"
hit GET  "$BASE/api/alerts/daily/files"
