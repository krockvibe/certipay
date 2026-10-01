# CertiPay (demo)

A demonstration web app for creating and tracking transfer receipts. Built with
React, TypeScript, Vite and Tailwind CSS.

> **This is a demo project, not a payment service.** No money moves, no funds are
> held, and no licences are held. All data lives in your browser's `localStorage`.
> See [Not a real service](#not-a-real-service) before using this anywhere
> customer-facing.

## Features

- **Create receipts** with sender, recipient, amount, fees, status, messaging,
  branding colours and an optional bank logo. The tracking preview updates live as
  you type.
- **10-digit tracking codes** generated with `crypto.getRandomValues`. The code
  shown in the preview is the exact code that gets saved, so a copied code always
  resolves on the tracking page.
- **Track** a receipt by its code, including deep links like
  `/track?code=1234567890`.
- **Dashboard** listing your own receipts, with working edit and delete.
  Editing keeps the original tracking code, so links you already shared stay valid.
- **Account screens** (sign in / sign up) that gate the create and dashboard
  routes.

## Getting started

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Then open the printed URL, normally <http://localhost:5173>.

### Other scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npx oxlint src/` | Lint |

## Deploying

The app is a static single-page app, so any static host works. It is configured
for Vercel via `vercel.json`, which includes the SPA fallback rewrite needed for
client-side routes to survive a hard refresh.

```bash
npm run build
npx vercel --prod
```

If you deploy elsewhere, make sure unknown paths rewrite to `index.html`.

## Architecture

```
src/
  pages/          HomePage, CreatePage, TrackPage, DashboardPage,
                  SignInPage, SignUpPage, NotFoundPage
  components/
    receipt/      TrackingReceiptPreview (the tracking card),
                  ReceiptPreview, CreateFormSections
    ui/           Small shadcn-style primitives
  context/
    AuthContext      Sign-in state, password hashing
    ReceiptContext   Receipt storage, CRUD, localStorage persistence
  lib/utils.ts   Code generation, currency and date formatting
  types/receipt.ts  Receipt and form types, default form values
```

State is held in React context and mirrored to `localStorage` on change.

### Data model notes

- `trackingCode` — 10 digits, generated client-side, unique per receipt.
- `createdBy` — email of the account that created the receipt. The dashboard
  filters on this, so accounts do not see each other's receipts.
- `isAnonymous` — set when a receipt is generated while signed out. Anonymous
  receipts are only listed for signed-out visitors, which keeps unowned legacy
  data from leaking into every account.

## Not a real service

Read this before reusing the project.

**Authentication is local only.** Accounts are a record in `localStorage` with a
salted SHA-256 digest of the password. There is no server, so anyone with access
to the browser profile can read and modify everything. Password hashing here
avoids storing plaintext in devtools; it is *not* a substitute for real auth.

**Storage is per-browser.** Receipts do not sync across devices or browsers. Two
people using the same deployment on different machines see separate data.

**Uploaded images are stored as data URLs** in `localStorage`, which caps total
storage at roughly 5MB and can fail silently on large files.

**The legal copy is placeholder text.** Regulatory claims, registration numbers,
and company details shipped in this repo are fictional and must be replaced with
accurate, verified information before any real use.

To make this production-ready you would need a backend providing real
authentication, server-side authorisation, and durable storage.

## Licence

MIT
