# Traceability Matrix — QAI Automation Framework

Maps tags → features → scenarios → executed cases → endpoints. Target: 100% of Gherkin scenarios and executed cases mapped.

## Tag Convention

```
@<platform> <suite> <scenario-id>
```

- **Platform**: `@web` | `@api`
- **Suite**: `@smoke` | `@regression` | `@integration`
- **Scenario ID**: `@S<scenario>TC<nnn>` (e.g., `@S07TC001`)

A `Scenario Outline` is one scenario definition with several executed cases (one per `Examples` row). Cucumber reports each executed case as a scenario; this matrix tracks both levels.

---

## API Test Cases

| Tag | Feature File | Scenario Definition | Test Case ID | Endpoint | Method | Expected Result | Status |
|-----|--------------|---------------------|--------------|----------|--------|-----------------|--------|
| `@api @regression @S07TC001` | `features/api/pdf-validation.feature` | PDF upload size limit validation (Outline, 2 cases) | TC-001 | `/api/upload` | POST (multipart) | 2MB → 200 + `success`; 2.1MB → 413 + `file too large` | Implemented |
| `@api @integration @S13TC000` | `features/api/dynamic-data.feature` | Authenticate and establish shared cookie context | TC-000 | `/api/login` | POST | 200 + session cookie stored in `TestContext` | Implemented |
| `@api @integration @S13TC001` | `features/api/dynamic-data.feature` | User flow with shared cookie context (Outline, 3 cases) | TC-001 | `/api/users/1`, `/api/users/2`, `/api/users/3` | POST | 200 + user payload echoed with session identity | Implemented |

### PDF Size Validation Cases (`@S07TC001`)

| Case | Generated Size | Expected Status | Expected Body Fragment |
|------|----------------|-----------------|------------------------|
| 1 | 2MB (2,097,152 bytes) | 200 | `success` |
| 2 | 2.1MB (2,202,010 bytes) | 413 | `file too large` |

The PDF buffer is generated in memory by `packages/api/src/step-defs/api-steps.ts`; the tracked fixtures under `test-data/pdfs/` are maintained by `scripts/generate-test-pdfs.ts`.

### Dynamic Data Cases (`@S13TC001`)

| Case | Endpoint | Payload | Expected Status | Cookie Context |
|------|----------|---------|-----------------|----------------|
| 1 | `/api/users/1` | `{"name":"Alice"}` | 200 | Cookies from `@S13TC000` |
| 2 | `/api/users/2` | `{"name":"Bob"}` | 200 | Cookies from `@S13TC000` |
| 3 | `/api/users/3` | `{"name":"Carol"}` | 200 | Cookies from `@S13TC000` |

---

## Web Test Cases

| Tag | Feature File | Scenario Definition | Test Case ID | Page / Route | Method | Expected Result | Status |
|-----|--------------|---------------------|--------------|--------------|--------|-----------------|--------|
| `@web @smoke @S01TC001` | `features/web/login.feature` | Successful login with valid credentials | TC-001 | `/login` → `/api/login` → `/dashboard` | GET → POST → GET | Redirect to dashboard, welcome text visible | Implemented |

---

## Coverage Summary

| Platform | Scenario Definitions | Executed Cases | Mapped | Coverage |
|----------|---------------------:|---------------:|-------:|---------:|
| API | 3 | 6 | 6 | 100% |
| Web | 1 | 1 | 1 | 100% |
| **Overall** | **4** | **7** | **7** | **100%** |

| Suite | Scenario Definitions | Executed Cases | Coverage |
|-------|---------------------:|---------------:|---------:|
| `@smoke` | 1 | 1 | 100% |
| `@regression` | 1 | 2 | 100% |
| `@integration` | 2 | 4 | 100% |

`npm test` reports 7 scenarios / 23 steps; these are the 7 executed cases above.

---

## Tag-to-File Mapping

| Tag Prefix | Feature File | Step Definitions |
|------------|--------------|-----------------|
| `@api` | `features/api/*.feature` | `packages/api/src/step-defs/api-steps.ts` |
| `@web` | `features/web/*.feature` | `packages/web/src/step-defs/web-steps.ts` |

Shared hooks: `support/hooks.ts`. Shared context: `packages/core/src/test-context.ts`.

---

## How to Update

1. Add a scenario → assign a tag following the convention above.
2. Add one matrix row per scenario definition; list `Examples` rows in the detail table.
3. Update the coverage summary from the Gherkin source, not from memory.
4. Run `npm test` and confirm the executed-case count matches.
5. PR review → verify 100% coverage is maintained.
