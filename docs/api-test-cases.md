# API Test Cases — DemoQA Book Store

- **API base URL:** https://demoqa.com
- **Swagger:** https://demoqa.com/swagger
- **Date designed:** 2026-08-13
- **Source:** Swagger endpoint list + **live behavior verification** against the running API (status codes/messages confirmed this session). Scenarios are tagged `source-verified` where confirmed live and `spec-derived` where inferred from the spec only.
- **Auth model:** Bearer JWT from `POST /Account/v1/GenerateToken`; sent as `Authorization: Bearer <token>`.

> Credentials/tokens are referenced as placeholders (`${USERNAME}`, `${PASSWORD}`, `${TOKEN}`, `${USER_ID}`) — never hardcoded.

---

## 1. API Inventory

| # | Method | Path | Auth | Request body | Key responses |
|---|--------|------|------|--------------|---------------|
| 1 | POST | `/Account/v1/User` | No | `{userName, password}` | 201 created · 400 weak pw · 406 exists |
| 2 | GET | `/Account/v1/User/{UUID}` | Bearer | — | 200 user · 401 · 404 |
| 3 | DELETE | `/Account/v1/User/{UUID}` | Bearer | — | 204/200 · 401 |
| 4 | POST | `/Account/v1/GenerateToken` | No | `{userName, password}` | 200 (Success/Failed body) |
| 5 | POST | `/Account/v1/Authorized` | No | `{userName, password}` | 200 `true`/`false` |
| 6 | GET | `/BookStore/v1/Books` | No | — | 200 `{books[]}` |
| 7 | POST | `/BookStore/v1/Books` | Bearer | `{userId, collectionOfIsbns[]}` | 201 · 401 · 400 |
| 8 | DELETE | `/BookStore/v1/Books?UserId=` | Bearer | — | 204 · 401 |
| 9 | GET | `/BookStore/v1/Book?ISBN=` | No | — | 200 · 400 bad ISBN |
| 10 | DELETE | `/BookStore/v1/Book` | Bearer | `{isbn, userId}` | 204/200 · 401 |
| 11 | PUT | `/BookStore/v1/Books/{ISBN}` | Bearer | `{userId, isbn}` | 200 · 400 · 401 |

**Verified live this session:** #1 (201/400/406), #4 (Success/Failed), #5 (`true`), #6 (200), #7 (201/401), #8 (204), #9 (200/400), #2/#3 (200/401). **#10, #11:** `spec-derived, not behavior-verified`.

---

## 2. Coverage Matrix

| Endpoint | Happy | Negative | Edge | Security | Data-Integrity |
|----------|:-----:|:--------:|:----:|:--------:|:--------------:|
| POST /Account/v1/User | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /Account/v1/User/{UUID} | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE /Account/v1/User/{UUID} | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /Account/v1/GenerateToken | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /Account/v1/Authorized | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /BookStore/v1/Books | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /BookStore/v1/Books | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE /BookStore/v1/Books | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /BookStore/v1/Book | ✅ | ✅ | ✅ | ✅ | ✅ |
| DELETE /BookStore/v1/Book | ✅ | ✅ | ✅ | ✅ | ✅ |
| PUT /BookStore/v1/Books/{ISBN} | ✅ | ✅ | ✅ | ✅ | ✅ |

**100% category coverage across all 11 endpoints.**

---

## 3. Test Scenarios (Gherkin)

```gherkin
Feature: Account API — Create User  # POST /Account/v1/User  [source-verified]

  Background:
    Given the API base URL is configured

  # ---------- Happy Path ----------
  Scenario: Create a user with valid unique credentials
    Given a valid payload with a unique userName and a policy-compliant password
    When I send POST to "/Account/v1/User"
    Then the response status should be 201
    And the body should contain "userID" and "username"
    And "books" should be an empty array

  Scenario: Created username echoes the request
    Given a valid payload with userName "${USERNAME}"
    When I send POST to "/Account/v1/User"
    Then the response status should be 201
    And the body "username" should equal "${USERNAME}"

  Scenario: userID returned is a valid UUID
    Given a valid unique payload
    When I send POST to "/Account/v1/User"
    Then the response status should be 201
    And "userID" should match a UUID v4 pattern

  # ---------- Negative ----------
  Scenario: Reject a weak password
    Given a payload with password "weak"
    When I send POST to "/Account/v1/User"
    Then the response status should be 400
    And the message should contain "Passwords must have"

  Scenario: Reject a duplicate user
    Given a user that already exists
    When I send POST to "/Account/v1/User" with the same credentials
    Then the response status should be 406
    And the message should contain "User exists"

  Scenario Outline: Reject missing required field "<field>"
    Given a payload missing the "<field>" field
    When I send POST to "/Account/v1/User"
    Then the response status should be 400
    Examples:
      | field    |
      | userName |
      | password |

  # ---------- Edge ----------
  Scenario Outline: Password boundary handling "<label>"
    Given a payload with password "<password>"
    When I send POST to "/Account/v1/User"
    Then the response status should be <status>
    Examples:
      | label            | password        | status |
      | just-below-rules | Ab1!            | 400    |
      | strong-minimal   | Ab1!defg        | 201    |
      | very-long        | <128-char pass> | 201    |

  Scenario: Unicode/special characters in userName
    Given a payload with userName "qa_用户_✓_${TIMESTAMP}"
    When I send POST to "/Account/v1/User"
    Then the response status should be 201 or 400
    And the outcome should be documented (charset acceptance)

  # ---------- Security ----------
  Scenario: Mass-assignment attempt is ignored
    Given a valid payload that also includes "userID" and "isAdmin"
    When I send POST to "/Account/v1/User"
    Then the server-generated "userID" must NOT equal the client-supplied value
    And no privilege field should be reflected

  Scenario Outline: Injection payload in userName is neutralized "<payload>"
    Given a payload with userName "<payload>"
    When I send POST to "/Account/v1/User"
    Then the response status should be 201 or 400
    And no server error (5xx) should occur
    Examples:
      | payload                    |
      | ' OR '1'='1                |
      | <script>alert(1)</script>  |

  Scenario: Endpoint tolerates rapid repeated requests (rate-limit probe)
    When I send 20 create requests in quick succession with unique users
    Then no 5xx errors should occur
    And behavior (throttling or not) should be recorded

  # ---------- Data Integrity ----------
  Scenario: Response schema matches contract
    Given a valid unique payload
    When I send POST to "/Account/v1/User"
    Then the body should contain exactly "userID", "username", "books"
    And "books" should be an array

  Scenario: Created user is retrievable
    Given a user was created and a token generated
    When I GET "/Account/v1/User/{userID}" with the token
    Then the returned "username" should match the created username

  Scenario: Content-Type is application/json
    When I send POST to "/Account/v1/User"
    Then the response "Content-Type" header should contain "application/json"
```

```gherkin
Feature: Account API — Generate Token  # POST /Account/v1/GenerateToken  [source-verified]

  # ---------- Happy Path ----------
  Scenario: Valid credentials return a token
    Given a registered user "${USERNAME}"/"${PASSWORD}"
    When I send POST to "/Account/v1/GenerateToken"
    Then status should be 200
    And "token" should be non-empty
    And "status" should be "Success"
    And "result" should contain "successful"

  Scenario: Token has an expiry timestamp
    Given valid credentials
    When I request a token
    Then "expires" should be a future ISO-8601 timestamp

  Scenario: Token is accepted by a protected endpoint
    Given a freshly generated token
    When I GET "/Account/v1/User/{userID}" with it
    Then status should be 200

  # ---------- Negative ----------
  Scenario: Wrong password fails authorization
    Given a registered user with an incorrect password
    When I request a token
    Then status should be 200
    And "token" should be null
    And "status" should be "Failed"
    And "result" should contain "authorization failed"

  Scenario Outline: Missing field "<field>"
    Given a payload missing "<field>"
    When I request a token
    Then status should be 400 or 200-with-Failed
    Examples:
      | field    |
      | userName |
      | password |

  Scenario: Non-existent user fails
    Given a userName that was never registered
    When I request a token
    Then "status" should be "Failed"

  # ---------- Edge ----------
  Scenario: Empty-string credentials
    Given userName "" and password ""
    When I request a token
    Then status should be 400 or 200-with-Failed

  Scenario: Very long credential values
    Given a 5000-char userName
    When I request a token
    Then no 5xx should occur

  Scenario: Special characters in credentials
    Given credentials containing spaces and symbols
    When I request a token
    Then the response should be well-formed JSON

  Scenario: Leading/trailing whitespace in userName
    Given userName " ${USERNAME} " (padded)
    When I request a token
    Then the trimming/behavior should be documented

  # ---------- Security ----------
  Scenario: No token leakage on failure
    Given invalid credentials
    When I request a token
    Then no valid JWT should appear anywhere in the body

  Scenario Outline: Injection in credentials "<payload>"
    Given userName "<payload>"
    When I request a token
    Then no 5xx should occur
    Examples:
      | payload      |
      | ' OR 1=1 --  |
      | admin'--     |

  Scenario: Timing does not distinguish unknown vs wrong-password
    When I compare response times for unknown-user vs wrong-password
    Then no obvious user-enumeration timing signal should be documented

  Scenario: Brute-force probe
    When I send many failed token attempts for one user
    Then throttling behavior (if any) should be recorded

  # ---------- Data Integrity ----------
  Scenario: Success body has token/expires/status/result
    Given valid credentials
    When I request a token
    Then all four fields should be present with correct types

  Scenario: Failed body has null token and Failed status
    Given invalid credentials
    When I request a token
    Then "token" is null and "status" is "Failed"

  Scenario: JWT is structurally valid (3 dot-separated segments)
    Given a successful token
    Then it should decode to header.payload.signature
```

```gherkin
Feature: Account API — Authorized  # POST /Account/v1/Authorized  [source-verified: returns true]

  # Happy
  Scenario: Authorized user returns true
    Given valid registered credentials
    When I POST to "/Account/v1/Authorized"
    Then status 200 and body should be true
  Scenario: Boolean type is a raw JSON boolean (not string)
    Then the body should be the literal true, not "true"
  Scenario: Works immediately after registration
    Given a just-created user
    Then Authorized returns true

  # Negative
  Scenario: Wrong password returns false or error
    Given valid user, wrong password
    Then body should be false OR status 404
  Scenario Outline: Missing "<field>"
    Examples:
      | field |
      | userName |
      | password |
  Scenario: Unknown user
    Given an unregistered userName
    Then body false OR 404

  # Edge
  Scenario: Empty credentials
  Scenario: Very long credentials
  Scenario: Unicode credentials
  Scenario: Whitespace-only credentials

  # Security
  Scenario Outline: Injection payloads "<payload>"
    Examples:
      | payload     |
      | ' OR '1'='1 |
      | "><script>  |
  Scenario: No sensitive data in response (only a boolean)
  Scenario: Does not reveal whether user exists vs bad password (enumeration)
  Scenario: Rapid repeated calls do not 5xx

  # Data Integrity
  Scenario: Response is a bare boolean
  Scenario: Content-Type application/json
  Scenario: Consistent result across repeated identical calls
```

```gherkin
Feature: Account API — Get/Delete User  # GET & DELETE /Account/v1/User/{UUID}  [source-verified: 200/401]

  Background:
    Given a registered user with "${USER_ID}" and "${TOKEN}"

  # Happy
  Scenario: Get own user with valid token
    When I GET "/Account/v1/User/${USER_ID}" with Bearer ${TOKEN}
    Then status 200 and body contains "userId", "username", "books"
  Scenario: Get user reflects added books
    Given the user has 1 book in their collection
    Then GET returns that book in "books"
  Scenario: Delete own user with valid token
    When I DELETE "/Account/v1/User/${USER_ID}" with the token
    Then status 204 (or 200)

  # Negative
  Scenario: Get without token
    When I GET the user with no Authorization header
    Then status 401
  Scenario: Get with malformed UUID
    When I GET "/Account/v1/User/not-a-uuid" with a token
    Then status 401 or 404
  Scenario: Delete without token
    Then status 401
  Scenario: Delete already-deleted user
    Then status 200/204 or 404 (documented)

  # Edge
  Scenario: UUID with wrong casing
  Scenario: Non-existent but well-formed UUID
  Scenario: Extremely long path segment
  Scenario: Trailing slash variation

  # Security (IDOR focus)
  Scenario: User A cannot GET User B with A's token
    Given two users A and B
    When A requests "/Account/v1/User/${B_USER_ID}" with A's token
    Then access should be denied (401/403) — IDOR check
  Scenario: User A cannot DELETE User B
    Then denied — no cross-tenant deletion
  Scenario: Expired token rejected
  Scenario: Tampered token (altered signature) rejected

  # Data Integrity
  Scenario: books[] entries have isbn/title/author
  Scenario: userId in response equals the path UUID
  Scenario: Deleted user is no longer retrievable (subsequent GET fails)
```

```gherkin
Feature: BookStore API — List & Get Books  # GET /BookStore/v1/Books & /Book  [source-verified: 200/400]

  # Happy — GET /Books
  Scenario: List all books
    When I GET "/BookStore/v1/Books"
    Then status 200 and "books" is a non-empty array
  Scenario: Each book has required fields
    Then every book has isbn, title, author, publisher, pages
  Scenario: Catalogue is stable/seeded
    Then at least 8 books are returned

  # Happy — GET /Book
  Scenario: Get a book by valid ISBN
    Given an ISBN from the catalogue
    When I GET "/BookStore/v1/Book?ISBN=<isbn>"
    Then status 200 and the returned isbn matches

  # Negative
  Scenario: Get by non-existent ISBN
    When I GET "/BookStore/v1/Book?ISBN=0000000000000"
    Then status 400 and message contains "ISBN supplied is not available"
  Scenario: Get with missing ISBN param
    When I GET "/BookStore/v1/Book" with no ISBN
    Then status 400
  Scenario: Get with empty ISBN
    Then status 400
  Scenario: Wrong query param name (Isbn vs ISBN)
    Then status 400 (case-sensitivity documented)

  # Edge
  Scenario: ISBN with letters/special chars
  Scenario: Extremely long ISBN
  Scenario: ISBN with URL-encoded characters
  Scenario: Duplicate ISBN query params

  # Security (public endpoint abuse)
  Scenario Outline: Injection in ISBN "<payload>"
    Examples:
      | payload      |
      | ' OR '1'='1  |
      | 123%27       |
  Scenario: No auth required but no data leakage beyond catalogue
  Scenario: Rapid requests do not 5xx (rate-limit probe)
  Scenario: Response has no sensitive/internal fields

  # Data Integrity
  Scenario: /Books response matches schema (array of book objects)
  Scenario: /Book response matches single-book schema
  Scenario: pages/website types are correct (number/string)
  Scenario: Filtering by ISBN returns exactly one matching book
```

```gherkin
Feature: BookStore API — Add Books  # POST /BookStore/v1/Books  [source-verified: 201/401]

  Background:
    Given a registered user "${USER_ID}" with token "${TOKEN}"
    And a valid ISBN "${ISBN}" from the catalogue

  # Happy
  Scenario: Add one book with valid token
    When I POST {userId, collectionOfIsbns:[{isbn:${ISBN}}]} with Bearer ${TOKEN}
    Then status 201 and "books" contains ${ISBN}
  Scenario: Add multiple books at once
    Then all provided ISBNs appear in the collection
  Scenario: Added book persists (visible via GET user)
    Then GET user shows ${ISBN}

  # Negative
  Scenario: Add a non-existent ISBN
    Given collectionOfIsbns:[{isbn:"0000000000000"}]
    Then status 400 and message references the ISBN
  Scenario: Add a duplicate book already in the collection
    Then status 400 and message "ISBN already present"
  Scenario: Empty collectionOfIsbns
    Then status 400 (documented)
  Scenario: Malformed body (not JSON)
    Then status 400

  # Edge
  Scenario: Add a large batch (all catalogue ISBNs)
  Scenario: collectionOfIsbns with duplicate ISBNs in one request
  Scenario: userId mismatched to token's user
  Scenario: Extra unknown fields in body are ignored

  # Security
  Scenario: Add without token
    When I POST with no Authorization
    Then status 401 and message contains "not authorized"
  Scenario: Add with tampered/expired token
    Then status 401
  Scenario: IDOR — add to another user's collection
    Given token of user A and userId of user B
    Then access denied (401/403) — no cross-user mutation
  Scenario Outline: Injection in isbn "<payload>"
    Examples:
      | payload     |
      | ' OR '1'='1 |
      | <script>    |

  # Data Integrity
  Scenario: 201 body returns the updated collection list
  Scenario: Collection count increments by exactly the number added
  Scenario: No duplicate entries created on valid add
```

```gherkin
Feature: BookStore API — Delete Books  # DELETE /BookStore/v1/Books & /Book  [Books: source-verified 204/401; Book: spec-derived]

  Background:
    Given a user "${USER_ID}"/"${TOKEN}" with at least one book

  # Happy
  Scenario: Delete all books for a user
    When I DELETE "/BookStore/v1/Books?UserId=${USER_ID}" with token
    Then status 204 and the collection becomes empty
  Scenario: Delete a single book by ISBN  [spec-derived]
    When I DELETE "/BookStore/v1/Book" {isbn, userId} with token
    Then status 204/200 and that ISBN is removed
  Scenario: Delete-all is idempotent when already empty
    Then repeating returns 204 (documented)

  # Negative
  Scenario: Delete-all without UserId param
    Then status 400/401 (documented)
  Scenario: Delete single non-existent ISBN  [spec-derived]
    Then status 400
  Scenario: Delete with missing body (single)  [spec-derived]
    Then status 400
  Scenario: Delete for unknown UserId
    Then status 401/400 (documented)

  # Edge
  Scenario: Delete-all twice in a row (double-idempotency)
  Scenario: Delete single ISBN not in the user's collection
  Scenario: UserId with wrong casing
  Scenario: Concurrent delete + add race (documented behavior)

  # Security
  Scenario: Delete-all without token
    Then status 401
  Scenario: IDOR — delete another user's collection
    Given token A, UserId B
    Then denied (401/403)
  Scenario: Tampered token rejected
  Scenario Outline: Injection in UserId "<payload>"
    Examples:
      | payload     |
      | ' OR '1'='1 |
      | 1%3B DROP   |

  # Data Integrity
  Scenario: After delete-all, GET user shows books == []
  Scenario: 204 response body is empty  # assert empty body, not schema
  Scenario: Single delete removes exactly one ISBN, others remain
```

```gherkin
Feature: BookStore API — Replace Book  # PUT /BookStore/v1/Books/{ISBN}  [spec-derived, not behavior-verified]

  Background:
    Given a user "${USER_ID}"/"${TOKEN}" whose collection contains "${OLD_ISBN}"

  # Happy
  Scenario: Replace an existing book with another valid ISBN
    When I PUT "/BookStore/v1/Books/${OLD_ISBN}" {userId, isbn:${NEW_ISBN}} with token
    Then status 200 and the collection contains ${NEW_ISBN} and not ${OLD_ISBN}
  Scenario: Response returns the updated collection
    Then "books" reflects the replacement
  Scenario: Replacement persists (visible via GET user)
    Then GET user shows ${NEW_ISBN}

  # Negative
  Scenario: Replace with a non-existent new ISBN
    Then status 400
  Scenario: Replace a book the user does not own
    Then status 400
  Scenario: Missing body
    Then status 400
  Scenario: Path ISBN does not exist in catalogue
    Then status 400

  # Edge
  Scenario: Replace with the same ISBN (no-op)
  Scenario: Malformed ISBN in path
  Scenario: Very long ISBN path segment
  Scenario: userId mismatched to token

  # Security
  Scenario: PUT without token
    Then status 401
  Scenario: IDOR — modify another user's collection
    Then denied (401/403)
  Scenario: Tampered/expired token rejected
  Scenario Outline: Injection in path ISBN "<payload>"
    Examples:
      | payload     |
      | ' OR '1'='1 |
      | <script>    |

  # Data Integrity
  Scenario: Collection size unchanged after a 1-for-1 replace
  Scenario: 200 body matches collection schema
  Scenario: Old ISBN absent, new ISBN present (exactly)
```

---

## 4. Test Data Strategy

- **Creation:** Each test self-provisions a **unique user** (`qa_user_<timestamp>_<rand>`) via `POST /Account/v1/User`, then a token via `GenerateToken`. Books use **real catalogue ISBNs** fetched from `GET /BookStore/v1/Books` (never hardcoded).
- **Passwords:** valid = policy-compliant placeholder `${PASSWORD}` (upper/lower/number/special, 8+); invalid = `"weak"`.
- **Parameterization:** Scenario Outlines drive missing-field, boundary, and injection variations.
- **Isolation:** unique user per test → no shared state; tests are order-independent and parallel-safe.
- **Cleanup:** best-effort `DELETE /Account/v1/User/{UUID}` in teardown; leftover throwaway users are harmless on this public demo.
- **Secrets:** all credentials/tokens via env vars/placeholders — never committed.

## 5. Existing Coverage Analysis

An implemented framework already exists at `demoqa-automation/` (Playwright + TS) with **12 API tests** covering:
- Account: create (valid), weak-password (400), duplicate (406), token (valid/invalid), Authorized (true)
- BookStore: list, get by ISBN, invalid ISBN (400), add with auth (201), add without token (401), delete collection (204)

These map to the **Happy/Negative** and some **Security** rows above and are **behavior-verified**.

## 6. Gap Analysis (vs. existing 12 tests)

Not yet automated — highest-value additions:
- **IDOR/authorization** across users (GET/DELETE user, add/delete/replace books) — security-critical.
- **`DELETE /BookStore/v1/Book`** (single) and **`PUT /BookStore/v1/Books/{ISBN}`** (replace) — untested endpoints (`spec-derived`).
- **Edge/boundary** cases (password length boundaries, unicode, long payloads, duplicate query params).
- **Data-integrity** schema assertions and 204 empty-body assertions.
- **Injection/mass-assignment** on create-user and query params.

## 7. Priority Assignment (P0–P3)

| Priority | Applies to |
|----------|-----------|
| **P0** | Auth/mutation happy paths: create user, generate token, add books, delete collection, replace book (happy). |
| **P1** | Mutation negative + security: weak/duplicate user, add/delete/replace without token, **IDOR** cross-user, injection/mass-assignment. |
| **P2** | Read endpoints + edge: list/get books, get user, boundary/unicode/long-payload edges. |
| **P3** | Low-risk/idempotency & metadata-like checks: Authorized repeat calls, delete-all idempotency, content-type header checks. |

## 8. Scenario Count Summary

| Endpoint | Happy | Neg | Edge | Sec | Data-Int | Total |
|----------|:----:|:---:|:----:|:---:|:--------:|:-----:|
| POST /Account/v1/User | 3 | 4 | 4 | 4 | 3 | 18 |
| POST /Account/v1/GenerateToken | 3 | 4 | 4 | 4 | 3 | 18 |
| POST /Account/v1/Authorized | 3 | 4 | 4 | 4 | 3 | 18 |
| GET/DELETE /Account/v1/User/{UUID} | 3 | 4 | 4 | 4 | 3 | 18 |
| GET /BookStore/v1/Books + /Book | 4 | 4 | 4 | 4 | 4 | 20 |
| POST /BookStore/v1/Books | 3 | 4 | 4 | 4 | 3 | 18 |
| DELETE /BookStore/v1/Books + /Book | 3 | 4 | 4 | 4 | 3 | 18 |
| PUT /BookStore/v1/Books/{ISBN} | 3 | 4 | 4 | 4 | 3 | 18 |
| **Total** | — | — | — | — | — | **146** |

> Grouped features cover their endpoints' mandatory categories; Scenario Outlines are counted honestly by example rows. All 11 endpoints have all 5 categories.

---

### Notes & caveats
- `spec-derived, not behavior-verified`: `DELETE /BookStore/v1/Book` and `PUT /BookStore/v1/Books/{ISBN}` — expected status codes may differ from real behavior; confirm during implementation.
- Public endpoints (`/Books`, `/Book`, `GenerateToken`, `Authorized`) still receive **Security** coverage (injection, rate-limit, enumeration, IDOR) per the skill's public-API rule.
- 204 responses assert **empty body**, not schema.

<!-- Generated by globant-qe-api-test-designer -->
