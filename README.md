# sv-portal — Storage Valet Customer Portal

**Version:** v3.1
**Purpose:** Vite + React + TypeScript portal for customer item management

## Constraints (v3.1)

- **Files in src/**: ≤12 (currently 11)
- **Production dependencies**: exactly 6
- **Routes**: exactly 4 (`/login`, `/dashboard`, `/schedule`, `/account`)
- **LOC**: <500 core logic (excluding configs)

## Structure

```
sv-portal/
├── src/
│   ├── main.tsx                   # Entry point with QueryClient
│   ├── App.tsx                    # Router with 4 routes
│   ├── index.css                  # Tailwind + utility classes
│   ├── vite-env.d.ts              # TypeScript env declarations
│   ├── lib/
│   │   └── supabase.ts            # Client + photo helpers (signed URLs, validation)
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Auth guard
│   │   └── ItemCard.tsx           # Item display with signed URL photos
│   └── pages/
│       ├── Login.tsx              # Magic link auth
│       ├── Dashboard.tsx          # Items list + profile
│       ├── Schedule.tsx           # Pickup/delivery form (48h minimum)
│       └── Account.tsx            # Billing (Stripe Customer Portal)
├── package.json                   # 6 deps: supabase-js, react-query, react, react-dom, react-router-dom, tailwindcss
└── vite.config.ts
```

## Dependencies (6)

1. `@supabase/supabase-js` — Auth + DB + Storage
2. `@tanstack/react-query` — Data fetching
3. `react` — UI library
4. `react-dom` — DOM rendering
5. `react-router-dom` — Routing
6. `tailwindcss` — Styling

## Features

### Authentication
- Magic link only (no passwords)
- Auto-redirect to `/dashboard` after login
- Protected routes with `ProtectedRoute` component

### Dashboard
- Displays all items with photos (signed URLs, 1h expiry)
- Shows subscription status
- RLS ensures owner-only access

### Schedule
- Pickup/delivery request form
- 48-hour minimum notice enforced
- Stores as `pending` action in DB

### Account
- Profile summary
- "Manage Billing" button → calls `create-portal-session` Edge Function
- Redirects to Stripe Hosted Customer Portal

### Photo Security (Gate 2)
- Private `item-photos` Storage bucket
- RLS policies: owner-only access
- All photo renders via signed URLs (`getItemPhotoUrl()`)
- Client-side validation: ≤5MB, JPG/PNG/WebP only (Gate 6)

## Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase URL and keys

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `VITE_APP_URL` — Portal base URL (for redirects)

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Configure SPA rewrites:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/" }]
   }
   ```
5. Point `portal.mystoragevalet.com` to Vercel

## Language Guidelines

- Use "as needed" (never "on-demand")
- Emphasize premium, concierge positioning
- 48-hour notice messaging on Schedule page

## Security

- RLS enforced on all customer tables
- Signed URLs for all photo access
- No secrets in client code
- Edge Functions handle Stripe operations

---

### Project docs
Core specs & runbooks: **https://github.com/mystoragevalet/sv-docs**

- Implementation Plan v3.1
- Final Validation Checklist v3.1
- Deployment Instructions v3.1
- Go–NoGo (Line in the Sand) v3.1
- Business Context & Requirements v3.1
- Runbooks (webhook tests, env setup, smoke tests)
