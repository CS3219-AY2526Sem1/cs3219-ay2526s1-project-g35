# AI Usage Log

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

**Action Taken**: Modified
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

**Action Taken**: Modified
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

**Action Taken**: Accepted with modifications
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

**Action Taken**: Modified and Extended
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

## Entry 7: Frontend Admin Question Pages Implementation

**Date/Time**: 2025-11-09 23:17

**Tool**: ChatGPT

**Author**: Arren11111 (Chin Cherng Yuen)

**Prompt/Command**:
```
[Requested help implementing add question and edit question admin pages in Next.js/React/TypeScript]
[Asked for form handling, state management, API integration patterns]
```

**Output Summary**:
ChatGPT provided:
1. Complete React component structure for add/edit question forms
2. Form validation logic with error handling
3. State management patterns using React hooks (useState, useEffect, useMemo)
4. API integration with axios for question service
5. UI components using shadcn/ui (Card, Button, DropdownMenu, Popover)
6. Test case management with dynamic add/remove functionality
7. Multi-value input handling for topics and tags

**Action Taken**: Modified and Extended
- Reviewed component structure and adapted to project requirements
- Integrated with existing question service API
- Added custom validation rules
- Styled components to match project design system
- Tested form submission and error handling

**Author Notes**:
- Component structure follows Next.js App Router patterns
- Form validation ensures data integrity before submission
- Error handling provides user-friendly feedback
- Test case management allows dynamic addition/removal
- All functionality tested in browser

**Files Affected**:
- `frontend/src/app/admin/questions/add/page.tsx`
- `frontend/src/app/admin/questions/edit/page.tsx`
- `frontend/src/services/question.service.ts`

**Commits**: 
- `06c7b63` - "Implement add question function into frontend"
- `83a8df1` - "implement edit question function in frontend (#90)"

**Level of AI Contribution**: Moderate (60%) - ChatGPT provided component structure and patterns, author integrated with project and tested

---

## Entry 8: Frontend User Management Admin Page

**Date/Time**: 2025-11-11 12:56

**Tool**: ChatGPT

**Author**: Chin Cherng Yuen

**Prompt/Command**:
```
[Requested help implementing user management admin interface]
[Asked for pagination, search, filtering, and user editing functionality]
```

**Output Summary**:
ChatGPT provided:
1. User list page with pagination and search functionality
2. Role-based filtering (admin/user/all)
3. User edit page with form validation
4. API integration for user CRUD operations
5. Error handling and loading states
6. Responsive table layout with sorting capabilities

**Action Taken**: Modified and Extended
- Integrated with user service API endpoints
- Added pagination logic with page state management
- Implemented search debouncing for better UX
- Added role filtering dropdown
- Styled components to match admin design system
- Tested all CRUD operations

**Author Notes**:
- Pagination handles large user lists efficiently
- Search functionality filters users in real-time
- Role filtering allows admin to view specific user types
- Edit page validates input before submission
- All operations tested with backend integration

**Files Affected**:
- `frontend/src/app/admin/accounts/page.tsx`
- `frontend/src/app/admin/accounts/edit/page.tsx`
- `frontend/src/services/user.service.ts`
- `backend/user-service/controller/user-controller.js`
- `backend/user-service/model/user-model.js`
- `backend/user-service/model/user-repository.js`

**Commit**: `e6a25fa` - "Implement user management admin (#97)"

**Level of AI Contribution**: Moderate (55%) - ChatGPT provided UI patterns and component structure, author integrated with backend and tested

---

## Entry 9: User Service Authentication and OTP Implementation

**Date/Time**: 2025-10-28 to 2025-11-09

**Tool**: Perplexity AI

**Author**: Kaidama97

**Prompt/Command**:
```
[Researched best practices for JWT authentication, OTP email verification, password reset flows]
[Asked about Argon2 password hashing, Redis token management, cookie-based authentication]
[Requested implementation patterns for secure authentication systems]
```

**Output Summary**:
Perplexity provided:
1. Research on JWT token management with Redis whitelisting
2. OTP (One-Time Password) implementation patterns
3. Argon2id password hashing configuration
4. Cookie-based authentication security best practices
5. Password reset flow with OTP verification
6. Email service integration patterns
7. Rate limiting strategies for authentication endpoints

**Action Taken**: Modified and Implemented
- Researched authentication patterns and security best practices
- Implemented JWT with Redis token whitelisting
- Created OTP system with 6-digit codes and 5-minute expiry
- Configured Argon2id with appropriate memory/time costs
- Implemented password reset flow with OTP verification
- Added rate limiting for authentication attempts
- Integrated email service for OTP delivery

**Author Notes**:
- JWT tokens stored in Redis for revocation capability
- OTP system includes cooldown periods to prevent abuse
- Password hashing uses industry-standard Argon2id
- Cookie-based authentication provides httpOnly security
- All authentication flows tested end-to-end
- Security best practices followed throughout

**Files Affected**:
- `backend/user-service/controller/auth-controller.js`
- `backend/user-service/controller/user-controller.js`
- `backend/user-service/services/auth-service.js`
- `backend/user-service/services/registration-service.js`
- `backend/user-service/services/token-service.js`
- `backend/user-service/routes/auth-routes.js`
- `backend/user-service/routes/user-routes.js`

**Commits**:
- `e095c67` - "feat: implement forgot password with OTP verification"
- `11979b9` - "feat(history-service): add authentication, validation, and simplified schema"
- Multiple commits for authentication features

**Level of AI Contribution**: Moderate (40%) - Perplexity provided patterns, author implemented and validated security practices

---

## Entry 10: History Service Initial Setup

**Date/Time**: 2025-11-06 16:42

**Tool**: ChatGPT / Perplexity AI

**Author**: Kaidama97

**Prompt/Command**:
```
[Requested help setting up Express.js service with PostgreSQL/Sequelize]
[Researched Sequelize best practices and Google Secret Manager integration]
```

**Output Summary**:
AI provided:
1. Express.js server setup with middleware configuration
2. Google Secret Manager integration for credentials
3. Swagger/OpenAPI documentation setup
4. Jest testing framework configuration

**Action Taken**: Modified and Extended
- Set up complete Express.js service structureg
- Integrated Google Secret Manager for production
- Set up testing framework
- Created comprehensive README documentation

**Author Notes**:
- Authentication integrated with user service JWT
- Secret Manager integration allows secure credential management
- Error handling provides meaningful error messages
- API documentation helps with integration
- All endpoints tested with Postman

**Files Affected**:
- `backend/history-service/src/index.js`
- `backend/history-service/src/server.js`
- `backend/history-service/models/History.js`
- `backend/history-service/controllers/historyController.js`
- `backend/history-service/routes/historyRoutes.js`
- `backend/history-service/config/secretManager.js`
- `backend/history-service/middleware/jwtAuth.js`
- `backend/history-service/middleware/errorHandler.js`
- `backend/history-service/README.md`

**Commits**:
- `074643b` - "feat(history-service): initial Node.js Express setup with PostgreSQL integration"
- `11979b9` - "feat(history-service): add authentication, validation, and simplified schema"
- `4a75182` - "feat(history-service): add session tracking with session_id field"

**Level of AI Contribution**: Significant (40%) - AI provided complete service structure and patterns, author customized and integrated with project

---

## Entry 11: C++ Code Executor Implementation

**Date/Time**: 2025-11-11 11:27

**Tool**: ChatGPT / Claude 

**Author**: Basil

**Prompt/Command**:
```
[Requested help implementing C++ code execution for collaboration service]
[Asked for C++ compilation and execution patterns, test case integration, error handling]
```

**Output Summary**:
AI provided:
1. C++ code wrapping with test execution framework
2. Compilation command structure using g++
3. Test case integration patterns
4. Error handling for compilation and runtime errors
5. Output parsing for test results
6. Timeout handling for long-running code

**Action Taken**: Modified and Extended
- Implemented executeCpp method with compilation and execution
- Added C++ code wrapping with test framework structure
- Created proper error handling for compilation failures
- Added timeout protection for code execution
- Integrated with existing code executor infrastructure
- Tested with various C++ code samples

**Author Notes**:
- C++ execution requires compilation step before running
- Proper error messages help users debug compilation issues
- Timeout prevents infinite loops or long-running code
- Test framework structure allows future expansion
- All compilation and execution tested with sample code
- Note: Full dynamic execution still needs JSON parsing library

**Files Affected**:
- `backend/collaboration-service/utils/codeExecutor.js`

**Commit**: `32e5d4b` - "fix: c++"

**Level of AI Contribution**: Moderate (60%) - AI provided C++ execution patterns and compilation structure, author implemented and tested

---

## Entry 12: History Service Integration

**Date/Time**: 2025-11-10 18:38

**Tool**: ChatGPT / Claude 

**Author**: Basil

**Prompt/Command**:
```
[Requested help integrating history service with collaboration service]
[Asked for service-to-service communication patterns, session tracking, API integration]
```

**Output Summary**:
AI provided:
1. Service integration utility for HTTP requests between services
2. Session completion tracking and history record creation
3. API endpoint integration patterns
4. Error handling for service communication failures
5. Frontend history service integration

**Action Taken**: Modified and Extended
- Created serviceIntegration utility for inter-service communication
- Integrated history record creation on session completion
- Added validation for history data before submission
- Updated frontend to fetch and display history records
- Added error handling for service communication failures
- Tested end-to-end history tracking flow

**Author Notes**:
- History service integration allows tracking user attempts
- Service-to-service communication uses HTTP with proper error handling
- Session completion triggers history record creation
- Frontend displays user attempt history with pagination
- All integration points tested with real sessions
- Error handling ensures collaboration service continues if history service fails

**Files Affected**:
- `backend/collaboration-service/utils/serviceIntegration.js`
- `backend/collaboration-service/models/SessionManager.js`
- `backend/history-service/controllers/historyController.js`
- `backend/history-service/services/historyService.js`
- `backend/history-service/routes/historyRoutes.js`
- `frontend/src/services/history.service.ts`
- `frontend/src/app/(main)/history/page.tsx`

**Commit**: `ec9cea7` - "feat: integrate history service"

**Level of AI Contribution**: Moderate (50%) - AI provided integration patterns, author implemented and tested service communication

---

## Entry 13: JWT Integration for Matching and Collaboration Services

**Date/Time**: 2025-11-08 20:21

**Tool**: ChatGPT / Claude 

**Author**: Basil

**Prompt/Command**:
```
[Requested help passing JWT tokens to matching and collaboration services]
[Asked for service-to-service authentication patterns, token forwarding, WebSocket authentication]
```

**Output Summary**:
AI provided:
1. Service integration utility for authenticated requests
2. JWT token extraction and forwarding patterns
3. WebSocket authentication with JWT tokens
4. Token validation in service endpoints
5. Error handling for authentication failures

**Action Taken**: Modified and Extended
- Created serviceIntegration utility with JWT support
- Implemented token extraction from cookies/headers
- Added JWT forwarding to matching and collaboration services
- Updated WebSocket connections to include authentication
- Added token validation in service endpoints
- Tested authentication flow end-to-end

**Author Notes**:
- JWT tokens enable secure service-to-service communication
- Token forwarding ensures user context is maintained
- WebSocket authentication validates users before allowing connections
- Error handling provides clear feedback for authentication failures
- All authentication flows tested with valid and invalid tokens
- Integration ensures seamless user experience across services

**Files Affected**:
- `backend/collaboration-service/utils/serviceIntegration.js`
- `backend/matching-service/src/app.js`
- `frontend/src/app/(main)/session/page.tsx`
- `docker-compose.yml`

**Commit**: `5070475` - "fix: pass jwt to matching and collab service"

**Level of AI Contribution**: Moderate (45%) - AI provided authentication patterns, author implemented and integrated with services

---

## Entry 14: Fix Multi-Device Queueing Bug

**Date/Time**: 2025-10-30 12:40

**Tool**: ChatGPT / Claude

**Author**: Wong Zenwei (zeotheburrito)

**Prompt/Command**:
```
[Requested help fixing bug where users could queue on multiple devices simultaneously]
[Asked for WebSocket connection tracking, duplicate queue prevention, session management patterns]
```

**Output Summary**:
AI provided:
1. WebSocket connection tracking to identify duplicate user sessions
2. Logic to prevent users from joining queue if already queued
3. Frontend session storage management for user identification
4. Backend validation to check if user is already in queue
5. Error handling for duplicate queue attempts
6. User notification messages for queue status

**Action Taken**: Modified and Extended
- Implemented duplicate queue detection in matching service
- Added user session tracking in frontend
- Created validation logic to prevent multiple queue entries
- Added user-friendly error messages for duplicate attempts
- Integrated with existing WebSocket connection handling
- Tested with multiple browser tabs and devices

**Author Notes**:
- Bug fix prevents users from queuing multiple times simultaneously
- Session storage used to track user identity across page refreshes
- Backend validates queue status before allowing new queue entry
- Error messages inform users if they're already in queue
- All edge cases tested (multiple tabs, different devices, page refreshes)
- Fix ensures fair matching by preventing duplicate queue entries

**Files Affected**:
- `backend/matching-service/src/app.js`
- `frontend/src/app/(main)/waitingroom/page.tsx`

**Commit**: `ca7ad69` - "Fix bug and add features to prevent users from queueing on multiple devices"

**Level of AI Contribution**: Moderate (50%) - AI provided connection tracking patterns and validation logic, author implemented and tested bug fix

---
