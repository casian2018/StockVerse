## StockVerse workspace

This repository hosts the StockVerse dashboard (Next.js 15). It contains:

- Traditional pages-router views under `src/pages`
- Admin tooling (personal, accounts, automations, etc.)
- API routes under `src/pages/api` that talk to MongoDB

## Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to sign in and navigate the workspace.

## Automation alerts & notifications

The automation engine can now:

- Generate in-app alerts (`/api/automations/alerts`)
- Send reminder emails through [Resend](https://resend.com/) (or any provider compatible with the Resend API)
- Surface a notifications timeline at `/notifications`

To enable email delivery, provide the following environment variables:

```
RESEND_API_KEY=<your Resend API key>
RESEND_FROM_EMAIL="StockVerse <notifications@yourdomain.com>"
```

If these values are missing the engine gracefully skips the email step but still saves alerts and tasks.

Alerts respect role visibility and can be dismissed individually or in bulk. Administrators can configure custom alert copy, task creation, and email subject/body from the Automations page.

## Inventory & asset tracking

The Stocks workspace now supports:

- Barcode capture (manual entry or in-browser scanner)
- Reorder thresholds with proactive badges
- Straight-line depreciation schedules with book value insights
- Vendor scorecards that aggregate spend, locations, and satisfaction scores

You can maintain these fields on `/stocks`; edits sync to `users.stocks` through the existing API routes.

## Enterprise notebook

Admins on the $49.99 Enterprise plan unlock `/notes`, a shared canvas for the entire business. It supports markdown-style typing plus quick @mentions (pulled from your team directory).

Data lives in the `workspace_notes` collection (per business). To expose the section on the dashboard, make sure the owner’s subscription `planId` is `enterprise`.

## Collaboration layer

- Tasks now support inline comments with @mentions – open any task card’s Comments button in `/todo`.
- Mentions trigger optional Slack/Teams webhooks: add `SLACK_WEBHOOK_URL` and/or `TEAMS_WEBHOOK_URL` env vars to broadcast new comments.
- Shareable calendars: import `/api/calendar.ics` in Google/Outlook/Apple to overlay task deadlines for the entire workspace.
## Role-aware chat

Visit `/chat` to direct-message coworkers. Rules:

- Admins can reach every employee in their business
- Managers can chat with Guests assigned to the same department
- Guests can chat with their department’s manager

Messages are persisted to the `messages` collection and refresh automatically every few seconds.

## Industry-aware onboarding

- Admins can tailor StockVerse per business type from the dashboard prompt or by calling `GET/PUT /api/business/profile`.
- Industries ship with different module recommendations (retail prioritizes inventory, IT leans on tasks/chat, etc.).
- The stored profile drives adaptive copy and CTA cards so every workspace feels purpose-built for its vertical.

## Localization / i18n

- The UI now ships with a lightweight i18n layer (`src/context/I18nContext.tsx`) and starter dictionaries in `src/locales/*`.
- Users can switch between English, Spanish, or French from the sidebar language selector; their choice persists in `localStorage`.
- Use the exported `useI18n().t()` helper in new components to keep copy translatable, and rely on the provider’s `formatCurrency` / `formatDate` helpers for locale-aware formatting.
