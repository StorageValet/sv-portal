# 🚦 **READ FIRST — AI AGENT STARTUP RULES (SYSTEM PROTECTION BLOCK)**

**Last Verified Stable Date:** **Dec 15, 2025**
**Environment:** Production (Vercel + Supabase)
**Status:** All systems healthy, repos clean, and fully deployed.

### Dec 15, 2025 Session - Brand Palette v1.1 Implementation

**Changes shipped:**
- **Tailwind CSS variables:** Added 6-color brand palette with space-separated RGB values for alpha support
- **Portal background:** Changed from Soft White to Bright Snow for consistency with landing page
- **Status borders:** Scheduled items now use `border-oxford-navy/25` instead of amber (removes warning appearance)
- **UI Guardrails:** Added comprehensive styling policy to prevent color drift (see bottom of this file)
- **Framer cleanup:** Removed duplicate "2. Valet Pickup" heading in Concierge section

**Commits:**
- `7f77238` - style: soften scheduled status accent + align stored accent to valet teal
- `cb90763` - docs: add UI guardrails to prevent styling drift

**Key files changed:**
- `src/index.css` - CSS variables for brand palette
- `tailwind.config.js` - Brand colors with alpha support
- `src/components/ItemCard.tsx` - Status border styling

---

### Dec 14, 2025 Session - Pre-Launch UI/UX Cleanup

**Changes shipped:**
- **Photo upload fix:** AddItemModal now appends photos instead of replacing (was bug at line 52)
- **Value optional:** Both AddItemModal and EditItemModal allow blank/0 value (was required)
- **Set Cover UI:** EditItemModal now has "Set Cover" button matching AddItemModal
- **Insurance disclaimer:** Dashboard shows "Coverage applies only to items currently in our possession..." below progress bar

**Commit:** `e684e1b` - Fix photo uploads, make value optional, add cover selection, add insurance disclaimer

**Deferred items:**
- Insurance calculation DB fix (v_user_insurance view counts ALL items, should only count scheduled/stored)
- Space used vs allotted tracker (no data model for customer allotment)

**Test checklist (browser):**
- [ ] Photo persistence: select 3, then +2 → should show 5
- [ ] Value blank: create item with empty value → succeeds as $0
- [ ] Set Cover: EditItemModal hover non-first photo → button appears, works
- [ ] Insurance disclaimer: visible below progress bar on Dashboard

---

### Dec 9, 2025 Session - Portal Fixes

**Yellow banner flicker fix:** Added `profile &&` guard to service area warning banners in Dashboard.tsx. The banners now only show when profile is fully loaded AND address is missing/invalid.

**Commit:** `c77237e` - Fix yellow banner flicker on dashboard load

**SPEC-1 Dataflow: STABILIZED ✅** - Full registration flow tested with zach+101 and zach+102.

---

This file defines the *authoritative truth* for this repository.
All AI agents (Claude Code, ChatGPT, etc.) must follow these rules before making any assumptions, changes, or recommendations.

---

## ✅ **1. Treat the Repository as Clean and Stable**

- Do **not** assume the repository is broken or corrupted.
- Do **not** suggest rebuilding migrations, deleting directories, or recreating projects unless explicitly asked.
- The codebase is **known-good**, deployed, tested, and stable as of the commit hashes listed below.

---

## ✅ **2. Handle Untracked or Modified Files Safely**

If `git status` shows untracked files:

- FIRST ask:
  > "Is this intentional, or should I add it to .gitignore or remove it?"

- If the user does *not* explicitly say "commit this,"
  → add it to `.gitignore` or clean it up.
- **Never assume new files indicate broken code.**
- **Never remove or alter migrations automatically.**

This prevents accidental deletion of business logic or schema history.

---

## ✅ **3. Calendly Integration: DO NOT MODIFY**

The production Calendly → Supabase → Portal integration is **confirmed working** on `main`.

- Do NOT suggest removing it.
- Do NOT rebuild or redesign it.
- Only modify Calendly logic when the user specifically requests new features or changes.

---

## ✅ **4. Item Status Logic (Production-Critical — DO NOT REWRITE)**

**See ~/.claude/CLAUDE.md → "CANONICAL PORTAL & INVENTORY SYSTEM SPECIFICATION" for authoritative spec.**

### Target State Machine (Canonical)
```text
Pickup flow:  home → scheduled_pickup → stored
Delivery flow: stored → scheduled_delivery → home
Cancel/Revert: scheduled_pickup → home | scheduled_delivery → stored
```

### Current Reality (Dec 29, 2025)
The DB currently uses a single `scheduled` state (not split). Implementation must:
- Infer pickup vs delivery from action association (which array contains the item)
- Revert to `home` if in `pickup_item_ids`, `stored` if in `delivery_item_ids`

**Phase 1 constraint:** This single-state design is intentional. Do not simulate or partially implement split states in code.

**Critical safety requirement (production-blocking):**
- Items must NEVER be stranded in a scheduled state
- Customers must be able to self-revert scheduled items
- Visible "Cancel / Revert" action required for all scheduled items

This state model is correct.
Do NOT change it unless explicitly asked.

---

## ✅ **5. Migrations Are Fully Applied**

Supabase migrations are complete and in sync:
- Latest db commit: `b9a0330`
- All migrations have been applied.
- There are no pending migration files.

Do NOT generate, delete, reorder, or modify migrations unless the user explicitly asks for schema changes.

---

## ✅ **6. Branding Assets Are Correct and Final**

- Header wordmark (600×80 PNG) integrated and sized appropriately.
- Sign-in hero logo (1200×1200 PNG) integrated and tested.
- SVG leftovers were removed intentionally.
- Do NOT regenerate or downscale assets unless asked.

---

## ✅ **7. When Starting a New Session: Follow This Protocol**

Before making ANY changes, run:

```bash
git status
```

Then follow these rules:
1. If there are no changes → proceed normally.
2. If there are changes, ask:
   > "Should these be committed, ignored via .gitignore, or discarded?"
3. Do NOT:
   - Suggest that changes imply broken code
   - Recommend removing migrations
   - Recommend re-initializing repos
   - Suggest that Calendly only works on a feature branch
   - Propose rewrites without user instruction
4. ALWAYS assume system integrity unless explicitly told otherwise.

---

## 🔐 **8. Last Known Good Commits**

Record of last verified stable state:
- **sv-portal/main:** `cb90763` (Dec 15, 2025 - Brand palette v1.1, UI guardrails)
- **sv-db/main:** `c8dcd1d` (Insurance view ACL lockdown)
- **sv-edge/main:** `ab7c37c` (Staff schema reference fix)

All repos confirmed clean.
Production portal returning 200 OK.
All features verified functional.

---

## 🧭 **9. Instructions for Future Claude Code**

If anything seems inconsistent:

> "Pause. Ask Zach for confirmation before touching anything."

- NEVER proactively rewrite or refactor critical systems.
- NEVER assume corruption.
- NEVER rebuild without explicit direction.

---

## 🎯 **Purpose of This Block**

This block ensures:
- Clean session handoffs
- Zero false alarms
- Zero unnecessary rebuilds
- Zero "feature-branch panic"
- A predictable, stable developer experience for Zach and Storage Valet

---

✔️ **End of Protection Block**

(Session-specific notes below this line.)

---

## 🔐 Security & Secrets Handling

**Policy (non-negotiable):**
- Never paste secrets into chat, docs, or commits.
- Never ask a human to paste secrets into chat.
- 1Password CLI (`op`) is the approved source of truth for secrets.
- Secrets must be fetched via `op` and injected directly into Supabase/Vercel/etc without being printed or logged.
- If a secret appears in any persistent text channel, treat it as compromised and rotate immediately.
- Do not store secrets in `.zshrc` / `.zprofile`. Aliases that fetch from `op` are acceptable, but secrets must not be hardcoded.

**Approved Pattern:**
```bash
# Inject secret directly without echoing
op item get "Stripe Live" --vault "API Credentials" --fields webhook_secret \
  | xargs -I {} supabase secrets set STRIPE_WEBHOOK_SECRET="{}"
```

---

# sv-portal - Storage Valet Customer Portal
**Last Updated:** Nov 27, 2025
**Branch:** main (all merged Nov 24)
**Production:** Deployed to portal.mystoragevalet.com

## Session: 2025-11-27 – Portal polish, item status, bookings, logos

- Renamed item status `in_transit` → `scheduled` across DB and portal.
- Wired bookings so items added to a service are marked `scheduled`, and edit mode lets you add/remove items, reverting removed items back to `home` or `stored`.
- Added item photo thumbnails in ItemSelectionModal and a photo gallery in ItemDetailModal.
- Fixed Calendly → actions integration so Book Appointment creates Upcoming Services for matching user emails.
- Repaired search to match label, description, QR code, category, and tags with proper null handling.
- Integrated new branding:
  - Header wordmark (600×80 PNG) at larger size in nav.
  - New white-on-navy hero logo on the sign-in page.
- All repos (sv-db, sv-portal, sv-edge) are clean, on main, and pushed as of this session.

## Status (Nov 25)
- All branches merged to main
- Deployed to Vercel production
- Database migrations applied
- **PENDING:** Manual browser testing

## Tech Stack
- React 18.3.1
- Vite 5.4.10
- TypeScript 5.6.3
- TailwindCSS 3.4.14
- React Router 6.28.0
- @supabase/supabase-js 2.46.1

## Project Structure
```
src/
├── pages/          # Route components
│   ├── Login.tsx       # Magic link auth
│   ├── Dashboard.tsx   # Customer homepage
│   ├── Schedule.tsx    # Booking management
│   └── Account.tsx     # Profile & billing
├── components/     # Reusable components
│   ├── ItemSelectionModal.tsx  # Schedule-first flow
│   ├── AddItemModal.tsx        # Item creation
│   └── EditItemModal.tsx       # Item editing
├── lib/           # Utilities
│   └── supabase.ts    # Client initialization
└── App.tsx        # Router & auth wrapper
```

## Environment Variables
```env
VITE_SUPABASE_URL=https://gmjucacmbrumncfnnhua.supabase.co
VITE_SUPABASE_ANON_KEY=[legacy JWT key from Dashboard]
VITE_CALENDLY_SCHEDULING_URL=https://calendly.com/storagevalet
```

## Current Features Status

### ✅ Working (Nov 27)
- Magic link login
- Dashboard with upcoming services
- Stripe billing portal redirect
- Photo uploads to storage
- Calendly integration (creates actions for matching emails)
- Item selection modal with photo thumbnails
- Search (label, description, QR, category, tags)
- Item status flow: home → scheduled → stored
- Edit booking items (add/remove with status revert)

### ⚠️ Needs More Testing
- Multi-photo upload (1-5 photos)
- Profile editing
- Schedule page tabs
- Service area gating

## Common Issues & Solutions

### "Cannot read properties of null"
- User not logged in
- Check localStorage for session
- Magic link might have expired

### "No items found"
- Database might be empty
- Check if migrations are applied
- RLS policies might be blocking

### Portal shows old version
- Vercel cache issue
- Hard refresh: Cmd+Shift+R
- Check deployment status on Vercel

## Development Commands
```bash
# Start development
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

## Testing Locally
1. Start dev server: `npm run dev`
2. Open: http://localhost:5173
3. Login with: zach@mystoragevalet.com
4. Check for magic link email
5. Click link to authenticate

## Known Technical Debt
1. **No error boundaries** - App crashes on errors
2. **No loading states** - UI freezes during requests
3. **No offline support** - Requires constant connection
4. **No tests** - Zero test coverage
5. **Console errors** - Multiple warnings ignored

## Deployment Checklist
- [ ] On correct git branch?
- [ ] Migrations applied to production?
- [ ] Environment variables set in Vercel?
- [ ] Edge functions deployed?
- [ ] Tested magic link flow?
- [ ] Checked for console errors?

## File-Specific Notes

### Dashboard.tsx
- Shows upcoming bookings from `actions` table
- Service area warning if out_of_service_area = true
- "Add Items" button only for pending bookings

### Schedule.tsx
- Three tabs: Pickups, Redeliveries, Containers
- Uses ItemSelectionModal for schedule-first flow
- Expects ?action_id= query parameter

### ItemSelectionModal.tsx
- Critical for schedule-first flow
- Calls update-booking-items edge function
- Updates pickup_item_ids and delivery_item_ids

## Remember
This portal has been through 8+ iterations.
The current version "works" but needs testing.
Don't add features - test and fix what exists.
The family needs revenue, not perfect code.

---

## 🎨 UI Guardrails — Brand v2.2 (Deep Teal + Action Brown)

**Updated:** January 15, 2025
**Purpose:** Keep the codebase stable, brand-consistent, and aligned with sv-website.
**Canonical Reference:** `~/code/sv-docs/brand/sv-brand-guide-jan-2025.html`

### Brand v2.2 Palette (Single Source of Truth)

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `sv-deep-teal` | #213C47 | 33 60 71 | Headers, hero panels, headlines |
| `sv-gunmetal` | #343A40 | 52 58 64 | Primary body text |
| `sv-slate` | #6A7F83 | 106 127 131 | Secondary text |
| `sv-steel` | #88989A | 136 152 154 | Muted text, placeholders |
| `sv-brown` | #6B4E3D | 107 78 61 | **PRIMARY CTA ONLY** |
| `sv-brown-hover` | #5A4133 | 90 65 51 | CTA hover states |
| `sv-accent` | #0E6F6A | 14 111 106 | Links, icons, focus rings |
| `sv-parchment` | #EEEBE5 | 238 235 229 | Warm page backgrounds |
| `sv-alabaster` | #E0E1DD | 224 225 221 | Cool section backgrounds |
| `sv-white` | #FFFFFF | 255 255 255 | Cards, modals, inputs |

### Token Migration (Deprecated → New)

| Deprecated | New Token | Notes |
|------------|-----------|-------|
| `sv-midnight`, `sv-viridian` | `sv-deep-teal` | Headers |
| `sv-terracotta` | `sv-brown` | Primary CTA |
| `sv-ember` | `sv-brown-hover` | Hover states |
| `sv-navy`, `sv-peach` | `sv-accent` | Links, focus |
| `sv-ivory`, `sv-cream` | `sv-white` | Cards |
| `sv-bone`, `sv-sand` | `sv-parchment` | Backgrounds |
| `sv-stone` | `sv-steel` | Muted text |

### 1) Token-First Colors (No Random Tailwind)

**Do not introduce new colors** via Tailwind defaults.

**Allowed (Brand v2.2 tokens):**
- Backgrounds: `bg-sv-parchment`, `bg-sv-alabaster`, `bg-sv-white`
- Text: `text-sv-deep-teal`, `text-sv-gunmetal`, `text-sv-slate`, `text-sv-steel`
- CTA: `bg-sv-brown`, `hover:bg-sv-brown-hover`
- Accent: `text-sv-accent`, `border-sv-accent`, `ring-sv-accent`
- With opacity: `border-sv-deep-teal/10`, `text-sv-slate/70`

**Allowed semantic exceptions:**
- **Error/Danger:** `red-*` classes for destructive actions, validation errors
- **Success:** `green-*` classes for "Active", "Success", "Confirmed" states
- **Warning:** `amber-*`/`yellow-*` ONLY for urgent attention

**Prohibited:**
- `bg-white`, `text-black`, `text-gray-*`, `border-gray-*`
- `bg-blue-*`, `bg-indigo-*`, `bg-purple-*`
- Deprecated tokens: `sv-midnight`, `sv-terracotta`, `sv-ember`, `sv-viridian`, etc.
- Hardcoded hex colors in components

### 2) CSS Variable Format (Critical)

CSS variables **must be space-separated RGB**, not comma-separated:

```css
/* ✅ Correct */
:root { --color-sv-deep-teal: 33 60 71; }

/* ❌ Breaks alpha parsing */
:root { --color-sv-deep-teal: 33, 60, 71; }
```

### 3) Pre-Push Checklist

```bash
# 1. Must pass
npm run build

# 2. Quick visual QA
#    - /login (hero panel Deep Teal, button Action Brown)
#    - /dashboard (cards white, headers Deep Teal)
#    - /account (forms, buttons)

# 3. Check for prohibited colors
rg -n "bg-white|text-gray-|border-gray-|bg-indigo-" src

# 4. Check for deprecated tokens (should not appear)
rg -n "sv-midnight|sv-terracotta|sv-ember|sv-viridian|sv-ivory|sv-cream|sv-bone" src
```

### 4) Implementation Reference

Full migration guide with Tailwind config and component examples:
- `~/code/sv-docs/brand/sv-portal-brand-migration-prompt.md`
- `~/code/sv-docs/brand/sv-brand-guide-jan-2025.html` (interactive)
