Refill Tracker

A small Next.js + TypeScript medication refill tracker. This README is written to be a guide and includes setup steps, a brief explanation of the application logic, the API reference, and step-by-step verification/demo instructions.

Features implemented

- Add medication (name, dosage, frequency per day, start date, quantity, days' supply)
- List medications with status (on track / running low / overdue)
- Edit (full edit capabilities implemented) and Delete medication
- Refill calculator: remaining doses, days left, next refill date
- Mark doses as taken or missed (stores simple dose records)
- Alerts endpoint for medications needing refill soon (<=7 days)
- Server: Next.js API routes with file-backed JSON storage at `data/medications.json`

Run locally

1. Install dependencies

```bash
cd /Users/shay/Documents/refill_tracker
npm install
```

2. Start dev server

```bash
npm run dev
```

Open http://localhost:3000

Development notes

- Data is stored in `data/medications.json` (created automatically). No DB required.
- Calculation helpers are in `lib/calc.ts` and used by the API and UI.

Stepwise demo plan

1. Add medication: use the Add Medication form on the left.
2. View list: medication appears with progress and next refill date.
3. Mark doses: use Mark taken / Mark missed buttons to change adherence.
4. Edit/Delete: Delete removes medication; the Edit button to change medication details (Cancel closes without saving).

## Backfill logic

When you add a medication (or change its start date), the server fills in past dose records from the start date through yesterday so the app shows correct historical adherence.

Simple rules:

- Uses local calendar days (YYYY-MM-DD) so timezones don't shift dates.
- Each day gets at most `frequencyPerDay` dose entries; existing entries are kept and not duplicated.
- Nothing is created for today or future dates.

Quick example (today = 2025-10-21):

- startDate=2025-10-19, frequencyPerDay=2 → adds 2 doses for 2025-10-19 and 2 for 2025-10-20.
