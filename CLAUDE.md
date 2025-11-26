# sv-portal - Storage Valet Customer Portal
**Last Updated:** Nov 25, 2025
**Branch:** main (all merged Nov 24)
**Production:** Deployed to portal.mystoragevalet.com

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

### ✅ Working
- Magic link login
- Basic dashboard display
- Stripe billing portal redirect
- Photo uploads to storage

### ⚠️ Built but Untested
- Item selection modal (Nov 18)
- Multi-photo upload (1-5 photos)
- Search and filtering
- Profile editing
- Schedule page with tabs
- Add/Edit/Delete items

### ❌ Not Working in Production
- Calendly integration (on feature branch only)
- Item selection flow (missing migrations)
- Service area gating (needs migration 0004+)

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