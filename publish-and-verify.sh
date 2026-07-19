#!/usr/bin/env bash
# PageSnap Stripe billing verification
# Run: bash /home/team/shared/site/publish-and-verify.sh
set -euo pipefail
cd /home/team/shared/site

echo "============================================"
echo "PageSnap Stripe Billing Verification"
echo "============================================"
echo ""

# 1. Verify .env exists with real keys
echo "--- .env file ---"
if [ -f .env ]; then
  echo "OK: .env exists"
  source .env
  echo "  STRIPE_SECRET_KEY present: $([ -n "$STRIPE_SECRET_KEY" ] && echo YES || echo NO)"
  echo "  STRIPE_WEBHOOK_SECRET present: $([ -n "$STRIPE_WEBHOOK_SECRET" ] && echo YES || echo NO)"
  echo "  STRIPE_PRO_PRICE_ID: ${STRIPE_PRO_PRICE_ID:-NOT SET}"
  echo "  STRIPE_SCALE_PRICE_ID: ${STRIPE_SCALE_PRICE_ID:-NOT SET}"
else
  echo "FAIL: .env not found!"
  exit 1
fi
echo ""

# 2. Kill old server and republish
echo "--- Publishing ---"
sudo sh -c 'lsof -t -iTCP:3000 -sTCP:LISTEN | xargs -r kill' 2>/dev/null || true
sleep 0.5
bun run publish
echo ""

# 3. Wait for server
echo "--- Waiting for server ---"
for i in $(seq 1 30); do
  if curl -sf -o /dev/null http://localhost:3000/ 2>/dev/null; then
    echo "OK: Server responding on port 3000"
    break
  fi
  sleep 0.5
done
echo ""

# 4. Check server log for stub warnings
echo "--- Server log (stripe-related) ---"
if [ -f .run/server.log ]; then
  if grep -i "stub mode" .run/server.log 2>/dev/null; then
    echo "WARNING: Server is in STUB MODE!"
  else
    echo "OK: No stub mode warnings found"
  fi
  echo ""
  echo "Last 10 lines of server log:"
  tail -10 .run/server.log 2>/dev/null || echo "(binary or unreadable)"
else
  echo "No server log found at .run/server.log"
fi
echo ""

# 5. Test GET /api/billing (needs auth, expect 401)
echo "--- GET /api/billing ---"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/billing)
echo "  HTTP $HTTP (401 = expected for unauthenticated)"
echo ""

# 6. Test POST /api/billing/upgrade validation
echo "--- POST /api/billing/upgrade (validation) ---"

# No body
echo -n "  No body: "
curl -s http://localhost:3000/api/billing/upgrade -X POST -H "Content-Type: application/json" -d '{}' | head -c 200
echo ""

# Bad tier
echo -n "  Bad tier: "
curl -s http://localhost:3000/api/billing/upgrade -X POST -H "Content-Type: application/json" -d '{"tier":"free"}' | head -c 200
echo ""

# Missing auth (no API key header)
echo -n "  No auth: "
curl -s http://localhost:3000/api/billing/upgrade -X POST -H "Content-Type: application/json" -d '{"tier":"pro"}' | head -c 200
echo ""

# 7. Test POST /api/webhook validation
echo ""
echo "--- POST /api/webhook ---"
echo -n "  Missing signature: "
curl -s http://localhost:3000/api/webhook -X POST -H "Content-Type: application/json" -d '{}' | head -c 200
echo ""

echo ""
echo "============================================"
echo "Verification complete"
echo "============================================"
echo ""
echo "Key checks:"
echo "  1. Server log should NOT contain 'stub mode'"
echo "  2. /api/billing/upgrade with bad tier should return 400"
echo "  3. /api/billing/upgrade without auth should return 401"
echo "  4. /api/webhook without signature should return 400"
