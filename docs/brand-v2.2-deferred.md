# Brand v2.2 Deferred Components

**Created:** January 15, 2025
**Status:** Intentionally deferred pre-launch

## Overview

The Brand v2.2 alignment sprint (January 2025) updated the primary customer-facing surfaces to use the Deep Teal + Action Brown palette. The following secondary components still contain deprecated v1.1 tokens and were intentionally deferred to avoid scope creep before launch.

## Deferred Files

| File | Deprecated Tokens Found |
|------|------------------------|
| `src/components/ItemSelectionModal.tsx` | sv-terracotta, sv-ember, sv-midnight, sv-bone, sv-sand, sv-cream, sv-peach, sv-stone, sv-navy |
| `src/components/WaitlistDashboard.tsx` | sv-midnight, sv-bone, sv-cream |
| `src/components/ProfileEditForm.tsx` | sv-midnight, sv-bone, sv-stone, sv-sand |
| `src/components/QRCodeDisplay.tsx` | sv-midnight, sv-cream |
| `src/components/ItemTimeline.tsx` | sv-midnight, sv-bone |
| `src/components/SearchBar.tsx` | sv-stone, sv-sand, sv-navy |
| `src/components/FilterChips.tsx` | sv-terracotta, sv-bone, sv-sand |
| `src/components/ErrorBoundary.tsx` | sv-cream, sv-midnight |
| `src/components/ErrorState.tsx` | sv-midnight |
| `src/components/ServiceAreaBadge.tsx` | sv-bone |

## Why Deferred

1. **Launch priority** - Core customer flows (dashboard, login, modals) were prioritized
2. **Low visibility** - Many of these are error states or edge-case UI
3. **Scope control** - Style-only sprint needed clear boundaries
4. **WaitlistDashboard** - May be deprecated entirely post-launch

## Token Migration Reference

| Deprecated | Replacement |
|------------|-------------|
| `sv-midnight` | `sv-deep-teal` (headers) or `sv-gunmetal` (text) |
| `sv-terracotta` | `sv-brown` |
| `sv-ember` | `sv-brown-hover` |
| `sv-navy` | `sv-accent` (focus rings) or `sv-deep-teal` |
| `sv-ivory`, `sv-cream` | `sv-white` (cards) or `sv-parchment` (backgrounds) |
| `sv-bone` | `sv-parchment` or `sv-alabaster` |
| `sv-sand` | `border-sv-deep-teal/10` or `sv-steel/30` |
| `sv-stone` | `sv-steel` |
| `sv-peach` | Remove (no v2.2 equivalent) |

## Follow-Up Plan (Post-Launch)

1. **Week 1 post-launch**: Update `ItemSelectionModal.tsx` (highest visibility of deferred files)
2. **Week 2**: Update `ProfileEditForm.tsx` and `SearchBar.tsx`
3. **Week 3**: Update remaining files (timeline, QR, errors, filters)
4. **Evaluate**: Decide whether to deprecate `WaitlistDashboard.tsx`

## Verification Command

```bash
# Check for remaining deprecated tokens
rg -n "sv-midnight|sv-terracotta|sv-ember|sv-navy|sv-viridian|sv-ivory|sv-cream|sv-bone|sv-sand|sv-stone|sv-peach" src/
```

---

*Reference: See `sv-docs/brand/sv-brand-guide-jan-2025.html` for full Brand v2.2 specification.*
