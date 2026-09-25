#!/usr/bin/env bash
# Daily sip-quant job for cron (Linux/macOS) or launchd (macOS).
# Sends the monthly report on the first trading day of the month, and alerts any day.
# Set SIPQUANT_PYTHON to your environment's python, e.g. the output of
#   conda activate sipquant && which python
set -euo pipefail
cd "$(dirname "$0")/.."
PYTHON="${SIPQUANT_PYTHON:-python3}"
mkdir -p logs
echo "=== $(date) ===" >> logs/notify.log
"$PYTHON" -m sipquant.notify daily >> logs/notify.log 2>&1
