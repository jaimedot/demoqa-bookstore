?# DemoQA Book Store — UI & API Test Automation Framework

A modern, maintainable test automation framework for the [DemoQA Book Store](https://demoqa.com/books) application, covering both **UI** (browser) and **API** (REST) layers with a single tool.

- **Application under test:** https://demoqa.com/books
- **API documentation (Swagger):** https://demoqa.com/swagger

---

## 1. Project Overview

### Purpose
Demonstrate a thoughtful, well-structured automation framework that validates the DemoQA Book Store at two levels:

- **UI layer** — drives a real Chromium browser to verify the user-facing experience (searching the catalogue, logging in, viewing a book collection).
- **API layer** — sends HTTP requests directly to the Book Store REST API to verify business logic quickly and reliably, independent of the UI.

### Scope of testing
The suite contains **31 tests (16 UI + 15 API)** mapped to the 7 user stories, all passing.

| Area | What is covered |
|------|-----------------|
| **UI – Search** | Default catalogue listing, positive keyword search, empty-result search |
| **UI – Catalogue** | Open a book's **detail view** from its title, **pagination** controls disabled on a single page |
| **UI – Login** | Valid login (self-provisioned user), invalid-credentials error, **empty-field validation**, **"New User" → registration** navigation |
| **UI – Profile** | Book added via API is displayed in the collection (hybrid API-setup + UI-assert), **view collection**, **remove a single book** (confirm dialog + alert), **empty-collection state**, **search within collection**, **logout**, **post-logout not-logged-in prompt** |
| **API – Account** | Create user (positive), weak-password rejection, duplicate rejection, token generation (valid/invalid), authorization check |
| **API – BookStore** | List books, get book by ISBN, invalid ISBN, **empty-ISBN rejection**, add book (authenticated), reject add without token (401), **reject invalid ISBN on add**, **reject duplicate book**, delete collection |

The goal is **coverage, quality and maintainability**, not the maximum number of tests. Tests are split into a core suite and focused `*-gaps.spec.ts` files that close the remaining acceptance-criteria coverage.

## Test Case Design
Each of the 31 test scenarios was chosen deliberately, balancing positive flows, negative/error handling, and boundary cases rather than maximizing raw test count. The full breakdown — scenario, type, rationale, and the exact test that implements each case — is documented in [`TestCases.md`](./TestCases.md).

---

## 2. Technical Decisions

### Chosen tools and libraries
| Tool | Why |
|------|-----|
| **TypeScript** | Static typing catches errors before runtime and documents intent — a professional default for automation. |
| **Playwright Test** | A single framework that handles **both UI and API testing**, with a built-in runner, parallelism, retries, tracing, and HTML reports. Fewer dependencies to learn and maintain. |
| **dotenv** | Keeps base URLs and any credentials in a git-ignored `.env` file, out of source control. |
| **ESLint + Prettier** | Consistent code style and static analysis. |

> **Why one tool for UI *and* API?** Playwright's `APIRequestContext` lets us hit REST endpoints with the same assertion library and reporter used for UI tests. This reduces cognitive load and lets UI tests reuse the API client to set up state quickly.

### Framework architecture
```
demoqa-automation/
├── api/                      # Reusable API client (one method per Swagger endpoint)
│   └── BookStoreApi.ts
├── pages/                    # Page Object Model — one class per screen
│   ├── BasePage.ts           #   shared behaviour (navigation, ad-hiding)
│   ├── LoginPage.ts
│   ├── BooksPage.ts
│   └── ProfilePage.ts
├── fixtures/                 # Custom Playwright fixtures
│   └── apiFixtures.ts        #   auto-provisions an authorized user per test
├── utils/                    # Test-data helpers (unique users, passwords)
│   └── testData.ts
├── tests/
│   ├── ui/                   # Browser tests
│   │   ├── search.spec.ts
│   │   ├── login.spec.ts
│   │   ├── login-gaps.spec.ts        #   empty-field validation, New User nav
│   │   ├── books-gaps.spec.ts        #   book detail view, pagination
│   │   ├── book-collection.spec.ts
│   │   └── profile-gaps.spec.ts      #   remove one, empty state, search, logout
│   └── api/                  # REST API tests
│       ├── account.spec.ts
│       ├── bookstore.spec.ts
│       └── bookstore-gaps.spec.ts    #   invalid/duplicate ISBN, empty-ISBN
├── playwright.config.ts      # Central config: two projects (ui, api)
├── .env.example              # Template for local configuration
└── README.md
```

### Design patterns used
- **Page Object Model (POM):** each screen is a class exposing intention-revealing methods (`login()`, `search()`), so tests never touch raw selectors. Selectors live in one place, making maintenance easy.
- **API Client / Service Object:** `BookStoreApi` wraps every endpoint in a typed method, keeping HTTP details (paths, headers, auth) out of the tests.
- **Custom Fixtures:** `authorizedUser` registers a fresh user, generates a token, and cleans it up afterwards — every test starts from an isolated, known state (no test interdependence).
- **Test-data factory:** `utils/testData.ts` generates unique usernames per run to avoid collisions on the shared public demo site.
- **Hybrid setup:** the profile UI test arranges state via the fast API, then asserts the result through the browser — a pragmatic, industry-standard pattern.

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
- **Node.js 18+** (developed on v24) — https://nodejs.org
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

`.env` values (all optional — sensible defaults are built in):
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
- **API tests** skip the browser and talk to the server directly — they are faster and more stable, so we use them heavily and also to set up data for UI tests.
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
