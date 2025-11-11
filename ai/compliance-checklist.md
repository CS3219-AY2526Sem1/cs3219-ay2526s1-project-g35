# AI Usage Compliance Checklist

## CS3219 AY2526S1 - Team Project
**Team**: G35  
**Date**: 2025-11-11  
**Submitted by**: Johannsen Lum

---

## ✅ Quick Checklist (Appendix 3 Requirements)

### Phase Compliance
- [x] **Requirements and architecture created without AI**
  - ✅ All requirements defined by team members
  - ✅ System architecture (microservices) designed by team
  - ✅ Technology stack decisions made by team (MongoDB, Redis, PostgreSQL, Docker, Next.js)
  - ✅ Component boundaries and interfaces designed by team
  
- [x] **AI used only for implementation/debugging/refactoring/docs**
  - ✅ Implementation code: Random question endpoint, function signatures, code executor
  - ✅ Debugging: JWT authentication, Docker builds, TypeScript errors, code execution
  - ✅ Refactoring: Test case format migration, starter code generation
  - ✅ Documentation: API usage guide
  - ❌ Architecture decisions: None (all done by team)
  - ❌ Design patterns: None (all done by team)
  - ❌ Requirements prioritization: None (all done by team)

### Attribution & Documentation
- [x] **All AI-influenced files have header attributions**
  - ✅ `backend/question-service/src/models/question-model.js`
  - ✅ `backend/question-service/src/controllers/question-controller.js`
  - ✅ `backend/collaboration-service/utils/codeExecutor.js`
  - ✅ `backend/matching-service/src/app.js`
  
- [x] **README/report includes the project-level AI use summary**
  - ✅ AI Use Summary section added to README.md
  - ✅ Tools listed (Claude 3.5 Sonnet via Cursor)
  - ✅ Allowed uses documented
  - ✅ Prohibited phases confirmed avoided
  
- [x] **Prompts and key outputs archived in /ai/usage-log.md**
  - ✅ 7 detailed entries with timestamps
  - ✅ All prompts/commands documented
  - ✅ Output summaries included
  - ✅ Actions taken specified (Accepted/Modified/Rejected)
  - ✅ Author notes with validation details
  
- [x] **All AI outputs reviewed, tested, and verified by the authors**
  - ✅ Random endpoint tested with multiple topics
  - ✅ JWT authentication debugged and validated
  - ✅ Matching service fix tested end-to-end
  - ✅ Function signatures tested with code execution
  - ✅ Frontend TypeScript fixes tested in Docker builds
  - ✅ All code reviewed for correctness and security

---

## 📊 AI Usage Summary

### Tools Used
- **Primary**: Claude 3.5 Sonnet (via Cursor AI)
- **Version**: Latest model as of November 2025
- **Usage Period**: 2025-11-10 to 2025-11-11

### Usage Statistics
- **Total Sessions**: 7
- **Total Commits with AI Assistance**: 4
  - `79c9a13` - Update question endpoint to allow multiple topics
  - `b27dea8` - Fix linters
  - `4d12c07` - Fix test case error and generate sample code
  - `3964ec0` - Update matching service to use shared topics

### Contribution Levels
- **Minimal (< 30%)**: 2 sessions (29%)
- **Moderate (30-60%)**: 4 sessions (57%)
- **Significant (60-80%)**: 1 session (14%)
- **Complete (> 80%)**: 0 sessions (0%)

### Activity Breakdown
| Activity Type | Sessions | Percentage |
|--------------|----------|------------|
| Implementation | 4 | 57% |
| Debugging | 2 | 29% |
| Documentation | 1 | 14% |
| Refactoring | Included in implementation | - |

---

## 🚫 Prohibited Activities - Verification

### What We DID NOT Use AI For:
- ❌ **Requirements gathering or prioritization**: All requirements came from project specifications and team discussions
- ❌ **Sprint planning or backlog management**: Team managed sprints independently
- ❌ **Architecture decisions**: Microservices architecture designed by team
- ❌ **Component boundaries**: Service separation decided by team
- ❌ **Design patterns**: Patterns (MVC, Repository) chosen by team
- ❌ **Data schema design**: MongoDB schemas designed by team
- ❌ **Technology selection**: Stack chosen by team (Node.js, React, MongoDB, etc.)
- ❌ **Performance trade-offs**: Caching strategy (Redis) decided by team
- ❌ **Security decisions**: JWT authentication, rate limiting designed by team
- ❌ **Interface definitions**: API contracts defined by team

### Evidence of Team-Led Design:
1. **Architecture Document**: Microservices design predates AI usage
2. **API Specifications**: RESTful endpoints defined in project requirements
3. **Database Schemas**: Mongoose models designed before AI implementation
4. **Design Decisions**: All documented in team meetings and project documents

---

## 📝 File Attributions

### Files with AI Assistance Headers
All files with significant AI contribution include header attribution:

```javascript
/*
 * AI Assistance Disclosure:
 * Tool: Claude 3.5 Sonnet (via Cursor), Date: 2025-11-10 to 2025-11-11
 * Scope: [Specific description]
 * Author review: Code reviewed, tested, and validated by Johannsen Lum
 */
```

**Attributed Files**:
1. `backend/question-service/src/models/question-model.js`
   - Function signature schema and starter code generation
2. `backend/question-service/src/controllers/question-controller.js`
   - Random question endpoint implementation
3. `backend/collaboration-service/utils/codeExecutor.js`
   - Dynamic code execution with parameter construction
4. `backend/matching-service/src/app.js`
   - Topics parameter fix for question fetching

---

## 🔍 Quality Assurance

### Code Review Process
- ✅ All AI-generated code reviewed line-by-line by author
- ✅ Logic and algorithms validated against requirements
- ✅ Edge cases identified and tested
- ✅ Security implications considered (input validation, error handling)
- ✅ Performance characteristics evaluated (database queries, caching)

### Testing Verification
- ✅ Unit tests written for critical functions
- ✅ Integration tests for API endpoints
- ✅ End-to-end testing in Docker environment
- ✅ Manual testing by team members
- ✅ Error scenarios validated

### Understanding Verification
- ✅ Author can explain all AI-generated algorithms
- ✅ Author made modifications based on understanding (not blind acceptance)
- ✅ Author added additional logic not suggested by AI
- ✅ Author identified and fixed AI errors/limitations

---

## 🔐 Academic Integrity

### Licensing Compliance
- ✅ No third-party code copied by AI
- ✅ All code is original implementation
- ✅ Dependencies use compatible licenses (MIT, Apache 2.0)
- ✅ No GPL violations in closed-source project

### Plagiarism Check
- ✅ AI-generated code is specific to our project requirements
- ✅ No generic code copied from public repositories
- ✅ All implementation details are project-specific
- ✅ Code structure reflects our unique architecture

### Team Accountability
- ✅ All team members aware of AI usage
- ✅ Shared understanding of AI-assisted components
- ✅ Each member can explain AI-influenced code
- ✅ Team agreement on AI usage norms maintained

---

## 📋 Submission Checklist

Before submitting the project, verify:

- [x] This compliance checklist completed
- [x] `/ai/usage-log.md` contains all AI sessions
- [x] README includes AI Use Summary section
- [x] All AI-influenced files have header attributions
- [x] No AI usage in requirements/architecture phases
- [x] All AI outputs tested and verified
- [x] Team members can explain all code
- [x] No licensing or plagiarism issues
- [x] Privacy maintained (no sensitive data shared with AI)

---

## 📞 Contact

For questions about AI usage in this project:

**Primary Contact**: Johannsen Lum  
**Team**: CS3219-AY2526Sem1-G35  
**Course**: CS3219 Software Engineering Principles and Patterns  
**Semester**: AY2526 Semester 1

---

## ✍️ Declaration

I/We, the undersigned, declare that:

1. All information in this checklist is accurate and complete
2. All AI usage has been properly documented and attributed
3. We understand and take full responsibility for all AI-assisted code
4. No AI tools were used for prohibited activities (requirements, architecture, design)
5. All AI outputs have been reviewed, tested, and verified by team members
6. We comply with all academic integrity policies of NUS and CS3219

**Signed**:  
- Johannsen Lum (Team Member)
- [Other team members to sign]

**Date**: 2025-11-11

---

**Status**: ✅ **FULLY COMPLIANT** with CS3219 AI Usage Policy (Appendix 3)

