# Frontend testing lab and demo mode

Objective: rebuild the web UI so the team can test the current evaluation API and present upcoming features in a clearly labeled demo mode.
Branch: `feat/frontend-testing-lab` · Delivery: ask-on-risk · Test runner: `npm run test` (node:test) + `npm run check`.

## Specs

- S1. "necesito que montemos un frontend que nos permita testear lo que tenemos hasta ahora": real mode calls the existing API only (`POST`/`GET /api/transaction-evaluations`).
- S2. "que se pueda activar un modo demo con algunas funciones proximas a desarrollar": demo mode is toggled from the UI, makes no API calls, and every fictitious value is labeled as illustrative. Scope pending user decision (see Log L4).
- S3. Review findings accepted with "genial, eso que encontraste" and "quiero arreglar todo":
  - S3.1 Show `risk_score`, `history_count` and model in the result and history.
  - S3.2 Result styling follows the decision (approved vs rejected), not a fixed green "saved" notice.
  - S3.3 Decisions and signals shown in Spanish, not raw enum codes.
  - S3.4 One-click test scenarios instead of typing 10 fields.
  - S3.5 Detail view of a past evaluation using data the API already returns (partial CU-06).
  - S3.6 Validation errors per field and Spanish messages instead of raw English API errors.
  - S3.7 Loading state that explains the AI analysis is running.
  - S3.8 No internal jargon ("legado fijo") shown to users.
  - S3.9 Split the monolithic component; load fonts with `next/font`; remove `!important` theme hacks.
- S4. "además no es responsivo. en una pantalla hd se ve bien, pero yo tengo una resolucion de 768 y se ve mal": layout works at 1366×768 and at 768px width without horizontal overflow, and the submit action is reachable without scrolling at 1366×768.
- Constraint (AGENTS.md): no invented thresholds or risk levels in real mode; only the numeric score.

## Tasks

| ID | Specs | Route | Status | Evidence |
|---|---|---|---|---|
| T1 | S1, S3.1-S3.9, S4 | inline | done | RED: frontend tests failed (missing modules, English errors); GREEN: `npm run check` 42 pass / 2 skipped (integration, need MongoDB). Visual: 1366×657, 768, 390 with mocked fetch, no horizontal overflow. Commit `feat(web): rebuild lab UI...` |
| T2a | S2 | inline | done | Demo shell + CU-05 monitor (PR 3) |
| T2b | S2 | inline | pending | CU-05 filters + CU-06 detail (PR 4) |
| T2c | S2 | inline | pending | CU-07 + CU-02 config (PR 5) |
| T2d | S2 | inline | pending | Alerts, future/Won't (PR 6) |

## Log

- L1 (2026-11-11) User: "sin hacer ningun cambio en el repo todavía necesito que revises el frontend, porque lo hizo otro agente y no quedó muy bien. necesito que montemos un frontend que nos permita testear lo que tenemos hasta ahora, y que se pueda activar un modo demo con algunas funciones proximas a desarrollar. hoy nos toca mostrar avances de la idea"
- L2 (2026-11-11) User: "genial, eso que encontraste y que ademas no es responsivo. en una pantalla hd se ve bien, pero yo tengo una resolucion de 768 y se ve mal"
- L3 (2026-11-11) User: "bueno, quiero arreglar todo en una nueva rama. empecemos"
- L4 Demo scope options offered (CU-05+CU-06 / +CU-07+CU-02 / +alerts); no answer yet. T1 proceeds independently.
- L6 T1 verification limits: no `.env.local` and Docker not running, so no real POST/GET was made; layout and flow checked with an in-page `fetch` mock. Single commit (~900 authored lines) because the old component was replaced as one unit.
- L7 (2026-11-11) User: "vamos por partes. con esto que tenemos ya podriamos abrir un pr??" then "dale, y luego planifiquemos para seguir con lo que nos quedó opcional/pendiente". Delivery: stacked PRs to main (01-client, 02-ui). Demo placeholder removed from the nav; T2 ships in its own PR.
- L8 (2026-11-11) User: "avancemos con mas prs no? los modos demos restantes" → all demo features, one stacked PR each. Demo uses the requirements' example config (CU-02 ARS 10.000, CU-04 60/85, §6 levels), labeled illustrative.
- L5 Root cause of S4: single 1320px breakpoint keeps two columns at 1366px; history rows need ~590px min across five `minmax` columns; 248px fixed sidebar down to 700px; no height budget for the form.
