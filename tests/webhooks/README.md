# PayPal Webhook Simulation

Send fake webhook events to your local /api/paypal/webhook to test handlers end-to-end.

## PayPal's built-in simulator (easiest)

1. Go to https://developer.paypal.com/dashboard/
2. Apps & Credentials → your app → Webhooks → your webhook
3. Click "Simulate" dropdown → pick event type
4. Click "Send Test"

This sends a real signed payload from PayPal's servers. Best for production-like testing.

## Local simulation (this script)

```bash
# Set env
export PAYPAL_CLIENT_ID=Aa...
export PAYPAL_CLIENT_SECRET=EL...
export PAYPAL_WEBHOOK_ID=WH-...  # optional, but needed for signature verification

# Run dev server
cd C:\Users\나가\shotshot
npm run dev

# In another terminal, send a fake webhook
node tests/webhooks/simulate.mjs tests/webhooks/01-subscription-activated.json
```

The script will:
1. Get a PayPal OAuth token (sandbox)
2. Use PayPal's `simulate-event` API to send a real signed payload
3. Print the response from your webhook handler

## Test events (5 in tests/webhooks/)

| File | Event |
|---|---|
| `01-subscription-activated.json` | BILLING.SUBSCRIPTION.ACTIVATED |
| `02-subscription-renewed.json` | BILLING.SUBSCRIPTION.RENEWED |
| `03-payment-failed.json` | BILLING.SUBSCRIPTION.PAYMENT.FAILED |
| `04-subscription-cancelled.json` | BILLING.SUBSCRIPTION.CANCELLED |
| `05-payment-captured.json` | PAYMENT.SALE.COMPLETED |

## Manual cURL (no script needed)

```bash
curl -X POST http://127.0.0.1:3000/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d @tests/webhooks/01-subscription-activated.json
```

Returns `400 Invalid signature` unless signature verification is disabled for dev.

## Disable signature verification for dev (INSECURE!)

Only for local dev. In `src/app/api/paypal/webhook/route.ts`:

```typescript
// TEMPORARILY: skip signature check
const ok = true; // process.env.NODE_ENV === "development"
```

Never deploy with this. Re-enable before committing.

## What to check after each test

1. **Supabase**: `user_billing` table — check `plan`, `expires_at`, `paypal_subscription_id`
2. **Resend dashboard**: check if the expected email was sent
3. **Server logs**: should show webhook applied + email sent (or stub-mode logs)
4. **/api/health**: should still be 200

## Full end-to-end test

```bash
# 1. Create a test user in Supabase Auth
# 2. Note their user_id (UUID format)
# 3. Edit tests/webhooks/01-subscription-activated.json, replace:
#    "id": "I-TEST-SUB123"  →  your test sub ID (any string)
#    "payer_id": "QTESTPAYER123"  →  any string
#    (these are just stored, not validated)

# 4. The webhook handler looks up user by paypal_subscription_id
#    so first you need to set up that mapping. Do this manually:
#    In Supabase SQL editor:
#    UPDATE user_billing SET paypal_subscription_id = 'I-TEST-SUB123' WHERE user_id = 'YOUR_USER_UUID';

# 5. Run the simulator
node tests/webhooks/simulate.mjs tests/webhooks/01-subscription-activated.json

# 6. Check Supabase: plan should be 'pro', expires_at 30 days out
# 7. Check Resend: "Welcome to Shotshot Pro" email sent
```

## CI integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Test webhooks
  env:
    PAYPAL_CLIENT_ID: ${{ secrets.PAYPAL_CLIENT_ID }}
    PAYPAL_CLIENT_SECRET: ${{ secrets.PAYPAL_CLIENT_SECRET }}
    PAYPAL_WEBHOOK_ID: ${{ secrets.PAYPAL_WEBHOOK_ID }}
  run: |
    npm run dev &
    sleep 5
    for event in tests/webhooks/*.json; do
      node tests/webhooks/simulate.mjs "$event"
    done
```

Requires PayPal sandbox credentials as GitHub secrets.
