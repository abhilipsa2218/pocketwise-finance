# Pocketwise — Personal Finance Frontend

A modern, responsive React + Vite personal finance demo for a 30-day ₹10,000 budget challenge.

## Features
- Dashboard for balance, spending, daily allowance, commitments, subscriptions, month-end forecast, risk, and money health.
- Transaction entry and category-level spending breakdown.
- Savings goals with progress.
- Subscription pause/reactivation that updates the projected spendable amount.
- Decision Lab to preview purchases, saving, unexpected costs, new commitments, and subscription pauses before applying them.
- Interconnected calculations and browser-side persistence with `localStorage`.
- Export current data as JSON.
- Resettable demo data.

## Stack
- React + Vite
- JavaScript / JSX
- CSS (responsive design system)
- Lucide React icons
- JSON mock data (`src/data/initialData.json`)
- `localStorage` only; no backend or external API calls

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Notes
- All user-entered data stays in the current browser's local storage.
- Subscription controls only update this demo; they do not cancel real services.
- Forecast, risk, and health are illustrative heuristics for the demo, not financial advice.
- The Google Fonts import is optional; the UI falls back to system sans-serif if unavailable.
