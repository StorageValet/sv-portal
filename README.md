# sv-portal — Storage Valet Customer Portal

**Version:** v3.1 (Phase 1 Complete - Sprints 1-4)
**Purpose:** Vite + React + TypeScript portal for customer item management

## Current Status (2025-10-18)

✅ **Sprint 0:** Database migrations applied (0001-0004)
✅ **Sprint 1:** Full CRUD operations (Add/Edit/Delete items)
✅ **Sprint 2:** Batch operations & scheduling
✅ **Sprint 3:** Search, filters, and profile editing
✅ **Sprint 4:** Event logging, timeline, and QR codes

## Project Structure

```
sv-portal/
├── src/
│   ├── main.tsx                   # Entry point with QueryClient
│   ├── App.tsx                    # Router with 4 routes
│   ├── index.css                  # Tailwind + utility classes
│   ├── vite-env.d.ts              # TypeScript env declarations
│   ├── lib/
│   │   └── supabase.ts            # Supabase client + helpers
│   │                              # - Photo management (signed URLs, upload/delete)
│   │                              # - Event logging (automatic history tracking)
│   │                              # - Validation helpers
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Auth guard
│   │   ├── ItemCard.tsx           # Item display with selection, actions
│   │   ├── AddItemModal.tsx       # Create new items (1-5 photos)
│   │   ├── EditItemModal.tsx      # Edit existing items
│   │   ├── DeleteConfirmModal.tsx # Delete confirmation with cleanup
│   │   ├── ProfileEditForm.tsx    # Profile/delivery info editor
│   │   ├── SearchBar.tsx          # Debounced search (300ms)
│   │   ├── FilterChips.tsx        # Status filter buttons
│   │   ├── ItemTimeline.tsx       # Event history timeline
│   │   ├── QRCodeDisplay.tsx      # QR code with print/download
│   │   └── ItemDetailModal.tsx    # Combined timeline + QR modal
│   └── pages/
│       ├── Login.tsx              # Magic link auth
│       ├── Dashboard.tsx          # Items grid/list with search/filters
│       ├── Schedule.tsx           # Batch pickup/redelivery/containers
│       └── Account.tsx            # Profile editor + billing
├── package.json
└── vite.config.ts
```

## Dependencies

### Production (8 total)
1. `@supabase/supabase-js` — Auth + DB + Storage
2. `@tanstack/react-query` — Data fetching & caching
3. `react` — UI library
4. `react-dom` — DOM rendering
5. `react-router-dom` — Routing
6. `tailwindcss` — Styling
7. `date-fns` — Date formatting (Sprint 4)
8. `qrcode.react` — QR code generation (Sprint 4)

## Features

### Authentication
- Magic link only (no passwords)
- Auto-redirect to `/dashboard` after login
- Protected routes with `ProtectedRoute` component

### Dashboard (Sprint 1-3)
- **Item Display:** Grid/list view toggle
- **Search:** Real-time keyword search (debounced 300ms)
  - Searches: label, description, QR code, category, tags
- **Filters:** Status (all/home/scheduled/stored), Category
- **Batch Selection:** Multi-select items for batch operations
- **CRUD Operations:**
  - **Add:** Multi-photo upload (1-5 photos), business fields
  - **Edit:** Update details, manage photos
  - **Delete:** Confirmation with storage cleanup
  - **Details:** View timeline + QR code
- **Insurance Tracker:** Visual $3,000 coverage display
- **Subscription Status:** Active subscription display

### Item Management
- **Multi-Photo Support:** 1-5 photos per item
- **Photo Security:** Private bucket, RLS, signed URLs (1h expiry)
- **Physical Lock:** Dimensions locked after pickup confirmation
- **Status Tracking:** home → scheduled → stored
- **Categories:** Optional item categorization
- **Tags:** Searchable tags array
- **QR Codes:** Auto-generated (SV-YYYY-NNNNNN format)
  - Print functionality
  - Download as PNG
  - Display in detail modal

### Event Logging & History (Sprint 4)
- **Automatic Logging:** All CRUD operations tracked
- **Event Types:** item_created, item_updated, item_deleted
- **Timeline View:** Chronological event history per item
- **Event Data:** Captures relevant context (label, changed fields, etc.)
- **RLS Protected:** Users see only their own events

### Scheduling (Sprint 2)
- **Tabbed Interface:** Pickup / Redelivery / Request Containers
- **Batch Operations:** Schedule multiple items at once
- **48-Hour Notice:** Minimum scheduling requirement enforced
- **Container Requests:** Bins, totes, crates quantities
- **Service Types:** Uses `service_type` field (pickup/redelivery/container_delivery)
- **Item Tracking:** `item_ids[]` array for batch associations

### Profile & Account (Sprint 3)
- **Editable Profile:**
  - Full name, phone number
  - Delivery address (street, city, state, ZIP, unit)
  - Delivery instructions
- **Billing Management:** Stripe Customer Portal integration
- **Subscription Display:** Current plan and status

### Data Integrity
- **RLS:** All tables protected (items, customer_profile, actions, inventory_events)
- **Photo Validation:** ≤5MB, JPG/PNG/WebP only
- **Photo Constraints:** 1-5 photos required per item
- **Physical Lock Trigger:** Prevents dimension edits after pickup
- **Cascade Deletes:** Clean up related records automatically

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

## Database Schema (Migration 0004)

### Tables
- **items** — Customer inventory
  - Multi-photo: `photo_paths text[]`
  - Status: `status text` (home/scheduled/stored)
  - Category: `category text`
  - Physical lock: `physical_locked_at timestamptz`
  - QR code: `qr_code text` (auto-generated)

- **customer_profile** — User details
  - Personal: `full_name`, `phone`
  - Delivery: `delivery_address jsonb`, `delivery_instructions text`

- **actions** — Service requests
  - Service type: `service_type text` (pickup/redelivery/container_delivery)
  - Batch support: `item_ids uuid[]`

- **inventory_events** — Movement history
  - Event tracking: `event_type text`, `event_data jsonb`
  - Timeline: `created_at timestamptz`

### Indexes (Performance)
- `idx_items_status` — Status filtering
- `idx_items_category` — Category filtering
- `idx_items_user_status_created` — Composite user queries
- `idx_items_photo_paths_gin` — Photo array queries
- `idx_actions_item_ids_gin` — Batch item lookups
- `idx_inventory_events_item_id_created` — Timeline queries
- `idx_inventory_events_user_id_created` — User event history

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

## Testing Checklist

### Sprint 3: Search & Filters
- [ ] Keyword search filters items in real-time
- [ ] Search works across label, description, tags, category
- [ ] Status filter chips work (all/home/scheduled/stored)
- [ ] Category filter dropdown functions
- [ ] Combined filters work together
- [ ] Grid/list view toggle works
- [ ] Clear filters button resets all

### Sprint 3: Profile Editing
- [ ] Profile form loads existing data
- [ ] Can update name, phone, address, instructions
- [ ] Success message appears on save
- [ ] Data persists after page refresh

### Sprint 4: Event Logging
- [ ] Creating item logs 'item_created' event
- [ ] Editing item logs 'item_updated' event
- [ ] Deleting item logs 'item_deleted' event before deletion
- [ ] Events appear in timeline

### Sprint 4: Timeline & QR
- [ ] Detail modal opens from "Details" button
- [ ] Timeline shows event history
- [ ] QR code displays correctly
- [ ] Download PNG works
- [ ] Print functionality works
- [ ] Modal can be closed

## Language Guidelines

- Use "as needed" (never "on-demand")
- Emphasize premium, concierge positioning
- 48-hour notice messaging on Schedule page

## Security

- RLS enforced on all customer tables
- Signed URLs for all photo access (1h expiry)
- No secrets in client code
- Edge Functions handle Stripe operations
- Physical data locked after pickup confirmation
- Cascade deletes prevent orphaned records

---

## Next Steps (Future Sprints)

- Advanced search (date ranges, value filters)
- Bulk import/export
- Mobile app (React Native)
- Customer notifications (email/SMS)
- Document upload (insurance docs, receipts)
- Shared access (family accounts)

---

### Project Documentation
Core specs & runbooks: **https://github.com/mystoragevalet/sv-docs**

- Implementation Plan v3.1
- Final Validation Checklist v3.1 Phase 1
- Deployment Instructions v3.1
- Go–NoGo (Line in the Sand) v3.1
- Business Context & Requirements v3.1
- Runbooks (webhook tests, env setup, smoke tests)
