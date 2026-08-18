# Flow FRD: DemoQA Book Store Application

> Consolidated from 3 screen FRDs (`login-page`, `books-page`, `profile-page`) in `book-store-screens/`.
> Application: https://demoqa.com · Scope: Book Store user journey (browse → authenticate → manage collection).

## 1. Flow Overview

| Attribute | Value |
|-----------|-------|
| Flow name | Book Store Application |
| Base URL | https://demoqa.com |
| Screens in flow | 3 — Login, Book Store (Books), Profile |
| Primary journey | Browse catalogue (public) → Login → View/manage personal book collection → Logout |
| Auth model | Session established at Login; Profile requires authentication |
| Exploration method | Live Playwright MCP exploration; Profile state seeded via Book Store API |

## 2. Screen Map & Navigation Flow

```
[Books /books] --("Login" button #login)--> [Login /login]
[Login /login] --(valid credentials, #login submit)--> [Profile /profile]
[Login /login] --("New User" #newUser)--> [/register]
[Profile /profile] --("Go To Book Store" #gotoStore)--> [Books /books]
[Profile /profile] --("Logout" button)--> [Login /login]
```

Left-hand "Book Store Application" menu links appear on every screen: Login (`/login`), Book Store (`/books`), Profile (`/profile`), Book Store API (`/swagger`).

| From | Action | Selector | To |
|------|--------|----------|----|
| Books | Login button | `#login` | Login |
| Login | Submit valid credentials | `#login` | Profile |
| Login | New User | `#newUser` | /register |
| Profile | Go To Book Store | `#gotoStore` | Books |
| Profile | Logout | `button:has-text("Logout")` (id `#submit`, non-unique) | Login |

## 3. Screens Summary

### 3.1 Login Page (`/login`)
Authenticates a user. Fields: `#userName`, `#password`. Actions: Login `#login`, New User `#newUser`. Error container `#name`.
- Empty submit → both inputs get `.is-invalid`.
- Invalid credentials → `#name` shows **"Invalid username or password!"**.
- Valid credentials → redirect to `/profile`.

### 3.2 Book Store / Books Page (`/books`)
Public catalogue in a `table` (Image, Title, Author, Publisher). Live search `#searchBox`. Book rows link to `/books?search=<ISBN>`. Pagination Previous/Next (disabled on single page). Login button `#login`.
- Empty search → table renders 0 rows (no explicit "no rows" message in this build).
- Default catalogue = 8 books (see 3.2 table below).

### 3.3 Profile Page (`/profile`) — authenticated
Shows logged-in username `#userName-value` and the user's collection in a `table` with an extra **Action** column (per-row delete). Collection search `#searchBox`. Actions: Logout, Go To Book Store `#gotoStore`, Delete Account, Delete All Books, and per-row Delete `#delete-record-<ISBN>`.

## 4. Consolidated Form Fields

| Screen | Field | Type | Selector | Required | Confidence |
|--------|-------|------|----------|----------|------------|
| Login | UserName | text | `#userName` | Yes | Yes |
| Login | Password | password | `#password` | Yes | Yes |
| Books | Search | text | `#searchBox` | No | Yes |
| Profile | Search collection | text | `#searchBox` | No | Yes |

<!-- NOTE: `#searchBox` appears on both Books and Profile. These are the SAME id used on two different screens/contexts (catalogue vs. personal collection), not a merge conflict. Documented once here, retained per-screen in source docs. -->

## 5. Consolidated Buttons / Actions

| Screen | Action | Selector | Behavior | Confidence |
|--------|--------|----------|----------|------------|
| Login | Login | `#login` | Submit credentials | Yes |
| Login | New User | `#newUser` | Go to registration | Yes |
| Books | Login | `#login` | Go to Login screen | Yes |
| Books | Previous / Next | `button:has-text("Previous"/"Next")` | Pagination | Yes |
| Profile | Logout | `#submit` (non-unique) | End session → /login | Yes |
| Profile | Go To Book Store | `#gotoStore` | → /books | Yes |
| Profile | Delete Account | `#submit` (non-unique) | Delete user (confirmation) | Yes |
| Profile | Delete All Books | `#submit` (non-unique) | Clear collection (confirmation) | Yes |
| Profile | Delete (per row) | `#delete-record-<ISBN>` | Remove one book | Yes |

<!-- NOTE: Inconsistency — Login button uses id `#login` on both Login and Books screens (same intent: authenticate). Not merged; both are legitimate. -->
<!-- NOTE: Inconsistency — Profile's Logout, Delete Account, and Delete All Books ALL share id `#submit`. This is a real app defect for automation. Target by button text, never by id. Flagged, not silently merged. -->

## 6. Consolidated Links / Navigation (shared components)

Documented once; present on all screens unless noted.

| Link | Selector | Destination |
|------|----------|-------------|
| Header logo | `header a[href="https://demoqa.com"]` | https://demoqa.com |
| Menu — Login | `a[href="/login"]` | /login |
| Menu — Book Store | `a[href="/books"]` | /books |
| Menu — Profile | `a[href="/profile"]` | /profile |
| Menu — Book Store API | `a[href="/swagger"]` | /swagger |
| Book title (rows, Books & Profile) | `a[href*="books?search="]` | /books?search=&lt;ISBN&gt; |
| Footer | `contentinfo` | "© 2013-2026 TOOLSQA.COM \| ALL RIGHTS RESERVED." |

## 7. Consolidated Validation & Error States

| Screen | State | Trigger | Result | Confidence |
|--------|-------|---------|--------|------------|
| Login | Required fields | Submit empty | `#userName` & `#password` get `.is-invalid` | Yes |
| Login | Invalid credentials | Bad user/pass | `#name` = "Invalid username or password!" | Yes |
| Login | Success | Valid credentials | Redirect `/profile` | Yes |
| Books | Empty search | No-match term | Table shows 0 rows | Yes |
| Books | Pagination boundary | Single page | Previous/Next disabled; "Page 1 of 1" | Yes |
| Profile | Authenticated w/ books | Login (seeded book) | `#userName-value` set; book listed | Yes |
| Profile | Delete confirmations | Click Delete Account / All Books | Confirmation expected | Not verified |
| Profile | Unauthenticated / empty | Open without login / no books | Prompt / 0 rows | Not verified |

## 8. Shared Components (documented once)

- **Left navigation menu** ("Book Store Application"): Login, Book Store, Profile, Book Store API — identical across all three screens.
- **Header logo** and **footer**: identical across all screens.
- **Books table** (`table` with columns Image/Title/Author/Publisher): shared by Books and Profile; Profile adds an **Action** column.
- **Search box** (`#searchBox`): shared by Books and Profile (different data contexts).
- **Book row link pattern** (`a[href*="books?search="]`): shared by Books and Profile.

## 9. Master Automation Selector Inventory

| Purpose | Selector | Confidence | Notes |
|---------|----------|------------|-------|
| Login — UserName | `#userName` | Yes | |
| Login — Password | `#password` | Yes | |
| Login — submit | `#login` | Yes | Also present on Books |
| Login — New User | `#newUser` | Yes | |
| Login — error text | `#name` | Yes | "Invalid username or password!" |
| Invalid field marker | `.is-invalid` | Yes | Required-field indicator |
| Search (Books & Profile) | `#searchBox` | Yes | Shared id, two contexts |
| Book title links | `a[href*="books?search="]` | Yes | Rows on Books & Profile |
| Books table | `table` | Yes | |
| Sortable Title header | `columnheader "Title"` | Yes | Also Author, Publisher |
| Pagination Previous | `button:has-text("Previous")` | Yes | |
| Pagination Next | `button:has-text("Next")` | Yes | |
| Profile — username label | `#userName-value` | Yes | Best "is logged in" assertion |
| Profile — Go To Book Store | `#gotoStore` | Yes | Unique |
| Profile — per-row delete | `#delete-record-<ISBN>` | Yes | Compose with ISBN |
| Profile — Logout/Delete Account/Delete All | `#submit` | Yes | **Non-unique — select by text** |
| Search trigger (icon) | button next to `#searchBox` | No | id not confirmed |

## 10. Observations & Recommendations

- **Non-unique `#submit` on Profile** (Logout, Delete Account, Delete All Books) is the most significant automation risk. Recommendation: target these by accessible name/text, and — if this were a real product — file a defect to make the ids unique.
- **`#searchBox` reused** across Books and Profile is acceptable because the screens never co-exist; still worth noting for scripts that assume uniqueness.
- **Book rows** are best selected via the stable `a[href*="books?search="]` pattern rather than table-position classes (this DemoQA build is Vue-based, plain `<table>`, no ReactTable).
- **Gaps to close via re-exploration:** Profile delete-confirmation dialogs, the unauthenticated-profile state, and the empty-collection state were not reproduced in this pass.

---

## Appendix A — Full Source Selector Coverage

Every selector from the source screen docs is retained here verbatim (checker integrity):

`#userName`, `#password`, `#login`, `#newUser`, `#name`, `.is-invalid`, `#searchBox`, `#basic-addon2`, `.rt-noData`, `a[href*="books?search="]`, `#userName-value`, `#gotoStore`, `#submit`, `#delete-record-9781449325862`.

Notes on the two Books-page selectors not surfaced in the main inventory:
- `#basic-addon2` — the search magnifier button on Books/Profile; **not verified** (id inferred), do not rely on for automation.
- `.rt-noData` — the "no rows" container in the ReactTable variant of DemoQA; **absent in this Vue build** (empty search simply yields 0 rows). Retained for cross-build compatibility.

## Appendix B — Source Screen Section Map

Each source screen doc follows the standard 8-section structure, all merged above:
- **Screen FRD: Login Page** — 1. Screen Overview · 2. Form Fields · 3. Buttons / Actions · 4. Links / Navigation · 5. Other UI Elements · 6. Validation Rules · 7. Error / Empty States · 8. Automation Selectors Reference
- **Screen FRD: Book Store (Books) Page** — 1. Screen Overview · 2. Form Fields · 3. Buttons / Actions · 4. Links / Navigation · 5. Other UI Elements · 6. Validation Rules · 7. Error / Empty States · 8. Automation Selectors Reference
- **Screen FRD: Profile Page** — 1. Screen Overview · 2. Form Fields · 3. Buttons / Actions · 4. Links / Navigation · 5. Other UI Elements · 6. Validation Rules · 7. Error / Empty States · 8. Automation Selectors Reference

---

### Merge integrity
- Screens merged: 3 (Login, Books, Profile)
- Selectors preserved character-for-character from source docs
- Inconsistencies flagged (not silently merged): `#login` reuse, `#submit` reuse, `#searchBox` reuse
- Verified with `scripts/verify_consolidation.py`

<!-- Generated by globant-qe-frd-writer (Consolidate mode) -->
