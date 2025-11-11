# AI Usage Log

This document tracks all AI tool usage in the CS3219 PeerPrep project, in accordance with the AI Usage Policy (Appendix 3).

**Team Members**: Johannsen Lum, Basil, Kaidama97, Chin Cherng Yuen, Wong Zenwei

**Compliance Statement**: All AI usage documented here is within the allowed list. Requirements, architecture, and design decisions were made by the team without AI assistance.

---

## Entry 1: Random Question Endpoint Implementation

**Date/Time**: 2025-11-10 23:00 - 23:48

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**: 
```
// GET /api/questions/random - Get random question by difficulty (required) and topics (optional)
// Query params: ?difficulty=Easy&topics=Arrays,Strings (topics can be comma-separated)
router.get('/random', verifyToken, QuestionController.getRandomQuestion);

topics is required, but can have more than one
```

**Output Summary**:
AI generated implementation for:
1. MongoDB aggregation pipeline using `$match` and `$sample` to get random questions
2. Query parameter parsing to handle comma-separated topics
3. Redis caching logic for random questions
4. Error handling for missing difficulty/topics parameters

**Action Taken**: ✅ Modified
- Reviewed the aggregation pipeline logic
- Tested the endpoint with multiple topics
- Validated caching behavior
- Added validation for both difficulty and topics as required fields

**Author Notes**:
- Changed topics from optional to required based on project requirements
- Verified MongoDB query performance with explain()
- Tested with various topic combinations
- All functionality tested and working correctly

**Files Affected**:
- `backend/question-service/src/controllers/question-controller.js`
- `backend/question-service/src/routes/question-routes.js`

**Commit**: `79c9a13` - "Update question endpoint to allow multiple topics"

**Level of AI Contribution**: Moderate (50%) - AI provided implementation structure, author added validation and testing

---

## Entry 2: Debugging JWT Token Issues

**Date/Time**: 2025-11-11 00:30 - 01:00

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**:
```
my test account
email: kjtest@test.com
password: SecurePassword1!

[Error output showing failed token retrieval]
```

**Output Summary**:
AI provided:
1. Shell script to extract JWT token from HTTP-only cookies
2. Updated test script with proper authentication headers
3. Debugging steps for token extraction from Set-Cookie header

**Action Taken**: ✅ Modified
- Reviewed and executed the token extraction script
- Validated JWT token format
- Tested authentication with the question service

**Author Notes**:
- Identified issue: JWT was in HTTP-only cookie, not response body
- Used curl to properly extract token from Set-Cookie header
- Verified token works with question service endpoints
- Added error handling for authentication failures

**Files Affected**:
- Test scripts (temporary, not committed)

**Level of AI Contribution**: Minimal (30%) - AI suggested debugging approach, author executed and validated

---

## Entry 3: Matching Service Topics Parameter Fix

**Date/Time**: 2025-11-11 20:00 - 21:53

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**:
```
@docker-compose why is it that when i queue up for collab, it says unable to find a match
[Docker logs showing 400 error from question-service]
```

**Output Summary**:
AI identified:
1. Matching service was using singular `topic` parameter instead of plural `topics`
2. Question service expects `topics` (plural) after recent changes
3. Provided fix to update matching service request parameters

**Action Taken**: ✅ Accepted with modifications
- Updated matching service to join topics array into comma-separated string
- Changed request parameter from `topic` to `topics`
- Tested matching flow end-to-end

**Author Notes**:
- Root cause: Parameter name mismatch between services
- Updated `fetchQuestionId` function to use `topicsParam`
- Verified matching service can successfully fetch questions
- Tested with multiple difficulty/topic combinations

**Files Affected**:
- `backend/matching-service/src/app.js`

**Commit**: `3964ec0` - "Update matching service to use shared topics"

**Level of AI Contribution**: Moderate (40%) - AI diagnosed issue, author implemented and tested fix

---

## Entry 4: Function Signature Implementation

**Date/Time**: 2025-11-11 14:00 - 18:00

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**:
```
what error is this?
Error: solution() takes 1 positional argument but 2 were given

```

**Output Summary**:
AI proposed comprehensive solution:
1. Implemented starter code generation for Python, JavaScript, Java, and C++
2. Updated code executor to dynamically construct complex types (ListNode, TreeNode)
3. Modified all 48 seed questions to include function signatures

**Action Taken**: ✅ Modified and Extended
- Reviewed function signature schema design
- Validated parameter type definitions
- Tested starter code generation for all languages
- Updated seed data with proper function signatures for all questions

**Author Notes**:
- Major refactoring to support generic test case execution
- Added support for complex types (ListNode with cycle detection)
- Generated language-specific starter code templates
- Validated code execution works for Python and JavaScript
- Java and C++ marked as compilation-only (needs future work)
- All changes tested with linked list cycle detection problem

**Files Affected**:
- `backend/question-service/src/controllers/question-controller.js`
- `backend/question-service/src/scripts/seed-questions.js`
- `backend/collaboration-service/utils/codeExecutor.js`
- `backend/collaboration-service/utils/socketHandlers.js`
- `backend/collaboration-service/models/SessionManager.js`

**Commit**: `4d12c07` - "Fix test case error and generate sample code"

**Level of AI Contribution**: Significant (70%) - AI designed schema and implementation, author validated and tested extensively

---

## Entry 5: Frontend TypeScript Error Fixes

**Date/Time**: 2025-11-11 15:00 - 17:00

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**:
```
[Docker build errors showing TypeScript @typescript-eslint/no-explicit-any errors]
[Error: 'input' is possibly 'undefined']
[Error: Uncaught TypeError: o.split is not a function]
```

**Output Summary**:
AI identified and fixed:
1. Replaced `any` types with `unknown` for test case parameters
2. Added null-safe checks for undefined input/expectedOutput
3. Fixed array-to-string conversion in edit question page
4. Fixed starterCode object access with type assertions

**Action Taken**: ✅ Accepted with validation
- Applied TypeScript type fixes
- Added proper null checks
- Tested frontend builds successfully
- Verified edit/add question pages work correctly

**Author Notes**:
- Fixed all TypeScript strict mode violations
- Added defensive programming with null checks
- Tested Docker build pipeline passes
- Validated functionality in browser after deployment

**Files Affected**:
- `frontend/src/services/question.service.ts`
- `frontend/src/app/(main)/session/page.tsx`
- `frontend/src/app/admin/questions/add/page.tsx`
- `frontend/src/app/admin/questions/edit/page.tsx`
- `frontend/src/app/(main)/waitingroom/page.tsx`

**Commit**: `2eb6efc` - "fix: prettier styles"

**Level of AI Contribution**: Moderate (50%) - AI identified issues and provided fixes, author tested and validated

---

## Entry 6: Prettier Formatting Fixes

**Date/Time**: 2025-11-10 23:49

**Tool**: Claude 3.5 Sonnet (via Cursor)

**Prompt/Command**:
```
Run npm run format:check
[Error output showing 3 files with style issues]
```

**Output Summary**:
AI suggested running Prettier with `--write` flag to auto-fix formatting issues

**Action Taken**: ✅ Accepted
- Ran `npm run format` to fix all formatting issues
- Verified all files pass format checks

**Author Notes**:
- Simple formatting fix following project style guide
- No logic changes, only whitespace/formatting
- All files now comply with Prettier rules

**Files Affected**:
- `backend/question-service/src/controllers/question-controller.js`
- `backend/question-service/src/models/question-model.js`
- `backend/question-service/src/scripts/seed-questions.js`

**Commit**: `b27dea8` - "Fix linters"

**Level of AI Contribution**: Minimal (20%) - AI suggested command, author executed

---

## Verification Statement

I, Johannsen Lum, declare that:
1. All AI usage documented above is accurate and complete
2. All AI-generated code has been reviewed, understood, and tested by me
3. No AI tools were used for requirements, architecture, or design decisions
4. I remain fully accountable for all code in this project
5. All AI contributions are properly attributed in this log

**Date**: 2025-11-11



