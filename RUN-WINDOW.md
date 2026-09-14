# Life Path Test — Evaluation Run Window & Telemetry Protocol

**Test Subject:** [https://life-path.icu](https://life-path.icu) (Cloudflare Pages / Workers static distribution)  
**Benchmark Target:** `iq-test.icu` (Historical baseline cohort)  
**Run Window Duration:** Extended 21 Days (14 Days of Full Telemetry Ingestion)  
**Window Start (UTC):** 2026-09-07T00:00:00Z  
**Telemetry Ingestion Active:** 2026-09-13T20:55:00Z (Commit & Route Deployed)  
**Window End (UTC):** 2026-09-28T00:00:00Z  
**Decision Gate Execution:** 2026-09-28T12:00:00Z  

---

## 1. Non-Negotiable Experiment Controls (Code Freeze)
During this window, the following are strictly frozen to preserve comparison validity:
1. **Pricing Structure Frozen:**
   - Score Tier: $1.99 (`https://buy.stripe.com/dRm4gyafd9zu8Ztg3o9AA03`)
   - Deep Report: $3.99 (`https://buy.stripe.com/6oU5kC7317rmejNaJ49AA04`)
   - Complete Archetype: $6.99 (`https://buy.stripe.com/00w14m3QPaDy4Jd8AW9AA05`)
2. **Copy & Visual Architecture Frozen:** No edits to headlines, archetypes, form flow, or checkout triggers.
3. **Numerology Computation Frozen:** Pythagorean calculation logic must remain identical to commit `92a8716`.

---

## 2. Metric Collection Framework

### 2.1 Funnel Telemetry Data Sources
| Funnel Step | Metric / Event | Source & Pipeline | Status |
| :--- | :--- | :--- | :--- |
| **Top of Funnel** | Page Views / Visits | Cloudflare Web Analytics + Supabase `quiz_viewed` | Live |
| **Mid Funnel** | Free Results Shown | Supabase `lifepath_events` (`free_result_shown`) | Live (via POST /track) |
| **Intent Gate** | Tier Button Clicks | Supabase `lifepath_events` (`tier_button_clicked`) | Live (via sendBeacon POST /track) |
| **Conversion** | Completed Purchases | Stripe Dashboard (`acct_1UCs0oPWe9M3ZYFY` Payments) | Live |

### 2.2 Mathematical Formulas
1. **Free-Result Completion Rate:**  
   $$\text{Completion Rate} = \frac{\text{Form Submissions (Free Results Shown)}}{\text{Total Page Views}} \times 100\%$$
2. **Tier-Button Click Rate:**  
   $$\text{Tier Click Rate} = \frac{\text{Total Tier Clicks}}{\text{Free Results Shown}} \times 100\%$$
3. **Paid-Conversion Rate:**  
   $$\text{Paid Conversion Rate} = \frac{\text{Stripe Completed Purchases}}{\text{Total Tier Clicks}} \times 100\%$$

---

## 3. Daily Tracking Ledger

| Day | Date (UTC) | Page Views | Free Results | Free Comp % | Tier Clicks | Tier Click % | Paid Sales | Paid Conv % | Net Revenue | Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | 2026-09-07 | 374 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 2 | 2026-09-08 | 27 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 3 | 2026-09-09 | 78 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 4 | 2026-09-10 | 49 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 5 | 2026-09-11 | 25 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 6 | 2026-09-12 | 27 | - | - | - | - | 0 | - | $0.00 | Untracked baseline |
| 7 | 2026-09-13 | 66 | - | - | - | - | 0 | - | $0.00 |
| 8 | 2026-09-14 | | | | | | | | | Instrumented Day 1 |
| 9 | 2026-09-15 | | | | | | | | | Instrumented Day 2 |
| 10 | 2026-09-16 | | | | | | | | | Instrumented Day 3 |
| 11 | 2026-09-17 | | | | | | | | | Instrumented Day 4 |
| 12 | 2026-09-18 | | | | | | | | | Instrumented Day 5 |
| 13 | 2026-09-19 | | | | | | | | | Instrumented Day 6 |
| 14 | 2026-09-20 | | | | | | | | | Instrumented Day 7 |
| 15 | 2026-09-21 | | | | | | | | | Instrumented Day 8 |
| 16 | 2026-09-22 | | | | | | | | | Instrumented Day 9 |
| 17 | 2026-09-23 | | | | | | | | | Instrumented Day 10 |
| 18 | 2026-09-24 | | | | | | | | | Instrumented Day 11 |
| 19 | 2026-09-25 | | | | | | | | | Instrumented Day 12 |
| 20 | 2026-09-26 | | | | | | | | | Instrumented Day 13 |
| 21 | 2026-09-27 | | | | | | | | | Instrumented Day 14 |
| **Total**| **Window** | | | | | | | | | Final Cohort |

---

## 4. Phase 6 Decision Gate Protocol (Scheduled 2026-09-28)

### 4.1 Gate Validity Precondition (Non-Zero Denominator Law)
To prevent mathematical indeterminacy ($0 / 0$) and false-negative category termination:
- **Minimum Evaluated Denominator:** $\text{Total Tier Clicks} \ge 10$.
- If $\text{Total Tier Clicks} < 10$ at gate execution, the decision gate is declared **UNTESTED (Traffic Starvation)** rather than NO-GO. A zero or negligible intent-stage denominator demonstrates failure to execute top-of-funnel acquisition, not consumer rejection of the product category.

### 4.2 Gate Decision Matrix (When Denominator $\ge 10$)
Compare `life-path.icu` 14-day instrumented metrics (Days 8–21) against `iq-test.icu` baseline:

- **GO Condition:**  
  `Life Path Paid-Conversion Rate >= iq-test.icu Paid-Conversion Rate`  
  *Action:* The astrology/numerology category hypothesis is proven. Proceed to Phase 7: Build automated report-generation engine (Edge Function + PDF generator + Supabase fulfillment webhook).

- **NO-GO Condition:**  
  `Life Path Paid-Conversion Rate < iq-test.icu Paid-Conversion Rate`  
  *Action:* Category hypothesis is rejected under current positioning. The primary funnel constraint is product positioning or price-to-value elasticity. Do not build automated backend report generation.

---

## 5. Fulfillment & Compliance Evidence Notes

1. **Stripe Customer Data Verification:**  
   Live Stripe API inspection of `plink_1UCtRVB5tWnsC2EEgLBo6ITm` ($1.99), `plink_1UCtRWB5tWnsC2EEOE6gKfck` ($3.99), and `plink_1UCtRXB5tWnsC2EEfByzxAHH` ($6.99) confirms that all three links enforce:
   - Mandatory Customer Email collection
   - `custom_fields`: `full_birth_name` (`optional: false`)
   - `custom_fields`: `birth_date` (`optional: false`)  
   Hand-prepared concierge fulfillment receives all required numerological parameters on every Stripe purchase event.

2. **Stripe Restricted Business Category Safeguard:**  
   The site operates strictly under mathematical Pythagorean algorithmic classification with an explicit entertainment disclaimer on every page and footer (`id="privacy"`), mitigating classification as unregulated psychic divination.
