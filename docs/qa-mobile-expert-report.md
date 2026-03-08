# QA Mobile Responsiveness Report — HairCode™
**Date:** 2026-03-07
**Auditor:** qa-mobile-expert
**Scope:** Verify all responsive-design changes made by the responsive-design agent

---

## 1. Layout Layer

### 1.1 `apps/web/src/app/(dashboard)/layout.tsx`

**Checks:**
- `"use client"` directive present at line 1 — `useState` is safe to use. ✅
- `sidebarOpen` state declared via `useState(false)` at line 8. ✅
- Mobile overlay rendered conditionally when `sidebarOpen` is true (lines 13–18). ✅
- Overlay uses `z-40` (line 15); Sidebar uses `z-50` (sidebar.tsx line 32) — overlay is BELOW sidebar. ✅
- Overlay click handler calls `setSidebarOpen(false)` — tap-to-dismiss works. ✅
- `<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />` — props correctly passed (line 20). ✅
- `<Topbar onMenuClick={() => setSidebarOpen(true)} />` — prop correctly passed (line 23). ✅
- `overlay` has `lg:hidden` class — does not appear on desktop. ✅
- Main content area `p-4 sm:p-6` responsive padding on line 24. ✅

**Result: ✅ PASS**

---

### 1.2 `apps/web/src/components/layout/sidebar.tsx`

**Checks:**
- `SidebarProps` interface declares `open: boolean; onClose: () => void` (lines 16–19). ✅
- Sidebar uses `fixed inset-y-0 left-0 z-50` for mobile drawer (line 32). ✅
- `lg:relative lg:z-auto` resets to normal document flow on desktop (line 32). ✅
- Visibility toggled by `open ? "flex" : "hidden lg:flex"` (line 33) — correct: hidden on mobile when closed, always visible on desktop. ✅
- Close button with `lg:hidden` class (line 40) — invisible on desktop. ✅
- Close button has `aria-label="Close sidebar"` (line 41). ✅
- `<X>` icon used for close button (line 43). ✅
- Nav links call `onClick={onClose}` (line 53) — sidebar closes on navigate. ✅
- Nav links use Next.js `<Link>` component (line 50) — correct Next.js routing pattern. ✅
- Nav link touch target: `min-h-[44px]` (line 54) — meets 44px minimum touch target. ✅
- Sign out button: `min-h-[44px]` (line 69) — meets minimum touch target. ✅
- Sign out uses `router.push("/login")` and clears `hc_token` from localStorage. ✅

**Result: ✅ PASS**

---

### 1.3 `apps/web/src/components/layout/topbar.tsx`

**Checks:**
- `TopbarProps` interface declares `onMenuClick: () => void` (lines 41–43). ✅
- Component accepts and calls `onMenuClick` on hamburger click (line 95). ✅
- Hamburger button has `lg:hidden` class (line 96) — hidden on desktop. ✅
- Hamburger button has `aria-label="Open sidebar"` (line 97). ✅
- Header padding is `px-4 sm:px-6` (line 92). ✅
- Notification bell dropdown uses `max-w-[calc(100vw-2rem)]` (line 121) — prevents overflow off-screen on mobile. ✅
- User avatar dropdown uses `max-w-[calc(100vw-2rem)]` (line 164) — prevents overflow off-screen on mobile. ✅
- Both dropdowns use `z-50` — correctly above overlay (`z-40`) and sidebar (`z-50`). Note: dropdowns and sidebar share `z-50`; on desktop this is not an issue since sidebar is `lg:relative`. On mobile the sidebar would be behind an open dropdown only if both were simultaneously visible, which is prevented by the UX flow. ✅

**Result: ✅ PASS**

---

## 2. Dashboard Pages

### 2.1 `apps/web/src/app/(dashboard)/dashboard/page.tsx`

**Checks:**
- Outer wrapper uses `p-4 sm:p-6` padding (line 8). ✅
- Header uses `flex-col sm:flex-row` with `items-start sm:items-center` (line 9) — stacks on mobile. ✅
- Stats grid: `grid-cols-1 sm:grid-cols-3` (line 24) — single column on mobile, 3-column on sm+. ✅
- Main content grid: `grid-cols-1 lg:grid-cols-3` (line 30) — single column on mobile, 3-column on desktop. ✅
- `TodaySchedule` spans `lg:col-span-2`, `RecentClients` spans `lg:col-span-1`. ✅

**Note:** The "New Consultation" button is a plain `<a>` tag (line 16), not a Next.js `<Link>`. This is a pre-existing issue unrelated to mobile responsiveness — the button is not `w-full sm:w-auto`, meaning on very small screens it will be inline-block width. This is a minor UX concern but was not listed as a required change.

**Result: ✅ PASS**

---

### 2.2 `apps/web/src/app/(dashboard)/clients/page.tsx`

**Checks:**
- Outer wrapper uses `p-4 sm:p-6` (line 20). ✅
- Header uses `flex-col sm:flex-row items-start sm:items-center` (line 21). ✅
- "New Consultation" button uses `w-full sm:w-auto` (line 23). ✅
- Mobile card list (lines 41–62): uses `sm:hidden` — visible only below `sm` breakpoint. ✅
- Desktop table (lines 65–104): uses `hidden sm:block` — hidden on mobile, visible sm+. ✅
- Mobile card renders: `client.name`, `client.email`, `client.lastVisit`, `client.protocol` — all fields exist on `MOCK_CLIENTS` objects (lines 5–9). ✅
- Mobile card status badge accesses `statusColors[client.protocol]` — `statusColors` map covers all values ("Active", "Completed", "Draft", "None") used in mock data. ✅
- Avatar initials derived from `client.name.split(" ").map(n => n[0]).join("")` (line 46) — valid for mock data. ✅
- Link to client detail: `href={/clients/${client.id}}` (line 58) — field `id` exists on mock data. ✅
- Search input uses `flex-1` with `flex-col sm:flex-row gap-3` wrapper (lines 29–38) — full width on mobile. ✅

**Result: ✅ PASS**

---

### 2.3 `apps/web/src/app/(dashboard)/settings/page.tsx`

**Checks:**
- Outer wrapper uses `p-4 sm:p-6` (line 143). ✅
- Tab nav container uses `overflow-x-auto` (line 159) — horizontally scrollable on small screens. ✅
- Save button uses `w-full sm:w-auto` (line 151). ✅
- Notification toggle size: `h-6 w-11` (line 357) — larger touch target as required. ✅
- Toggle thumb translate: `translate-x-6` when enabled (line 363), `translate-x-1` when disabled. ✅

**Toggle geometry validation:**
- Track width: `w-11` = 44px
- Thumb size: `h-4 w-4` = 16px
- Off position: `translate-x-1` = 4px from left → thumb left edge at 4px (correct: near left edge)
- On position: `translate-x-6` = 24px from left → thumb left edge at 24px, right edge at 40px
- Track right edge: 44px — thumb right edge (40px) leaves 4px gap from right edge. ✅

The `translate-x-6` value is correct for `w-11` track. If the old code used `translate-x-4` with `w-9` (36px track), the update to `translate-x-6` matches the new wider track. ✅

**Result: ✅ PASS**

---

## 3. Consultation Wizard

### 3.1 `apps/web/src/components/consultation/wizard.tsx`

**Checks:**
- Wizard header uses `px-4 sm:px-6` (line 47). ✅
- Header layout: `flex-col sm:flex-row items-start sm:items-center` (line 47). ✅
- Step indicator wrapper uses `px-4 sm:px-6 pt-4 sm:pt-6` (line 64). ✅
- Step content area uses `px-4 sm:px-6 py-4 sm:py-6` (line 69). ✅
- `max-w-2xl mx-auto w-full` constrains width on large screens while filling small screens. ✅

**Result: ✅ PASS**

---

### 3.2 `apps/web/src/components/consultation/step-indicator.tsx`

**Checks:**
- Step circle uses `w-7 h-7 min-w-[28px]` (line 24) — `min-w` prevents shrinking on small viewports. ✅
- Step label uses `hidden sm:inline` (line 32) — hidden on mobile (xs), visible sm+. ✅ Confirmed it uses `sm:inline` not just `hidden`.
- Connector line uses `flex-1 mx-1 mb-4` with `h-0.5` (line 37) — stays horizontal and scales. ✅

**Result: ✅ PASS**

---

### 3.3 Step 1 — `step1-profile.tsx`

**Checks:**
- Name row: `grid-cols-1 sm:grid-cols-2` (line 47). ✅
- Date of Birth / Gender row: `grid-cols-1 sm:grid-cols-2` (line 60). ✅
- Submit button is right-aligned with `justify-end` (line 88); no `w-full sm:w-auto` applied to submit button.

**Minor finding:** The "Continue →" button at line 89 does not use `w-full sm:w-auto`. On mobile it remains inline-width (auto), not full-width. The spec states "save button w-full sm:w-auto" for steps. This button is the step's primary CTA.

**Result: ⚠️ PARTIAL**
- `step1-profile.tsx:89` — Submit button missing `w-full sm:w-auto`. On mobile the button does not span the full width, which reduces tap target area compared to the spec requirement. **Fix:** Add `w-full sm:w-auto` to the submit button class.

---

### 3.4 Step 2 — `step2-hair.tsx`

**Checks:**
- Texture options use `flex flex-wrap gap-2` (line 39) — wraps on small screens. ✅
- Porosity grid: `grid-cols-1 sm:grid-cols-2` (line 65). ✅
- Elasticity grid: `grid-cols-1 sm:grid-cols-2` (line 78). ✅
- Damage index slider uses `w-full` (line 104). ✅
- Navigation row uses `flex justify-between` (line 111). ✅
- Submit button (line 113): no `w-full sm:w-auto` class.

**Minor finding:** Same as Step 1 — "Continue →" button at line 113 does not use `w-full sm:w-auto`.

**Result: ⚠️ PARTIAL**
- `step2-hair.tsx:113` — Submit button missing `w-full sm:w-auto`. **Fix:** Add `w-full sm:w-auto` to the submit button class.

---

### 3.5 Step 3 — `step3-scalp.tsx`

**Checks:**
- Biotype grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (line 32). ✅
- Sensitivity slider uses `w-full` (line 56). ✅
- pH input uses `w-full` (line 65). ✅
- Navigation row uses `flex justify-between` (line 87). ✅
- Submit button (line 89): no `w-full sm:w-auto` class.

**Minor finding:** Same pattern — "Continue →" button at line 89 does not use `w-full sm:w-auto`.

**Result: ⚠️ PARTIAL**
- `step3-scalp.tsx:89` — Submit button missing `w-full sm:w-auto`. **Fix:** Add `w-full sm:w-auto` to the submit button class.

---

### 3.6 Step 4 — `step4-body.tsx`

**Checks:**
- Activity level grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (line 48). ✅
- Diet select uses `w-full` (line 60). ✅
- Sleep/Stress sliders use `flex-1` inside a flex row. ✅
- Navigation row uses `flex justify-between` (line 82). ✅
- Submit button (line 84): no `w-full sm:w-auto` class.

**Minor finding:** Same pattern — "Continue →" button at line 84 does not use `w-full sm:w-auto`.

**Result: ⚠️ PARTIAL**
- `step4-body.tsx:84` — Submit button missing `w-full sm:w-auto`. **Fix:** Add `w-full sm:w-auto` to the submit button class.

---

### 3.7 Step 5 — `step5-morphology.tsx`

**Checks:**
- Camera box padding: `p-4 sm:p-8` (line 31). ✅
- Face shape grid: `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` (line 49). ✅
- Undertone row: `flex flex-wrap gap-3` (line 66). ✅ `flex-wrap` is present.
- Contrast row: `flex flex-wrap gap-3` (line 81). ✅ `flex-wrap` is present.
- Navigation row uses `flex justify-between` (line 91). ✅
- Submit button ("Generate Protocol →") at line 93: no `w-full sm:w-auto` class.

**Minor finding:** "Generate Protocol →" button at line 93 does not use `w-full sm:w-auto`.

**Result: ⚠️ PARTIAL**
- `step5-morphology.tsx:93` — Submit button missing `w-full sm:w-auto`. **Fix:** Add `w-full sm:w-auto` to the submit button class.

---

### 3.8 Step 6 — `step6-protocol.tsx`

**Checks:**
- Module scores grid: `grid-cols-2 sm:grid-cols-4` (line 204). ✅
- Save button: `w-full sm:w-auto` (line 259). ✅ This is the one step that correctly implements the full-width button pattern.
- Protocol header uses `flex items-center justify-between` (line 152) — no explicit stacking for very small screens, but this is a simple two-item row with small content so it is acceptable.
- Loading/error states are full-width centered — appropriate for mobile. ✅
- Services and Checkpoints sections use `space-y-2` lists — stack cleanly on all widths. ✅

**Result: ✅ PASS**

---

## 4. Cross-Cutting Concerns

### 4.1 Z-index Ordering
- Overlay: `z-40` (layout.tsx:15)
- Sidebar: `z-50` (sidebar.tsx:32)
- Dropdowns: `z-50` (topbar.tsx:121, 164)

Overlay is correctly below the sidebar. ✅

### 4.2 Accessibility — Hamburger Button
- `aria-label="Open sidebar"` present on topbar hamburger (topbar.tsx:97). ✅
- `aria-label="Close sidebar"` present on sidebar close button (sidebar.tsx:41). ✅

### 4.3 Sidebar State in Client Component
- `layout.tsx` has `"use client"` directive at line 1 and imports `useState` from React. ✅
- `sidebarOpen` state is correctly placed in a Client Component — no Server Component constraint violation. ✅

### 4.4 Close-on-Navigate Pattern
- Sidebar nav links use Next.js `<Link>` component with `onClick={onClose}` (sidebar.tsx:50–58). ✅
- This pattern is correct: Next.js Link handles navigation, `onClose` fires before navigation is triggered, closing the drawer. No router conflict. ✅

### 4.5 Mobile Card Data Field Validation (clients page)
All fields accessed in the mobile card (`name`, `email`, `lastVisit`, `protocol`, `id`) are present on every object in `MOCK_CLIENTS`. ✅

### 4.6 Settings Toggle Translate Value
- Old: `w-9` track + `translate-x-4` (36px track, 16px thumb → 36−16−4 = 16px right gap — too large)
- New: `w-11` track (44px) + `translate-x-6` (24px offset)
  - Thumb right edge: 24 + 16 = 40px; track right edge: 44px → 4px gap. Correct visual alignment. ✅

---

## 5. Summary of Findings

| # | File | Line | Status | Description |
|---|------|------|--------|-------------|
| 1 | `layout.tsx` | — | ✅ PASS | sidebarOpen state, overlay z-40, sidebar/topbar props all correct |
| 2 | `sidebar.tsx` | — | ✅ PASS | Fixed drawer, z-50, close button, touch targets, close-on-nav |
| 3 | `topbar.tsx` | — | ✅ PASS | Hamburger lg:hidden + aria-label, responsive padding, overflow guards |
| 4 | `dashboard/page.tsx` | — | ✅ PASS | grid-cols-1 sm:grid-cols-3 stats, grid-cols-1 lg:grid-cols-3 main |
| 5 | `clients/page.tsx` | — | ✅ PASS | Mobile cards (sm:hidden), desktop table (hidden sm:block), correct fields |
| 6 | `settings/page.tsx` | — | ✅ PASS | overflow-x-auto tabs, h-6 w-11 toggles, translate-x-6 correct |
| 7 | `wizard.tsx` | — | ✅ PASS | Responsive padding and header layout |
| 8 | `step-indicator.tsx` | 32 | ✅ PASS | hidden sm:inline labels, min-w circles |
| 9 | `step1-profile.tsx` | 89 | ⚠️ PARTIAL | "Continue →" button missing `w-full sm:w-auto` |
| 10 | `step2-hair.tsx` | 113 | ⚠️ PARTIAL | "Continue →" button missing `w-full sm:w-auto` |
| 11 | `step3-scalp.tsx` | 89 | ⚠️ PARTIAL | "Continue →" button missing `w-full sm:w-auto` |
| 12 | `step4-body.tsx` | 84 | ⚠️ PARTIAL | "Continue →" button missing `w-full sm:w-auto` |
| 13 | `step5-morphology.tsx` | 93 | ⚠️ PARTIAL | "Generate Protocol →" button missing `w-full sm:w-auto` |
| 14 | `step6-protocol.tsx` | 259 | ✅ PASS | Save button correctly uses `w-full sm:w-auto` |

---

## 6. Issues Requiring Fixes

### ISSUE-01 through ISSUE-05 — Step Submit Buttons (Steps 1–5)

**Severity:** Low
**Pattern:** Steps 1–5 navigation rows use `flex justify-between` with a "← Back" button on the left and a "Continue →" / "Generate Protocol →" button on the right. The right-side button does not use `w-full sm:w-auto`.

**Impact:** On mobile, the button renders at its natural inline width rather than stretching to full available width. This reduces the tappable area compared to the spec requirement and creates visual inconsistency with Step 6's save button which correctly uses this class.

**Files and lines:**
- `apps/web/src/components/consultation/steps/step1-profile.tsx:89`
- `apps/web/src/components/consultation/steps/step2-hair.tsx:113`
- `apps/web/src/components/consultation/steps/step3-scalp.tsx:89`
- `apps/web/src/components/consultation/steps/step4-body.tsx:84`
- `apps/web/src/components/consultation/steps/step5-morphology.tsx:93`

**Fix for each:** The navigation row `<div className="flex justify-between">` would need to become `<div className="flex flex-col-reverse sm:flex-row justify-between gap-2">` and the submit button should add `w-full sm:w-auto`. The Back button should also get `w-full sm:w-auto` in this layout, or the row can keep `justify-between` with both buttons getting `flex-1 sm:flex-none` treatment. The minimal fix matching the spec is to add `w-full sm:w-auto` to the submit button class in all five files.

---

## 7. Final Verdict

**NEEDS FIXES**

The layout, sidebar, topbar, dashboard, clients, settings, step-indicator, and step 6 are all correctly implemented. The architectural decisions (z-index ordering, client component for state, aria labels, close-on-navigate, overlay dismiss) are sound.

The blocking gap is that **Steps 1–5 submit buttons are missing `w-full sm:w-auto`**, creating an inconsistency with the spec and with Step 6. These are low-severity, localised one-line fixes in five files. Once those five buttons are updated, the implementation will be ready to deploy.
