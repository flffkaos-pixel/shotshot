# Korea Local Payment Integration

Shotshot works with PayPal globally. For Korean market, you can also enable Toss Payments (most popular) and Naver Pay.

## Toss Payments (토스페이먼츠) — recommended for Korea

**Sign up**: https://toss.im → 개발자센터 (Developer Center)
**Docs**: https://docs.toss.im

### Setup

1. **Register app** at https://developers.toss.im
2. **Get API keys**:
   - 클라이언트 키 (Client Key, public)
   - 시크릿 키 (Secret Key, private)
3. **Enable 정기결제 (Subscription)** billing key
4. **Add to env**:
   ```
   TOSS_CLIENT_KEY=test_ck_...
   TOSS_SECRET_KEY=test_sk_...
   TOSS_BILLING_KEY=your-billing-key
   TOSS_CUSTOMER_KEY_PREFIX=shotshot
   ```

### Why Toss?

- 95% of Korean indie devs use it
- 즉시 결제 (no checkout page redirects)
- 정기결제 (subscription) supported natively
- KRW only (perfect for local market)
- Settlement to Korean bank account in T+1
- **2.9% fee** (same as PayPal)
- Supports Naver Pay, KakaoPay, Toss Pay, 신용카드 all-in-one

### Pricing in KRW

| Tier | USD | KRW (at 1,400 rate) |
|---|---|---|
| Pro | $5 | **₩7,000/월** |
| Lifetime | $49 | **₩69,000** |

Switch `PAYPAL_CURRENCY=KRW` in env and set `PAYPAL_LIFETIME_PRICE=69000`.

### Webhook (Webhook URL)

```
POST https://api.tosspayments.com/v1/billing/{billingKey}
```

Events to handle (similar to PayPal):
- `Billing.Paid` — successful recurring payment
- `Billing.Failed` — card declined
- `Billing.Deleted` — subscription cancelled
- `Billing.Key.Deleted` — billing key removed

### Code skeleton (to be added when you want KRW)

```typescript
// src/app/api/toss/billing/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("Toss-Signature");

  // Verify signature with HMAC-SHA256
  const crypto = require("node:crypto");
  const expected = crypto
    .createHmac("sha256", process.env.TOSS_SECRET_KEY)
    .update(raw)
    .digest("base64");

  if (sig !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const event = JSON.parse(raw);
  // Handle event.eventType === "Billing.Paid" / "Billing.Failed" / etc.
  // Update user_billing in Supabase
  // Send email via sendTemplatedEmail
}
```

## Naver Pay (네이버페이) — Korea e-commerce standard

**Sign up**: https://developer.pay.naver.com
**Docs**: https://developer.pay.naver.com/docs/v2

### Setup

1. Register at Naver Pay Developer
2. Get Client ID + Secret
3. Get merchant ID (가맹점 ID)
4. Add to env:
   ```
   NAVER_CLIENT_ID=...
   NAVER_CLIENT_SECRET=...
   NAVER_MERCHANT_ID=...
   ```

### Features

- 정기결제 (subscription) supported
- KRW only
- 2.5% fee (slightly cheaper than Toss)
- Good for users already in Naver ecosystem

## KakaoPay (카카오페이) — Korea mobile-first

**Sign up**: https://developers.kakao.com → Kakao Pay
**Docs**: https://developers.kakao.com/docs/latest/ko/kakaopay/common

### Setup

1. Kakao Developers app registration
2. Kakao Pay 활성화 (Admin approval)
3. Get Admin Key, Client Secret
4. Add to env:
   ```
   KAKAO_ADMIN_KEY=...
   KAKAO_CLIENT_SECRET=...
   ```

### Features

- 정기결제 supported (간편결제 + 정기결제)
- KRW only
- 2.9% fee
- Best for mobile-first users

## Recommended strategy

For a Korea-first launch:

1. **Phase 1 (week 1)**: PayPal only (works globally, easy to set up)
2. **Phase 2 (month 1)**: Add 토스페이먼츠 (covers 95% of Korean market)
3. **Phase 3 (month 3)**: Add Naver Pay / KakaoPay if specific demand

Most users don't need 4 payment options. Toss alone is enough for Korea.

## Korean business (사업자) requirements

If you want to issue 세금계산서 (Korean tax invoices) to Korean customers:

### Setup
1. **사업자등록** at 세무서 (free, online at hometax.go.kr)
2. **부가세 과세업소** registration
3. Open **토스페이먼츠 사업자 계좌** (settlement account)
4. Add to your invoice:
   - 사업자등록번호
   - 상호 (business name)
   - 사업장 주소
   - 업태/업종
5. Issue **세금계산서** monthly via 홈택스 (free)

### Display on landing
Add to footer:
```tsx
<span>사업자등록번호: 123-45-67890</span>
<span>상호: 주식회사 샷샷</span>
<span>대표: 홍길동</span>
```

## Pricing display in KRW

The current landing page auto-converts via the `useCurrency` hook. The conversion is fixed at ₩1,400/USD. For live rates, integrate with:

- 한국수출입은행 API: https://www.koreaexim.go.kr (free, daily)
- Open Exchange Rates: https://open.er-api.com (free, 250 req/mo)
- exchangerate-api.com: https://www.exchangerate-api.com (free, 1500 req/mo)

## Korean tax considerations

| 분류 | 내용 |
|---|---|
| 부가세 (VAT) | 10% of revenue. 신고/납부 quarterly. |
| 종합소득세 | Net income tax. 신고 annually (May). |
| 원천세 (withholding) | N/A for SaaS unless you have employees. |
| 4대보험 | N/A for solo founders. |
| 해외 결제 (PayPal) | PayPal Korea에서 원화 정산 시 환차익/손실 발생. 회계 처리 필요. |

## Korean business bank account

To receive PayPal/Toss settlements:

- **토스뱅크** (recommended) — free, 100% online, business accounts supported
- **카카오뱅크** — free, business accounts
- **케이뱅크** — fintech, business-friendly
- Any major bank (국민, 신한, 하나) — business account + 방문 필요

## Legal entity

For tax purposes, you can:

- **개인사업자** (sole proprietor) — easiest, register at 홈택스
- **프리랜서 종합소득세** — no registration, declare as misc income
- **주식회사** (corporation) — if you plan to raise money or sell
- **해외 법인 (US LLC)** — for international credibility, e.g., Stripe Atlas ($500)

For most indie devs, **개인사업자** is the right answer. Free, online, done in 30 minutes.

## Customer support in Korean

- **이메일**: support@shotshot.app (use Naver Mail or Google Workspace)
- **카카오톡 채널**: https://business.kakao.com (free business chat)
- **Discord** (English/international): https://discord.com

## Korean marketing channels

Beyond the global launch (PH/Reddit/HN):

- **한국 인디 개발자 디스코드/슬랙**: 활동 중인 커뮤니티 5-6개
- **당근마켓 개발자 모임**: 분기별 밋업
- **X (트위터) 한국 인디**: #인디개발자 #iOS개발자 #앱개발
- **브런치 / 벨로그**: "인디 개발로 월 $500 벌기" 류 블로그 글
- **한국 PH**: producthunt.com (한국어 가능)

## Tax tips for $200/mo MRR

- 4대보험 의무 가입 아님 (프리랜서)
- 부가세는 4분기 합산 신고 (10% of revenue)
- 종합소득세: $200/mo = 약 ₩280,000/월 = ₩3.36M/연
  - 과세표준 ₩3.36M - 기본공제 ₩1.5M = ₩1.86M
  - 세율 6% (누진) = 약 ₩110,000/년
  - **연 ₩11만 정도** (실제 $200/월이 아니라 카드 수수료 + 환차이 손실 감안하면 더 적음)
- **결론**: $200/월 매출로는 세금 거의 안 냄. $1000/월부터 본격적인 세무 처리 필요.
