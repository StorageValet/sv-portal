# 🚦 **READ FIRST — AI AGENT STARTUP RULES (SYSTEM PROTECTION BLOCK)**

**Last Verified Stable Date:** **Dec 9, 2025**
**Environment:** Production (Vercel + Supabase)
**Status:** All systems healthy, repos clean, and fully deployed.

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

## ✅ **4. Item Status Logic: DO NOT REWRITE**

The correct and intentional state machine is:

```text
home → scheduled → stored
(stored → home on delivery completion)
```

And for editing:
- Adding items → scheduled
- Removing pickup items → home
- Removing delivery items → stored

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
- **sv-portal/main:** `c77237e` (Dec 9, 2025 - Yellow banner flicker fix)
- **sv-db/main:** `b9a0330`
- **sv-edge/main:** `5504ce0`

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
