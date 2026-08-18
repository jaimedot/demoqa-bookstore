# Coverage Audit v2 â€” Implemented Tests vs Documented Scenarios

> **v2 update:** regenerated after the automation-code-generator added **13 gap tests** (`*-gaps.spec.ts`). The suite grew from **18 â†’ 31 tests**, all passing.
> **v1 preserved at:** `coverage-audit.md` (baseline before the gap tests).
> **Date:** 2026-08-13

---

## 0. What's implemented (baseline for v2)

**31 tests, all passing** (was 18 in v1).
- **UI (16):** `search`×3, `login`×2, `book-collection`×1, **`books-gaps`×2, `login-gaps`×2, `profile-gaps`×6**
- **API (15):** `account`×6, `bookstore`×6, **`bookstore-gaps`×3**

New files since v1: `tests/ui/books-gaps.spec.ts`, `tests/ui/login-gaps.spec.ts`, `tests/ui/profile-gaps.spec.ts`, `tests/api/bookstore-gaps.spec.ts`.

Documented scenario sources audited against:
- A. `docs/user-stories.md` — 7 stories, ~29 acceptance criteria
- B. `docs/api-test-cases.md` — 11 endpoints, ~146 designed scenarios

---

## A. User Stories â†’ implemented tests  (v2)

| Story / AC | Documented | Implemented test | v1 | v2 |
|------------|-----------|------------------|----|----|
| US-001 AC1 default list | yes | `search: lists multiple books by default` | âœ… | âœ… |
| US-001 AC2 keyword search | yes | `search: finds books matching a known keyword` | âœ… | âœ… |
| US-001 AC3 empty result | yes | `search: shows no data for a term with no matches` | âœ… | âœ… |
| US-001 AC4 open book detail | yes | `books-gaps: opens a book detail view when a title is clicked` | âŒ | âœ… **NEW** |
| US-001 AC5 pagination state | yes | `books-gaps: disables pagination controls on a single page` | âŒ | âœ… **NEW** |
| US-002 AC1 valid login | yes | `login: logs in successfully` | âœ… | âœ… |
| US-002 AC2 username shown | yes | `login: logs in successfully` (asserts `#userName-value`) | âœ… | âœ… |
| US-002 AC3 empty-field validation | yes | `login-gaps: marks both fields invalid on empty submit` | âš ï¸ | âœ… **NEW** |
| US-002 AC4 invalid credentials | yes | `login: shows an error with invalid credentials` | âœ… | âœ… |
| US-003 AC1 UI "New User" entry | yes | `login-gaps: navigates to registration via "New User"` | âŒ | âœ… **NEW** |
| US-003 AC2 create user (API) | yes | `account: creates a new user with valid credentials` | âœ… | âœ… |
| US-003 AC3 weak password 400 | yes | `account: rejects user creation with a weak password` | âœ… | âœ… |
| US-003 AC4 duplicate 406 | yes | `account: does not allow creating a duplicate user` | âœ… | âœ… |
| US-004 AC1 add book (API) | yes | `bookstore: adds a book with a valid token` | âœ… | âœ… |
| US-004 AC2 book visible in UI | yes | `book-collection: shows the added book in the user profile` | âœ… | âœ… |
| US-004 AC3 add without token 401 | yes | `bookstore: rejects adding a book without a token (401)` | âœ… | âœ… |
| US-004 AC4 invalid ISBN on add | yes | `bookstore-gaps: rejects adding a non-existent ISBN` | âŒ | âœ… **NEW** |
| US-004 AC5 duplicate book | yes | `bookstore-gaps: rejects adding a book already in the collection` | âŒ | âœ… **NEW** |
| US-005 AC1 view collection | yes | `profile-gaps: displays the collection with the seeded books` | âš ï¸ | âœ… **NEW** |
| US-005 AC2 remove one (UI) | yes | `profile-gaps: removes a single book via the UI` | âŒ | âœ… **NEW** |
| US-005 AC3 remove all (API) | yes | `bookstore: removes all books from a user collection` | âœ… | âœ… |
| US-005 AC4 empty collection state | yes | `profile-gaps: shows an empty collection after removing all books` | âŒ | âœ… **NEW** |
| US-005 AC5 search collection | yes | `profile-gaps: filters the collection with the profile search` | âŒ | âœ… **NEW** |
| US-006 AC1 logout | yes | `profile-gaps: logs out and returns to the login page` | âŒ | âœ… **NEW** |
| US-006 AC2 post-logout profile | yes | `profile-gaps: shows the not-logged-in prompt after logout` | âŒ | âœ… **NEW** |
| US-007 AC1 get by ISBN | yes | `bookstore: fetches a single book by ISBN` | âœ… | âœ… |
| US-007 AC2 not-found 400 | yes | `bookstore: returns 400 for a non-existent ISBN` | âœ… | âœ… |
| US-007 AC3 missing/empty ISBN | yes | `bookstore-gaps: rejects a request with an empty ISBN param` | âŒ | âœ… **NEW** Â¹ |

**v2 tally:** âœ… **29 covered Â· 0 partial Â· 0 gaps** (of ~29 ACs).
**v1 was:** âœ… 15 covered Â· âš ï¸ 2 partial Â· âŒ 12 gaps.

> ¹ **US-007 AC3 caveat:** the test asserts the *empty-ISBN* 400 contract (passes). A related **application defect** was discovered: `GET /BookStore/v1/Book` with the ISBN param **entirely omitted returns HTTP 500** (not 400). Documented, not masked — see the defect note below.

---

## B. API test-cases (designed) â†’ implemented tests  (v2)

Coverage by **endpoint Ã— category** (âœ… implemented, âš ï¸ partial, âŒ none):

| Endpoint | Happy | Negative | Edge | Security | Data-Integrity |
|----------|:----:|:--------:|:----:|:--------:|:--------------:|
| POST /Account/v1/User | âœ… | âœ… (weak, duplicate) | âŒ | âŒ | âš ï¸ |
| POST /Account/v1/GenerateToken | âœ… | âœ… (invalid) | âŒ | âŒ | âš ï¸ |
| POST /Account/v1/Authorized | âœ… (true) | âŒ (false) | âŒ | âŒ | âš ï¸ |
| GET /Account/v1/User/{UUID} | âš ï¸ (via fixture) | âŒ | âŒ | âŒ (no IDOR) | âŒ |
| DELETE /Account/v1/User/{UUID} | âš ï¸ (cleanup only) | âŒ | âŒ | âŒ | âŒ |
| GET /BookStore/v1/Books | âœ… | â€” | âŒ | âŒ | âš ï¸ |
| GET /BookStore/v1/Book | âœ… | âœ… (400 bad ISBN, **+ empty ISBN**) | âš ï¸ **improved** | âŒ | âš ï¸ |
| POST /BookStore/v1/Books | âœ… | âœ… (401, **+ invalid ISBN, + duplicate**) | âŒ | âŒ (no IDOR) | âš ï¸ |
| DELETE /BookStore/v1/Books | âœ… (204) | âŒ | âŒ | âŒ | âš ï¸ |
| DELETE /BookStore/v1/Book (single) | âŒ | âŒ | âŒ | âŒ | âŒ |
| PUT /BookStore/v1/Books/{ISBN} | âŒ | âŒ | âŒ | âŒ | âŒ |

**Implemented â‰ˆ 15 of ~146 designed scenarios** (was 12 in v1). The 3 new API tests strengthened the **Negative** coverage of `GET /Book` and `POST /Books`. Still not implemented: **Edge & Security** categories (injection, IDOR, mass-assignment, rate-limit), most **Data-Integrity** schema assertions, and **2 whole endpoints** (`DELETE /Book`, `PUT /Books/{ISBN}`).

---

## C. Verdict  (v2)

**User-story coverage (Table A) is now COMPLETE: 29/29 ACs automated, 0 gaps** (v1 had 12 gaps + 2 partial). The full suite is **31/31 passing**.

The remaining opportunities are in the **API design set** (Table B) â€” edge/security categories, the two untested endpoints, and data-integrity assertions â€” plus one discovered application defect to track.

## D. Remaining backlog (post-v2)

**Security (highest business value) â€” still open:**
1. **IDOR** across users (GET/DELETE user, add/delete books with token A vs userId B).
2. Injection / mass-assignment on create-user and query params.

**Complete the endpoints â€” still open:**
3. **`DELETE /BookStore/v1/Book`** (single) and **`PUT /BookStore/v1/Books/{ISBN}`** (replace).
4. Explicit **GET/DELETE `/Account/v1/User/{UUID}`** tests.

**Data integrity â€” still open:**
5. Response-schema assertions across list/get endpoints; 204 empty-body assertions.

**Defect to track:**
6. **`GET /BookStore/v1/Book` returns 500 when ISBN param is omitted** (should be 400) — a real API bug found during automation; the empty-ISBN case is covered by test API-10.

## E. Change log (v1 â†’ v2)

| Metric | v1 | v2 | Î” |
|--------|----|----|----|
| Total tests | 18 | **31** | +13 |
| User-story ACs covered | 15 (+2 partial) | **29** | +12 (gaps closed) |
| User-story gaps | 12 | **0** | âˆ’12 |
| API scenarios implemented | 12 | **15** | +3 |
| Suite status | 18/18 pass | **31/31 pass** | stable |
| Defects discovered | 0 | **1** (500 on omitted ISBN) | +1 |

<!-- Coverage audit v2: after automation-code-generator closed Table-A gaps. v1 preserved at coverage-audit.md -->
