#!/usr/bin/env bash
set -euo pipefail
cd /home/team/shared/site

echo "=== Checking .env ==="
ls -la .env
echo ""

echo "=== Checking STRIPE_SECRET_KEY ==="
source .env 2>/dev/null || true
echo "KEY present: $([ -n "$STRIPE_SECRET_KEY" ] && echo YES || echo NO)"
echo "KEY length: ${#STRIPE_SECRET_KEY}"
echo ""

echo "=== Checking server ==="
curl -s -o /dev/null -w "Homepage: HTTP %{http_code}\n" http://localhost:3000/ || echo "Server not responding on port 3000"

echo "=== Checking api/billing ==="
curl -s http://localhost:3000/api/billing 2>&1 || echo "API billing not responding"

echo ""
echo "=== Server log (last 15 lines) ==="
tail -15 /home/team/shared/site/.run/server.log 2>/dev/null || echo "No server log yet"
