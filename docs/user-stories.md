# User Stories — DemoQA Book Store

> **Source:** Derived from the FRD (`docs/book-store.md`) and hands-on exploration of the live application. These artifacts stand in for a formal PRD (none exists for this public demo app). Acceptance criteria are written in Given/When/Then and reflect **observed, verified behavior**.
> **Scope:** Book Store user journey — browse catalogue, authenticate, manage a personal book collection (UI + API).

---

## US-001 — Browse and search the book catalogue
**As a** visitor,
**I want** to view the list of available books and search/filter it,
**so that** I can quickly find a specific book.

**Acceptance Criteria**
- **AC1 (happy):** Given I open `/books`, when the page loads, then the catalogue table displays at least 8 books with columns Image, Title, Author, Publisher.
- **AC2 (search-match):** Given the catalogue is displayed, when I type "Git" into the search box (`#searchBox`), then only rows whose Title/Author/Publisher contain "Git" (case-insensitive) remain visible.
- **AC3 (search-empty):** Given the catalogue is displayed, when I type a term that matches no book (e.g. "zzz-nonexistent"), then the table shows 0 book rows.
- **AC4 (open detail):** Given search results are shown, when I click a book title, then I navigate to that book's detail URL (`/books?search=<ISBN>`).
- **AC5 (state):** Given the catalogue fits on one page, then the "Previous" and "Next" pagination controls are disabled and the status reads "Page 1 of 1".

---

## US-002 — Log in with valid credentials
**As a** registered user,
**I want** to log in with my username and password,
**so that** I can access my profile and book collection.

**Acceptance Criteria**
- **AC1 (happy):** Given I am on `/login` and have a registered account, when I enter valid credentials and click Login (`#login`), then I am redirected to `/profile`.
- **AC2 (identity):** Given login succeeds, then my username is displayed in the profile label (`#userName-value`).
- **AC3 (required-fields):** Given both fields are empty, when I click Login, then both inputs are marked invalid (`.is-invalid`) and the form is not submitted.
- **AC4 (invalid-credentials):** Given I enter a non-existent username or wrong password, when I click Login, then the message "Invalid username or password!" is displayed (`#name`) and I remain on `/login`.

---

## US-003 — Register a new user
**As a** new visitor,
**I want** to create an account,
**so that** I can build my own book collection.

**Acceptance Criteria**
- **AC1 (entry):** Given I am on `/login`, when I click "New User" (`#newUser`), then I am taken to the registration page.
- **AC2 (happy, API):** Given a unique username and a policy-compliant password, when the account is created via `POST /Account/v1/User`, then the response is 201 and returns a `userID`.
- **AC3 (weak-password):** Given a password that violates the policy (e.g. "weak"), when I submit registration, then the response is 400 and the message contains "Passwords must have".
- **AC4 (duplicate):** Given a username that already exists, when I submit registration, then the response is 406 and the message contains "User exists".
- **AC5 (policy):** The password policy requires at least 8 characters, one uppercase, one lowercase, one number, and one special character.

---

## US-004 — Add a book to my collection
**As a** logged-in user,
**I want** to add a book to my collection,
**so that** I can keep track of books I own or want.

**Acceptance Criteria**
- **AC1 (happy, API):** Given I am authenticated with a valid token, when I add a book via `POST /BookStore/v1/Books` with a valid ISBN, then the response is 201 and the book appears in my collection.
- **AC2 (visible in UI):** Given I added a book, when I view `/profile`, then the book's title is listed in my collection table.
- **AC3 (unauthorized):** Given no valid token is provided, when I call `POST /BookStore/v1/Books`, then the response is 401 with a message containing "not authorized".
- **AC4 (invalid ISBN):** Given a non-existent ISBN, when I add it, then the response is 400 and the message references the ISBN.
- **AC5 (duplicate):** Given a book already in my collection, when I add the same ISBN again, then the response is 400 indicating the ISBN is already present.

---

## US-005 — View and remove books in my profile
**As a** logged-in user,
**I want** to see my collection and remove books,
**so that** I can keep it accurate.

**Acceptance Criteria**
- **AC1 (view):** Given I am logged in with books in my collection, when I open `/profile`, then each book is shown with Image, Title, Author, Publisher, and a per-row Delete action.
- **AC2 (remove one):** Given my collection has a book, when I click its Delete control (`#delete-record-<ISBN>`) and confirm, then that book is removed from the collection.
- **AC3 (remove all, API):** Given I am authenticated, when I call `DELETE /BookStore/v1/Books?UserId=<id>`, then the response is 204 and my collection becomes empty.
- **AC4 (empty state):** Given my collection is empty, when I open `/profile`, then the collection table shows 0 rows.
- **AC5 (search collection):** Given I have multiple books, when I type in the profile search box, then the collection filters to matching titles.

---

## US-006 — Log out
**As a** logged-in user,
**I want** to log out,
**so that** my session ends and my data is protected on shared devices.

**Acceptance Criteria**
- **AC1 (happy):** Given I am on `/profile`, when I click the Logout button, then my session ends and I am returned to `/login`.
- **AC2 (post-logout):** Given I have logged out, when I try to open `/profile` directly, then I see the "not logged in" prompt instead of a collection.

---

## US-007 — Retrieve a book by ISBN (API)
**As an** API consumer,
**I want** to fetch a single book by its ISBN,
**so that** I can display or validate its details.

**Acceptance Criteria**
- **AC1 (happy):** Given a valid catalogue ISBN, when I call `GET /BookStore/v1/Book?ISBN=<isbn>`, then the response is 200 and the returned `isbn` matches the request.
- **AC2 (not found):** Given an ISBN not in the catalogue, when I call the endpoint, then the response is 400 with the message "ISBN supplied is not available in Books Collection!".
- **AC3 (missing/empty param):** Given the ISBN query parameter is empty, when I call the endpoint, then the response is 400. (Note: an entirely *omitted* ISBN param currently returns HTTP 500 on the live API — a discovered defect, tracked in `docs/coverage-audit-v2.md`.)

---

<!-- Generated as PRD-equivalent user stories from FRD/exploration artifacts. -->
