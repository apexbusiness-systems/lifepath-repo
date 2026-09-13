# Life Path Test — 14-Day Evaluation Run Window

**Test Subject:** [https://life-path.icu](https://life-path.icu) (Cloudflare Pages / Workers static distribution)  
**Benchmark Target:** `iq-test.icu` (Historical baseline cohort)  
**Run Window Duration:** 14 Days  
**Window Start (UTC):** 2026-09-07T00:00:00Z  
**Window End (UTC):** 2026-09-21T00:00:00Z  
**Decision Gate Execution:** 2026-09-21T12:00:00Z  

---

## 1. Non-Negotiable Experiment Controls (Code Freeze)
During this 14-day window, the following are strictly frozen to preserve comparison validity:
1. **Pricing Structure Frozen:**
   - Score Tier: $1.99 (`https://buy.stripe.com/dRm4gyafd9zu8Ztg3o9AA03`)
   - Deep Report: $3.99 (`https://buy.stripe.com/6oU5kC7317rmejNaJ49AA04`)
   - Complete Archetype: $6.99 (`https://buy.stripe.com/00w14m3QPaDy4Jd8AW9AA05`)
2. **Copy & Visual Architecture Frozen:** No edits to headlines, archetypes, form flow, or checkout triggers.
3. **Numerology Computation Frozen:** Pythagorean calculation logic must remain identical to commit `92a8716`.

---

## 2. Metric Collection Framework

### 2.1 Funnel Telemetry Data Sources
| Funnel Step | Metric / Event | Source |
| :--- | :--- | :--- |
| **Top of Funnel** | Page Views / Visits | Cloudflare Web Analytics / `lifepath:quiz_viewed` |
| **Mid Funnel** | Free Results Shown | `lifepath:free_result_shown` event |
| **Intent Gate** | Tier Button Clicks | `lifepath:tier_button_clicked` (per tier) |
| **Conversion** | Completed Purchases | Stripe Dashboard (`acct_1UCs0oPWe9M3ZYFY` Payments) |

### 2.2 Mathematical Formulas
1. **Free-Result Completion Rate:**  
   $$\text{Completion Rate} = \frac{\text{Form Submissions (Free Results Shown)}}{\text{Total Page Views}} \times 100\%$$
2. **Tier-Button Click Rate:**  
   $$\text{Tier Click Rate} = \frac{\text{Total Tier Clicks}}{\text{Free Results Shown}} \times 100\%$$
3. **Paid-Conversion Rate:**  
   $$\text{Paid Conversion Rate} = \frac{\text{Stripe Completed Purchases}}{\text{Total Tier Clicks}} \times 100\%$$

---

## 3. Daily Tracking Ledger

| Day | Date (UTC) | Page Views | Free Results | Free Comp % | Tier Clicks | Tier Click % | Paid Sales | Paid Conv % | Net Revenue |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 2026-09-07 | 374 | - | - | - | - | 0 | - | $0.00 |
| 2 | 2026-09-08 | 27 | - | - | - | - | 0 | - | $0.00 |
| 3 | 2026-09-09 | 78 | - | - | - | - | 0 | - | $0.00 |
| 4 | 2026-09-10 | 49 | - | - | - | - | 0 | - | $0.00 |
| 5 | 2026-09-11 | 25 | - | - | - | - | 0 | - | $0.00 |
| 6 | 2026-09-12 | 27 | - | - | - | - | 0 | - | $0.00 |
| 7 | 2026-09-13 | 16 | - | - | - | - | 0 | - | $0.00 |
| 8 | 2026-09-14 | | | | | | | | |
| 9 | 2026-09-15 | | | | | | | | |
| 10 | 2026-09-16 | | | | | | | | |
| 11 | 2026-09-17 | | | | | | | | |
| 12 | 2026-09-18 | | | | | | | | |
| 13 | 2026-09-19 | | | | | | | | |
| 14 | 2026-09-20 | | | | | | | | |
| **Total**| **Window** | | | | | | | | |

---

## 4. Phase 6 Decision Gate Protocol (Scheduled 2026-09-21)

Compare `life-path.icu` 14-day aggregated metrics against `iq-test.icu` baseline:

- **GO Condition:**  
  `Life Path Paid-Conversion Rate >= iq-test.icu Paid-Conversion Rate`  
  *Action:* The astrology/numerology category hypothesis is proven. Proceed to Phase 7: Build automated report-generation engine (Edge Function + PDF generator + Supabase fulfillment webhook).

- **NO-GO Condition:**  
  `Life Path Paid-Conversion Rate < iq-test.icu Paid-Conversion Rate`  
  *Action:* Category hypothesis is rejected under current positioning. The primary funnel constraint is traffic source or entry framing rather than category interest. Do not build backend report generation.
