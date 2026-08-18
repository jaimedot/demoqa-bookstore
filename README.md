# DemoQA Book Store â€” UI & API Test Automation Framework

A modern, maintainable test automation framework for the [DemoQA Book Store](https://demoqa.com/books) application, covering both **UI** (browser) and **API** (REST) layers with a single tool.

- **Application under test:** https://demoqa.com/books
- **API documentation (Swagger):** https://demoqa.com/swagger

---

## 1. Project Overview

### Purpose
Demonstrate a thoughtful, well-structured automation framework that validates the DemoQA Book Store at two levels:

- **UI layer** â€” drives a real Chromium browser to verify the user-facing experience (searching the catalogue, logging in, viewing a book collection).
- **API layer** â€” sends HTTP requests directly to the Book Store REST API to verify business logic quickly and reliably, independent of the UI.

### Scope of testing
The suite contains **31 tests (16 UI + 15 API)** mapped to the 7 user stories, all passing.

| Area | What is covered |
|------|-----------------|
| **UI â€“ Search** | Default catalogue listing, positive keyword search, empty-result search |
| **UI â€“ Catalogue** | Open a book's **detail view** from its title, **pagination** controls disabled on a single page |
| **UI â€“ Login** | Valid login (self-provisioned user), invalid-credentials error, **empty-field validation**, **"New User" â†’ registration** navigation |
| **UI â€“ Profile** | Book added via API is displayed in the collection (hybrid API-setup + UI-assert), **view collection**, **remove a single book** (confirm dialog + alert), **empty-collection state**, **search within collection**, **logout**, **post-logout not-logged-in prompt** |
| **API â€“ Account** | Create user (positive), weak-password rejection, duplicate rejection, token generation (valid/invalid), authorization check |
| **API â€“ BookStore** | List books, get book by ISBN, invalid ISBN, **empty-ISBN rejection**, add book (authenticated), reject add without token (401), **reject invalid ISBN on add**, **reject duplicate book**, delete collection |

The goal is **coverage, quality and maintainability**, not the maximum number of tests. Tests are split into a core suite and focused `*-gaps.spec.ts` files that close the remaining acceptance-criteria coverage.

## Test Case Design
Each of the 31 test scenarios was chosen deliberately, balancing positive flows, negative/error handling, and boundary cases rather than maximizing raw test count. The full breakdown â€” scenario, type, rationale, and the exact test that implements each case â€” is documented in [`TestCases.md`](./TestCases.md).

---

## 2. Technical Decisions

### Chosen tools and libraries
| Tool | Why |
|------|-----|
| **TypeScript** | Static typing catches errors before runtime and documents intent â€” a professional default for automation. |
| **Playwright Test** | A single framework that handles **both UI and API testing**, with a built-in runner, parallelism, retries, tracing, and HTML reports. Fewer dependencies to learn and maintain. |
| **dotenv** | Keeps base URLs and any credentials in a git-ignored `.env` file, out of source control. |
| **ESLint + Prettier** | Consistent code style and static analysis. |

> **Why one tool for UI *and* API?** Playwright's `APIRequestContext` lets us hit REST endpoints with the same assertion library and reporter used for UI tests. This reduces cognitive load and lets UI tests reuse the API client to set up state quickly.

### Framework architecture
```
demoqa-automation/
â”œâ”€â”€ api/                      # Reusable API client (one method per Swagger endpoint)
â”‚   â””â”€â”€ BookStoreApi.ts
â”œâ”€â”€ pages/                    # Page Object Model â€” one class per screen
â”‚   â”œâ”€â”€ BasePage.ts           #   shared behaviour (navigation, ad-hiding)
â”‚   â”œâ”€â”€ LoginPage.ts
â”‚   â”œâ”€â”€ BooksPage.ts
â”‚   â””â”€â”€ ProfilePage.ts
â”œâ”€â”€ fixtures/                 # Custom Playwright fixtures
â”‚   â””â”€â”€ apiFixtures.ts        #   auto-provisions an authorized user per test
â”œâ”€â”€ utils/                    # Test-data helpers (unique users, passwords)
â”‚   â””â”€â”€ testData.ts
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ ui/                   # Browser tests
â”‚   â”‚   â”œâ”€â”€ search.spec.ts
â”‚   â”‚   â”œâ”€â”€ login.spec.ts
â”‚   â”‚   â”œâ”€â”€ login-gaps.spec.ts        #   empty-field validation, New User nav
â”‚   â”‚   â”œâ”€â”€ books-gaps.spec.ts        #   book detail view, pagination
â”‚   â”‚   â”œâ”€â”€ book-collection.spec.ts
â”‚   â”‚   â””â”€â”€ profile-gaps.spec.ts      #   remove one, empty state, search, logout
â”‚   â””â”€â”€ api/                  # REST API tests
â”‚       â”œâ”€â”€ account.spec.ts
â”‚       â”œâ”€â”€ bookstore.spec.ts
â”‚       â””â”€â”€ bookstore-gaps.spec.ts    #   invalid/duplicate ISBN, empty-ISBN
â”œâ”€â”€ playwright.config.ts      # Central config: two projects (ui, api)
â”œâ”€â”€ .env.example              # Template for local configuration
â””â”€â”€ README.md
```

### Design patterns used
- **Page Object Model (POM):** each screen is a class exposing intention-revealing methods (`login()`, `search()`), so tests never touch raw selectors. Selectors live in one place, making maintenance easy.
- **API Client / Service Object:** `BookStoreApi` wraps every endpoint in a typed method, keeping HTTP details (paths, headers, auth) out of the tests.
- **Custom Fixtures:** `authorizedUser` registers a fresh user, generates a token, and cleans it up afterwards â€” every test starts from an isolated, known state (no test interdependence).
- **Test-data factory:** `utils/testData.ts` generates unique usernames per run to avoid collisions on the shared public demo site.
- **Hybrid setup:** the profile UI test arranges state via the fast API, then asserts the result through the browser â€” a pragmatic, industry-standard pattern.

### Assumptions made
- DemoQA is a **public, shared demo site**; data and availability can vary. Tests therefore **self-provision** their own users/data rather than relying on a fixed account, and a **retry** is enabled to absorb occasional flakiness/network hiccups.
- The catalogue always contains at least a couple of books (true for DemoQA's fixed seed data).
- Book title links are matched by their stable `href` pattern (`/books?search=<ISBN>`) rather than brittle CSS classes.
- Third-party ad iframes on DemoQA are hidden at runtime to prevent them from intercepting clicks.
- Behaviour observed against the live API (e.g. `GenerateToken` returns HTTP 200 with a `Failed` body for bad credentials) is treated as the contract.

### AI-Assisted Development
AI tools were used throughout this project to accelerate implementation -- primarily for scaffolding the Page Object Model classes, generating boilerplate for the custom Playwright fixtures, and drafting initial versions of repetitive test cases (e.g., negative/boundary variants of an already-designed positive case). Every AI-generated suggestion was reviewed, tested against the live application, and adjusted manually before being committed -- test intent, assertions, and edge-case coverage were defined and validated by hand rather than delegated. AI usage was treated as a way to move faster on repetitive, well-understood work, not as a substitute for test design judgment.

---

## 3. Getting Started

### Prerequisites
- **Node.js 18+** (developed on v24) â€” https://nodejs.org
- **Git**

Check your versions:
```bash
node --version
npm --version
```

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Install the Chromium browser Playwright uses
npx playwright install chromium
```

### Configuration
Copy the example environment file and adjust if needed:
```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

`.env` values (all optional â€” sensible defaults are built in):
```
UI_BASE_URL=https://demoqa.com
API_BASE_URL=https://demoqa.com
DEMOQA_USERNAME=your_username_here
DEMOQA_PASSWORD=Your_Password_123!
```
> The suite **auto-creates its own users**, so you do not need a pre-existing DemoQA account. The credentials fields are provided only if you want to point tests at a specific account.

---

## 4. Running the Tests

| Command | What it does |
|---------|--------------|
| `npm test` | Run **all** tests (UI + API) |
| `npm run test:api` | Run only the **API** suite |
| `npm run test:ui` | Run only the **UI** suite (headless) |
| `npm run test:headed` | Run the UI suite with a **visible browser** (great for learning/debugging) |
| `npm run report` | Open the last HTML report in your browser |
| `npm run lint` | Run ESLint |
| `npm run format` | Auto-format with Prettier |

Examples:
```bash
# Everything
npm test

# Just the API tests (fast, no browser)
npm run test:api

# Watch the UI tests run in a real browser
npm run test:headed
```

### Reports
After any run, an HTML report is generated in `playwright-report/`. View it with:
```bash
npm run report
```
On failure, Playwright automatically captures a **screenshot**, **video**, and **trace** (viewable in the report) to make debugging straightforward.

---

## 5. How It Works (for non-experts)

- A **test** is a small script that performs actions and then **asserts** ("expects") a result.
- **UI tests** open a browser, click and type like a user, and check what appears on screen.
- **API tests** skip the browser and talk to the server directly â€” they are faster and more stable, so we use them heavily and also to set up data for UI tests.
- The **Page Objects** (`pages/`) describe each screen once; if the website changes, you update one file instead of every test.
- The **API client** (`api/BookStoreApi.ts`) describes each server endpoint once, for the same reason.

---

## 6. Continuous Integration

A ready-to-use GitHub Actions workflow is included at `.github/workflows/tests.yml`. On every push/PR it installs dependencies, installs the browser, runs the full suite, and uploads the HTML report as an artifact.

---

## 7. Tech Stack Summary
- **Language:** TypeScript
- **Test runner & UI automation:** Playwright Test
- **API testing:** Playwright `APIRequestContext`
- **Tooling:** ESLint, Prettier, dotenv

---

## License
MIT
