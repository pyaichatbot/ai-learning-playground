# Implementation Skill - Auto-Loaded by AI Coding Agents

## ⚡ How This Skill Works

This skill is **automatically read and applied** by AI coding agents (Claude, Cursor, Aider) when implementing user stories. The agent understands and follows these patterns **without manual intervention**.

**User says**: "Implement Story 1.2"  
**Agent does**: Reads this skill → Follows 7-step process → Generates complete implementation

**No scripts to run, no manual steps needed.**

---

## 🎯 When to Activate

Apply this skill when user requests:
- "Implement Story X.X"
- "Start working on Story X.X"  
- "Build the feature from Story X.X"
- References any story from `docs/product/USER-STORIES.md`

---

## 📋 7-Step Implementation Process

### Step 1: ANALYZE

Read story from `docs/product/USER-STORIES.md`, understand:
- Acceptance criteria
- Technical tasks
- Dependencies
- Security requirements

**Output**: Brief analysis summary

---

### Step 2: WRITE TESTS FIRST (TDD Red)

**Generate complete test suite** covering:

1. **Happy Path Tests**
```python
def test_feature_success(client):
    """Test normal operation"""
    response = client.post("/endpoint", json={...})
    assert response.status_code == 201
```

2. **Validation Tests**
```python
def test_feature_invalid_input(client):
    """Test with invalid data"""
    response = client.post("/endpoint", json={"invalid": "data"})
    assert response.status_code == 422
```

3. **Edge Cases**
```python
def test_feature_with_null(client):
    """Test with null values"""
    
def test_feature_max_length(client):
    """Test boundary values"""
```

4. **Security Tests**
```python
def test_sql_injection_prevented(client):
    """Ensure SQL injection blocked"""
    malicious = "admin' OR '1'='1"
    response = client.get(f"/endpoint?q={malicious}")
    # Verify attack failed
```

**Requirement**: Show complete test file, not snippets.

---

### Step 3: IMPLEMENT (TDD Green)

Write **minimal code to pass tests**:

**Required Code Quality**:
- ✅ Type hints on all functions
- ✅ Docstrings on public functions  
- ✅ Pydantic validation for inputs
- ✅ No hardcoded values
- ✅ Error handling with proper HTTP codes
- ✅ PEP 8 compliance

**Example**:
```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

router = APIRouter()

class ItemCreate(BaseModel):
    """Item creation schema"""
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., gt=0)

@router.post("/items")
async def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Create new item with validation"""
    # Implementation
```

**Requirement**: Show complete implementation files.

---

### Step 4: ADD EDGE CASES & SECURITY

**Expand tests for**:

1. **Null/Empty Inputs**
2. **Boundary Values** (min/max lengths)
3. **Invalid Formats**
4. **Concurrent Requests** (if stateful)
5. **SQL Injection Attempts**
6. **XSS Attempts**
7. **Cross-Tenant Access** (if multi-tenant)
8. **Authentication Bypass Attempts**

**Example Security Test**:
```python
def test_cross_tenant_isolation(client, db):
    """Prevent cross-tenant data access"""
    # Create two tenants
    tenant_a = create_tenant("A")
    tenant_b = create_tenant("B")
    
    # User A creates resource
    resource = create_resource(tenant_a)
    
    # User B tries to access
    token_b = get_token(tenant_b)
    response = client.get(
        f"/resources/{resource.id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    
    assert response.status_code == 403  # Forbidden
```

---

### Step 5: VERIFY QUALITY

**Check and report**:

1. **Test Coverage**: Run and show ≥80%
2. **Type Checking**: mypy results
3. **Linting**: ruff/black results  
4. **Security**: No secrets in code

**Output Format**:
```
✅ Tests: 18/18 passing
✅ Coverage: 94%
✅ Linting: Clean
✅ Type Checking: Clean
✅ Security: No issues
```

---

### Step 6: DOCUMENT

**Update if needed**:
- API documentation (Swagger updates automatically)
- README (if setup changed)
- `docs/LEARNING-LOG.md` (if issues encountered)

**Learning Log Template**:
```markdown
### [DATE] Story X.X: Title

**What Happened**: Issue description
**Root Cause**: Why it happened  
**Solution**: How fixed
**Lesson**: Takeaway for future

**Tags**: #category
```

---

### Step 7: SUMMARIZE

**Provide complete summary**:

```markdown
## Story X.X: [Title] - COMPLETE ✅

**Implemented**:
- Feature 1
- Feature 2

**Files Created**:
- app/api/routes/feature.py
- tests/api/test_feature.py

**Tests**: 18 total (all passing)
**Coverage**: 94%
**Security**: All checks passed

**Next Story**: X.Y - [Next Title]
```

---

## 🔒 Mandatory Security Patterns

### 1. Input Validation (ALWAYS)
```python
from pydantic import BaseModel, Field, validator

class UserInput(BaseModel):
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    
    @validator('email')
    def validate_no_xss(cls, v):
        if '<script>' in v.lower():
            raise ValueError('Invalid input')
        return v
```

### 2. SQL Injection Prevention (ALWAYS)
```python
# ✅ CORRECT
from sqlalchemy import select
stmt = select(User).where(User.email == email)

# ❌ NEVER DO THIS
query = f"SELECT * FROM users WHERE email = '{email}'"
```

### 3. PII Redaction (ALWAYS)
```python
import re

def redact_pii(text: str) -> str:
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', '[REDACTED_EMAIL]', text)
    text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', text)
    return text
```

### 4. Cross-Tenant Isolation (ALWAYS)
```python
async def get_resource(
    resource_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(
        Resource.id == resource_id,
        Resource.tenant_id == current_user.tenant_id  # REQUIRED
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404)
    return resource
```

---

## 📦 Code Generation Standards

### FastAPI Route Template
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.security import get_current_user
from app.db.session import get_db
from app.models import FeatureCreate, FeatureResponse
from app.services import FeatureService

router = APIRouter()

@router.post(
    "/features",
    response_model=FeatureResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_feature(
    feature_in: FeatureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> FeatureResponse:
    """
    Create new feature.
    
    Requires authentication.
    
    Args:
        feature_in: Feature data
        current_user: Authenticated user
        db: Database session
        
    Returns:
        Created feature
        
    Raises:
        HTTPException: 400 if validation fails
    """
    service = FeatureService(db)
    return service.create(feature_in, user=current_user)
```

### Pydantic Model Template
```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class FeatureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    
    @validator('name')
    def validate_name(cls, v):
        if '<' in v or '>' in v:
            raise ValueError('Invalid characters')
        return v

class FeatureCreate(FeatureBase):
    pass

class FeatureResponse(FeatureBase):
    id: str
    tenant_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## ✅ Success Criteria Checklist

Story is complete when:

- [ ] All acceptance criteria met
- [ ] Tests written first (TDD)
- [ ] All tests passing (≥80% coverage)
- [ ] Edge cases tested
- [ ] Security tests included
- [ ] No linting errors
- [ ] Type hints on all functions
- [ ] No hardcoded secrets
- [ ] PII redaction verified
- [ ] Cross-tenant isolation (if applicable)
- [ ] Documentation updated
- [ ] Learning logged (if issues)

---

## 🚨 Critical Reminders

1. **ALWAYS write tests before code** (TDD Red → Green → Refactor)
2. **NEVER skip security tests** (SQL injection, XSS, cross-tenant)
3. **ALWAYS provide complete files** (not snippets or "..." placeholders)
4. **NEVER hardcode secrets** (use environment variables)
5. **ALWAYS validate inputs** (Pydantic schemas required)
6. **ALWAYS check tenant_id** (prevent cross-tenant leakage)
7. **ALWAYS redact PII** in logs and traces
8. **ALWAYS use type hints** on all functions

---

## 📝 Response Format

When implementing a story, provide:

1. **Analysis** - Brief story understanding
2. **Tests** - Complete test file(s)
3. **Implementation** - Complete source file(s)  
4. **Edge Cases** - Additional test cases
5. **Quality Report** - Coverage/linting results
6. **Summary** - What was built, what's next

**Example Response Structure**:
```markdown
# Story 1.2 Implementation

## Analysis
[Brief analysis]

## Tests (TDD Red)
```python
[Complete test file - 200+ lines]
```

## Implementation (TDD Green)
```python
[Complete implementation - 150+ lines]
```

## Edge Case Tests
```python
[Additional tests - 100+ lines]
```

## Quality Verification
✅ Coverage: 94%
✅ Linting: Clean
✅ Security: Passed

## Summary
Story complete. Next: Story 1.3
```

---

**This skill ensures every implementation is production-ready, well-tested, and secure by default.**
