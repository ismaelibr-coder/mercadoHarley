#!/usr/bin/env bash
set -uo pipefail

# Smoke tests against a running backend instance (default: local dev on :3001).
# Unlike a curl-and-hope script, every check here asserts an HTTP status code
# (and, where cheap, response shape) and reports pass/fail — a broken endpoint
# makes this script exit non-zero instead of silently printing output nobody
# reads.
#
# Usage: BASE=https://www.sickgrip.com.br ./smoke-tests.sh

BASE="${BASE:-http://127.0.0.1:3001}"
HDR="X-Forwarded-Proto: https"

PASS=0
FAIL=0

# assert_status PATH EXPECTED_CODE [DESCRIPTION]
assert_status() {
    local path="$1" expected="$2" desc="${3:-$1}"
    local code
    code=$(curl -sS -o /tmp/smoke-body.$$ -w "%{http_code}" -H "$HDR" "$BASE$path")
    if [ "$code" = "$expected" ]; then
        echo "PASS  $desc (HTTP $code)"
        PASS=$((PASS + 1))
    else
        echo "FAIL  $desc (expected HTTP $expected, got $code)"
        head -c 300 /tmp/smoke-body.$$ 2>/dev/null
        echo ""
        FAIL=$((FAIL + 1))
    fi
    rm -f /tmp/smoke-body.$$
}

# assert_json_array PATH DESCRIPTION — checks the body parses as JSON and is
# either an array or an object with a `products`/`data` array field.
assert_json_array() {
    local path="$1" desc="${2:-$1}"
    local body
    body=$(curl -sS -H "$HDR" "$BASE$path")
    if echo "$body" | node -e "
        let d='';process.stdin.on('data',c=>d+=c);
        process.stdin.on('end',()=>{
            try {
                const j = JSON.parse(d);
                const arr = Array.isArray(j) ? j : (j.products || j.data || j.banners || j.items);
                process.exit(Array.isArray(arr) ? 0 : 1);
            } catch (e) { process.exit(1); }
        });
    " <<< "$body"; then
        echo "PASS  $desc (valid JSON array/list)"
        PASS=$((PASS + 1))
    else
        echo "FAIL  $desc (response is not a JSON array or list-shaped object)"
        echo "$body" | head -c 300
        echo ""
        FAIL=$((FAIL + 1))
    fi
}

echo "==> Smoke tests against $BASE"
echo ""

echo "-- Health --"
assert_status "/api/health" "200" "GET /api/health"

echo ""
echo "-- Root --"
assert_status "/" "200" "GET /"

echo ""
echo "-- Products --"
assert_status "/api/products" "200" "GET /api/products"
assert_json_array "/api/products" "GET /api/products returns a list"

echo ""
echo "-- Banners --"
assert_status "/api/banners/active" "200" "GET /api/banners/active (public)"
assert_status "/api/banners" "401" "GET /api/banners without auth is rejected (admin-only)"

echo ""
echo "-- Auth guard (no token) --"
assert_status "/api/orders" "401" "GET /api/orders without auth is rejected"

echo ""
echo "-- Webhook without signature is rejected --"
# Must use a recognized 'payment' event shape — the signature check only runs on that
# path; an empty/unrecognized body is meant to short-circuit to 200 (ack, don't process),
# which is correct webhook behavior, not a bypass.
code=$(curl -sS -o /dev/null -w "%{http_code}" -X POST -H "$HDR" -H "Content-Type: application/json" \
    -d '{"type":"payment","data":{"id":"smoke-test-fake-id"}}' "$BASE/api/webhooks/mercadopago")
if [ "$code" = "401" ]; then
    echo "PASS  POST /api/webhooks/mercadopago without signature is rejected (HTTP $code)"
    PASS=$((PASS + 1))
else
    echo "FAIL  POST /api/webhooks/mercadopago without signature (expected 401, got $code)"
    FAIL=$((FAIL + 1))
fi

# Only meaningful when run on the same host as the process (e.g. right after a
# server-side deploy) — checking it against a remote BASE would just spawn/query
# a local PM2 daemon that has never heard of the remote app.
case "$BASE" in
    http://127.0.0.1*|http://localhost*)
        if command -v pm2 >/dev/null 2>&1; then
            echo ""
            echo "-- PM2 status --"
            pm2 status mercado-harley-backend || true
        fi
        ;;
esac

echo ""
echo "==> $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
