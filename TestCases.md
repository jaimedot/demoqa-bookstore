# Test Case Design

Each scenario below was chosen deliberately to balance **positive flows**, **negative/error handling**, and **edge/boundary cases**, rather than maximizing test count. The suite has **31 tests (16 UI + 15 API)**, all passing. Full implementation lives in `tests/ui/` and `tests/api/`.

The **Test (spec → title)** column links every case ID to the exact automated test that implements it, and **Story/AC** traces it back to the documented acceptance criteria.

## UI Test Cases (16)

| ID | Scenario | Type | Story/AC | Test (spec → title) | Why it matters |
|----|----------|------|----------|---------------------|-----------------|
| UI-01 | Default catalogue listing on page load | Positive | US-001 AC1 | `search.spec.ts` → *lists multiple books by default* | Confirms the core browsing flow works before testing anything else |
| UI-02 | Search with a valid keyword returns matching results | Positive | US-001 AC2 | `search.spec.ts` → *finds books matching a known keyword* | Validates the primary discovery feature users rely on |
| UI-03 | Search with a keyword that matches nothing | Negative | US-001 AC3 | `search.spec.ts` → *shows no data for a term with no matches* | Confirms the app degrades gracefully instead of erroring or showing stale data |
| UI-04 | Open a book's detail view from its title | Positive | US-001 AC4 | `books-gaps.spec.ts` → *opens a book detail view when a title is clicked* | Verifies navigation between catalogue and detail pages, a core user journey |
| UI-05 | Pagination controls are disabled with a single page of results | Edge | US-001 AC5 | `books-gaps.spec.ts` → *disables pagination controls on a single page* | Prevents a common UI bug where controls remain clickable with nothing to paginate to |
| UI-06 | Valid login with a self-provisioned user | Positive | US-002 AC1/AC2 | `login.spec.ts` → *logs in successfully with valid credentials* | Confirms authentication, a prerequisite for most other flows |
| UI-07 | Login with invalid credentials shows an error | Negative | US-002 AC4 | `login.spec.ts` → *shows an error with invalid credentials* | Validates security-relevant error handling is visible to the user |
| UI-08 | Login attempt with empty fields | Boundary | US-002 AC3 | `login-gaps.spec.ts` → *marks both fields invalid on empty submit* | Catches client-side validation gaps that are easy to regress silently |
| UI-09 | "New User" link navigates to registration | Positive | US-003 AC1 | `login-gaps.spec.ts` → *navigates to registration via "New User"* | Confirms a secondary but necessary entry point into the app |
| UI-10 | Book added via API appears in the user's collection | Positive (hybrid) | US-004 AC2 | `book-collection.spec.ts` → *shows the added book in the user profile* | Confirms UI and API stay in sync — a common source of real-world bugs |
| UI-11 | Viewing an existing book collection | Positive | US-005 AC1 | `profile-gaps.spec.ts` → *displays the collection with the seeded books* | Core profile functionality |
| UI-12 | Removing a single book (confirm dialog + alert) | Positive | US-005 AC2 | `profile-gaps.spec.ts` → *removes a single book via the UI* | Verifies a destructive action's full flow, including confirmation UX |
| UI-13 | Empty-collection state after removing all books | Edge | US-005 AC4 | `profile-gaps.spec.ts` → *shows an empty collection after removing all books* | Confirms the app has a defined, tested empty state instead of an unhandled blank screen |
| UI-14 | Searching within an existing collection | Positive | US-005 AC5 | `profile-gaps.spec.ts` → *filters the collection with the profile search* | Validates a secondary search scope distinct from the main catalogue search |
| UI-15 | Logout clears the session | Positive | US-006 AC1 | `profile-gaps.spec.ts` → *logs out and returns to the login page* | Security-relevant: confirms session teardown works as expected |
| UI-16 | Post-logout, the app correctly prompts "not logged in" | Negative | US-006 AC2 | `profile-gaps.spec.ts` → *shows the not-logged-in prompt after logout* | Confirms protected views don't leak state after logout |

## API Test Cases (15)

| ID | Scenario | Type | Story/AC | Test (spec → title) | Why it matters |
|----|----------|------|----------|---------------------|-----------------|
| API-01 | Create a new user | Positive | US-003 AC2 | `account.spec.ts` → *creates a new user with valid credentials* | Core account-creation flow, prerequisite for all authenticated tests |
| API-02 | Reject account creation with a weak password | Negative | US-003 AC3 | `account.spec.ts` → *rejects user creation with a weak password* | Validates a security-critical business rule |
| API-03 | Reject duplicate user creation | Negative | US-003 AC4 | `account.spec.ts` → *does not allow creating a duplicate user* | Confirms data-integrity constraints are enforced server-side |
| API-04 | Generate a token with valid credentials | Positive | US-002 AC1 | `account.spec.ts` → *generates a token for valid credentials* | Confirms the authentication contract the rest of the suite depends on |
| API-05 | Generate a token with invalid credentials | Negative | US-002 AC4 | `account.spec.ts` → *fails token generation for invalid credentials* | Confirms failure is signaled correctly rather than silently succeeding |
| API-06 | Authorization check on a protected endpoint | Positive | US-002 | `account.spec.ts` → *confirms an authorized user via /Authorized* | Confirms access control is actually enforced, not just cosmetic |
| API-07 | List all books | Positive | US-001 AC1 | `bookstore.spec.ts` → *returns the list of available books* | Confirms the catalogue endpoint is the source of truth for UI tests |
| API-08 | Get a book by valid ISBN | Positive | US-007 AC1 | `bookstore.spec.ts` → *fetches a single book by ISBN* | Core lookup functionality |
| API-09 | Get a book by non-existent ISBN | Negative | US-007 AC2 | `bookstore.spec.ts` → *returns 400 for a non-existent ISBN* | Confirms the API fails predictably instead of returning malformed data |
| API-10 | Reject request with an empty ISBN | Boundary | US-007 AC3 | `bookstore-gaps.spec.ts` → *rejects a request with an empty ISBN param* | Catches missing-input handling that's easy to overlook ¹ |
| API-11 | Add a book to an authenticated user's collection | Positive | US-004 AC1 | `bookstore.spec.ts` → *adds a book to a user collection with a valid token* | Core write operation the UI hybrid test depends on |
| API-12 | Reject adding a book without a token (401) | Negative | US-004 AC3 | `bookstore.spec.ts` → *rejects adding a book without a token (401)* | Confirms the endpoint is protected against unauthenticated writes |
| API-13 | Reject adding a non-existent ISBN | Negative | US-004 AC4 | `bookstore-gaps.spec.ts` → *rejects adding a non-existent ISBN* | Confirms invalid references are rejected instead of corrupting the collection |
| API-14 | Reject adding a book already in the collection | Negative | US-004 AC5 | `bookstore-gaps.spec.ts` → *rejects adding a book already in the collection* | Enforces the no-duplicate business rule at the API layer |
| API-15 | Remove all books from a user collection | Positive | US-005 AC3 | `bookstore.spec.ts` → *removes all books from a user collection* | Confirms the bulk-delete flow used to reset collection state (204) |

---

¹ **Discovered defect (API-10):** the test asserts the well-defined **empty-ISBN** contract (HTTP 400 + message). A related bug was found: `GET /BookStore/v1/Book` with the ISBN parameter **entirely omitted** returns **HTTP 500** (unhandled missing param) instead of 400. This is documented rather than masked — full traceability in `output/coverage/coverage-audit-v2.md`.

## Coverage summary

- **User-story coverage:** all 7 stories / 29 acceptance criteria are automated (0 gaps). See `output/coverage/coverage-audit-v2.md` for the full requirement-to-test matrix.
- **Design balance:** 17 positive · 10 negative · 2 edge · 2 boundary — deliberately weighted toward core flows while still exercising error handling and boundaries.
- **Isolation:** every test self-provisions its own user/data via the API and cleans up afterwards, so cases are order-independent and safe to run in parallel against the shared public demo site.
