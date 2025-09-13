Payment feature — changes summary

Overview

This commit implements the new ACF-backed payment UI and client/server integration so payments and payment-range filters behave consistently with the WordPress plugin ACF fields.

Files changed (high level)

- client/pages/MySQLVehiclesOriginalStyle.tsx
  - Added ACF-backed payment inputs: payment_min, payment_max, down_payment.
  - Removed legacy APR/term dropdowns and legacy down-payment UI.
  - Down Payment input placeholder: "Enter your down payment." When a value exists a label displays: "Down Payment: $[amount]". Clearing restores placeholder.
  - applyPaymentFilters now sends paymentMin/paymentMax/down_payment (down_payment defaults to 0 when empty).
  - Rewired VehicleCard props to pass user down payment for instant client recalculation.
  - Renamed payment header to "Payments" and removed duplicate controls.

- client/components/VehicleCard.tsx
  - Added computeMonthlyFromNumbers() to calculate monthly payment from numeric inputs (apr decimal, term months).
  - getDisplayPayment now:
    - prefers client-side recalculation when user down payment is present (uses ACF interest_rate and loan_term when available),
    - otherwise shows "from $X/mo" using vehicle.payment_min if present, fall back to vehicle.payment.
  - Accepts downPayment prop and uses it for immediate recalculation.

- client/components/MySQLVehicleCard.tsx
  - Left mostly untouched for ACF display (it still prefers acf.payment_min where available). Vehicle list now passes userDownPayment to cards where applicable.

- server/routes/vehicles.ts
  - Tightened WP proxy fallback filtering parsing for payment_min/payment_max/down_payment (treats empty/non-numeric as missing).
  - Added richer [WP_PROXY_FILTER] logging including a small sample of removed IDs for debugging.

- server/services/vehicleService.ts
  - SQL-level monthly payment expression already existed; this change left debug logging in place ([VehicleService.buildQuery]) to help confirm SQL filtering when payment filters are used.

What to test (manual QA)

1. Frontend behavior
   - Open the filters drawer -> Payments
   - Confirm you only see "Payments" with three controls: Min, Max, Down Payment.
   - Placeholder for down payment reads: "Enter your down payment." Type 5000 -> label displays: "Down Payment: $5,000". Edit to 7000 -> label updates and remains editable. Clear input -> label disappears and placeholder returns.
   - Enter Min/Max and Down Payment and confirm UI updates product cards instantly (no API roundtrip required for display). Cards should recalc using ACF interest_rate/loan_term when available.

2. API / filtering
   - While the UI is open apply a payment range and down payment and inspect Network tab for /api/vehicles request. Confirm the query string includes payment_min, payment_max and down_payment.
   - Check server logs for either:
     - [WP_PROXY_FILTER] — indicates proxy fallback filtering ran; the log includes before/after counts and a sample of removed IDs.
     - [VehicleService.buildQuery] — shows built SQL and params when SQL branch receives payment filters.
   - Example request to reproduce: /api/vehicles?page=1&per_page=20&payment_min=200&payment_max=400&down_payment=100

3. Edge cases
   - Vehicles missing ACF payment_min/payment_max should be recalculated using ACF loan fields or fallback logic, not included unconditionally.
   - Empty down_payment should be treated as 0.

Deployment / pushing

- I cannot push to remote for you. A commit was created for each change in the branch ai_main_2822b52770a1.
- To publish these changes to GitHub: use the project UI "Push" button (top-right) or run your normal git push flow targeting remote branch ai_main_2822b52770a1.
- There is already an open PR: https://github.com/carzinoautos-setup/builder-NEW/pull/2 — pushing will update that PR automatically.

Notes & next steps

- If you still see unfiltered results after pushing, paste the server log lines containing [WP_PROXY_FILTER] and [VehicleService.buildQuery] and I will iterate further.
- Optionally: I can add extra SQL-branch logs or a feature-flag to force server-side filtering for debugging.

Contact

If you want I can also:

- Create a short change-log entry in package.json or docs (I have added this file docs/payment-setup-notes.md),
- Add unit tests or e2e checks around the payment recalculation and filtering.
