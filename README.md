# SENTINEL

**People Who Protect, Deserve To Be Protected.**

SENTINEL is a frontend product demonstration for privacy-first welfare intelligence for uniformed forces. It presents role-based personnel, welfare officer and commander workspaces using fictional demo data.

## Run locally

```sh
npm install
npm run dev
```

## Demo routes

- `/` — landing page and demo role selection
- `/personnel/dashboard` — personnel wellness overview
- `/personnel/check-in` — interactive local check-in
- `/personnel/trends`, `/personnel/support`, `/personnel/circles`, `/personnel/privacy`
- `/welfare/dashboard`, `/welfare/alerts`, `/welfare/personnel`, `/welfare/interventions`, `/welfare/reports`
- `/commander/dashboard`, `/commander/unit`, `/commander/readiness`, `/commander/reports`
- `/settings`

All identifiers and numbers shown are fictional. Check-ins are saved only in this browser’s local storage; alert actions are local UI demonstrations. Nothing is sent to responders or stored in a backend. Risk indicators use deterministic illustrative demo logic, not machine learning, clinical diagnosis or operational decision support. Commander views show aggregate concepts only.

## Current architecture

`src/demo/` contains fictional sample data and domain types. `src/services/` exposes small data adapters for wellness, risk, welfare and unit summaries so the demo data can later be replaced by appropriately secured services. No new Supabase schema or production integrations are included in this MVP.
