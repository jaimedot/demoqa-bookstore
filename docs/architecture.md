# Test Framework Architecture — DemoQA Book Store

> **Mode:** document framework at `demoqa-automation/`).
> **Covers both layers** (UI + API) — a single-tool framework, so one architecture document serves both the UI-architect and API-architect roles.
> **Date:** 2026-08-13

---

## 1. Technology Stack (as implemented)

| Concern | Choice | Evidence |
|---------|--------|----------|
| Language | **TypeScript** | `tsconfig.json` (strict), `*.ts` specs |
| Test runner + UI automation | **Playwright Test** (`@playwright/test` ^1.48) | `playwright.config.ts`, `package.json` |
| API testing | **Playwright `APIRequestContext`** (same tool) | `api/BookStoreApi.ts`, `tests/api/*` |
| Config / secrets | **dotenv** | `.env.example`, `playwright.config.ts` |
| Lint / format | **ESLint + Prettier** | `.eslintrc.json`, `.prettierrc.json` |
| CI | **GitHub Actions** | `.github/workflows/tests.yml` |
| Runtime | Node.js 18+ (built on v24) | `package.json` |

**Key decision:** one tool (Playwright) drives **both UI and API** tests, sharing the runner, assertion library, reporter, and retry/trace tooling. This lowers cognitive load and lets UI tests reuse the API client for fast state setup.

## 2. Project Structure (actual)

```
demoqa-automation/
├── api/
│   └── BookStoreApi.ts        # Service Object: one method per Swagger endpoint
├── pages/                     # Page Object Model
│   ├── BasePage.ts            #   shared nav + ad-hiding
│   ├── LoginPage.ts
│   ├── BooksPage.ts
│   └── ProfilePage.ts
├── fixtures/
│   └── apiFixtures.ts         # custom fixtures: auto-provision authorized user
├── utils/
│   └── testData.ts            # unique-user + password generators
├── tests/
│   ├── ui/
│   │   ├── search.spec.ts             # 3 tests
│   │   ├── login.spec.ts              # 2 tests
│   │   └── book-collection.spec.ts    # 1 test (hybrid API-setup + UI-assert)
│   └── api/
│       ├── account.spec.ts            # 6 tests
│       └── bookstore.spec.ts          # 6 tests
├── playwright.config.ts       # 2 projects: "ui" and "api"
├── package.json               # scripts: test, test:ui, test:api, test:headed, report, lint, format
├── .github/workflows/tests.yml
└── README.md
```

## 3. Design Patterns

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Page Object Model** | `pages/` | UI selectors/actions isolated per screen; tests never touch raw selectors. `BasePage` centralizes navigation + ad-hiding. |
| **Service Object / API Client** | `api/BookStoreApi.ts` | One typed method per REST endpoint; HTTP details (paths, headers, auth) kept out of tests. |
| **Custom Fixtures** | `fixtures/apiFixtures.ts` | `api` (ready client) and `authorizedUser` (registers a user + token, deletes it after) → each test starts isolated. |
| **Test-data factory** | `utils/testData.ts` | Unique usernames per run (avoids collisions on the shared demo); valid/weak password constants. |
| **Hybrid setup** | `book-collection.spec.ts` | Arrange state fast via API, assert result through the browser. |
| **Config-driven** | `playwright.config.ts` + `.env` | Base URLs and credentials externalized; two projects separate UI vs API. |

## 4. Execution Model

- **Two Playwright projects**: `ui` (Chromium, `baseURL` demoqa.com, headless) and `api` (JSON headers, no browser).
- **Selective runs**: `npm run test:ui`, `npm run test:api`, `npm test` (both).
- **Resilience**: 1 local retry (2 on CI), `trace: on-first-retry`, `screenshot: only-on-failure`, `video: retain-on-failure`.
- **Reporting**: `list` + `html`; open via `npm run report`.
- **CI**: GitHub Actions installs deps + Chromium, runs the full suite, uploads the HTML report artifact.

## 5. Key Engineering Decisions & Rationale

1. **Playwright + TS over Selenium/Cypress** — single tool for UI+API, first-class TS, built-in parallelism/trace/reporter.
2. **Self-provisioning test data** — every test creates its own unique user via the API; no reliance on a fixed account → parallel-safe, reproducible on any machine.
3. **Element-state waits, never `networkidle`** — assertions wait on specific elements/URLs (this Vue-based DemoQA renders asynchronously).
4. **Stable selectors** — book rows via `a[href*="books?search="]` (href pattern), not brittle table classes; documented non-unique `#submit` on Profile → target by text.
5. **Ad-hiding in `BasePage`** — defensive CSS injection to stop third-party ad iframes intercepting clicks.
6. **Retries enabled** — absorbs the public demo's occasional flakiness without masking real failures (traces captured on retry).

## 6. Test Inventory (31 tests, all passing)

**UI (16):**
- search × 3 (default list, keyword match, no-match)
- login × 2 (valid, invalid)
- login-gaps × 2 (empty-field validation, "New User" → registration)
- books-gaps × 2 (open book detail view, pagination disabled on single page)
- book-collection × 1 (book appears after API add)
- profile-gaps × 6 (view collection, remove one via UI, empty-collection state, search within collection, logout, post-logout not-logged-in prompt)

**API (15):**
- Account × 6 (create valid, weak-pw 400, duplicate 406, token valid, token invalid, Authorized true)
- BookStore × 6 (list, get by ISBN, bad ISBN 400, add 201, add-without-token 401, delete collection 204)
- bookstore-gaps × 3 (invalid ISBN on add, duplicate book, empty-ISBN rejection)

## 7. Traceability to Design Artifacts

| Design artifact | Role in this framework |
|-----------------|------------------------|
| `docs/book-store.md` (FRD) | Source of verified selectors and behaviors used in Page Objects |
| `docs/user-stories.md` | Scenarios that the specs implement |
| `docs/api-test-cases.md` | API scenario design behind `tests/api/*` |
| `docs/coverage-audit-v2.md` | Requirement-to-test traceability (all acceptance criteria) |
| `TestCases.md` (repo root) | Test-case catalogue mapping each ID to its implemented test |

## 8. Extensibility (how to add coverage)

- **New screen** → add a Page Object in `pages/` (extend `BasePage`), then a spec in `tests/ui/`.
- **New endpoint** → add a method to `BookStoreApi.ts`, then a spec in `tests/api/`.
- **New shared setup** → extend `fixtures/apiFixtures.ts`.
- Follow existing conventions: typed signatures, selectors by stability priority (`data-testid` > `id` > `aria-label` > CSS), element-state waits.

> See `coverage-audit-v2.md` for the requirement-to-test traceability between this implemented suite and the full set of documented scenarios.

<!-- Generated in document-existing mode (framework-architect UI+API) -->
