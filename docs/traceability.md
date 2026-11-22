# Traceability Matrix — QAI Automation Framework

Maps tags → features → scenarios → test cases → endpoints. Target: 100% of automated scenarios mapped.

## Tag Convention

```
@<platform> <suite> <scenario-id>
```

- **Platform**: `@web` | `@api`
- **Suite**: `@smoke` | `@regression` | `@integration`
- **Scenario ID**: `@S<scenario>TC<nnn>` (e.g., `@S07TC001`)

---

## API Test Cases

| Tag | Feature File | Scenario | Test Case ID | Endpoint | Method | Expected Result | Status |
|-----|-------------|----------|--------------|----------|--------|-----------------|--------|
| `@api @regression @S07TC001` | `features/api/pdf-validation.feature` | PDF upload size limit validation (2MB) | TC-001 | `/api/upload` | POST | 200 + `{status: "success"}` | Planned |
| `@api @regression @S07TC002` | `features/api/pdf-validation.feature` | PDF upload size limit validation (>2MB) | TC-002 | `/api/upload` | POST | 413 + `{status: "error", message: "file too large"}` | Planned |
| `@api @integration @S13TC000` | `features/api/dynamic-data.feature` | Authenticate and establish shared cookie context | TC-000 | `/api/login` | POST | 200 | Implemented |
| `@api @integration @S13TC001` | `features/api/dynamic-data.feature` | User flow with shared cookie context (data set 1) | TC-001 | `/api/users/1` | GET/POST | 200 | Implemented |
| `@api @integration @S13TC002` | `features/api/dynamic-data.feature` | User flow with shared cookie context (data set 2) | TC-002 | `/api/users/2` | GET/POST | 200 | Implemented |
| `@api @integration @S13TC003` | `features/api/dynamic-data.feature` | User flow with shared cookie context (data set 3) | TC-003 | `/api/users/3` | GET/POST | 200 | Implemented |

### PDF Size Validation Details

| Scenario | File Size | Expected Status | Expected Body |
|----------|-----------|-----------------|---------------|
| `@S07TC001` | Exactly 2MB (2,097,152 bytes) | 200 | `{ "status": "success" }` |
| `@S07TC002` | >2MB (e.g., 2.1MB) | 413 | `{ "status": "error", "message": "file too large" }` |

### Dynamic Data Details

| Scenario | Data Set | Payload | Endpoint | Cookie Context |
|----------|----------|---------|----------|----------------|
| `@S13TC001` | Set 1 | `{"name": "Alice"}` | `/api/users/1` | Cookies from prior scenario |
| `@S13TC002` | Set 2 | `{"name": "Bob"}` | `/api/users/2` | Cookies from prior scenario |
| `@S13TC003` | Set 3 | `{"name": "Carol"}` | `/api/users/3` | Cookies from prior scenario |

---

## Web Test Cases

| Tag | Feature File | Scenario | Test Case ID | Page / Route | Method | Expected Result | Status |
|-----|-------------|----------|--------------|--------------|--------|-----------------|--------|
| `@web @smoke @S01TC001` | `features/web/login.feature` | Successful login | TC-001 | `/login` → `/dashboard` | GET/POST | Redirect to dashboard, welcome text visible | Planned |
| `@web @regression @S02TC001` | `features/web/login.feature` | Failed login (invalid credentials) | TC-001 | `/login` | POST | Stay on login page, error message visible | Planned |
| `@web @smoke @S03TC001` | `features/web/dashboard.feature` | Dashboard loads after login | TC-001 | `/dashboard` | GET | Dashboard components rendered | Planned |

---

## Coverage Summary

| Platform | Total Scenarios | Mapped | Coverage |
|----------|-----------------|--------|----------|
| API | 5 | 5 | 100% |
| Web | 3 | 3 | 100% |
| **Overall** | **8** | **8** | **100%** |

| Suite | Scenarios | Coverage |
|-------|-----------|----------|
| `@smoke` | 3 | 100% |
| `@regression` | 3 | 100% |
| `@integration` | 2 | 100% |

---

## Tag-to-File Mapping

| Tag Prefix | Feature File | Step Definitions |
|------------|-------------|-----------------|
| `@api` | `features/api/*.feature` | `packages/api/src/` |
| `@web` | `features/web/*.feature` | `packages/web/src/` |

---

## How to Update

1. Add new scenario → Assign tag following convention
2. Update this matrix → Add row with Tag, Feature, Scenario, Test Case ID, Endpoint, Expected Result
3. Update coverage summary → Recalculate percentages
4. PR review → Verify 100% coverage maintained