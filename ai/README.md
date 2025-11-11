# AI Documentation Directory

This directory contains all AI usage documentation for CS3219 Project G35 - PeerPrep, in compliance with the AI Usage Policy (Appendix 3).

## 📁 Contents

### 1. `usage-log.md`
**Complete AI session log** with detailed entries for all AI-assisted work.

**Contains**:
- 7 detailed entries with timestamps
- Exact prompts/commands used
- AI output summaries
- Actions taken (Accepted/Modified/Rejected)
- Author notes on validation and testing
- Contribution level percentages
- Affected files and commit references

**Entry Categories**:
- Implementation: Random question endpoint, function signatures, code executor
- Debugging: JWT authentication, Docker builds, parameter mismatches
- Refactoring: Test case format migration
- Documentation: API usage guides

### 2. `compliance-checklist.md`
**Comprehensive compliance verification** against CS3219 AI Usage Policy.

**Contains**:
- ✅ Complete checklist of all policy requirements
- Usage statistics and contribution breakdown
- Verification that prohibited activities were avoided
- Quality assurance documentation
- Academic integrity declarations
- Ready-to-submit format

### 3. `README.md` (this file)
Overview and navigation guide for AI documentation.

---

## 🎯 Quick Reference

### What AI Was Used For (Allowed ✅)
1. **Implementation code** - Random endpoints, function signatures, code execution
2. **Debugging** - JWT tokens, Docker errors, TypeScript issues
3. **Refactoring** - Test case format, starter code templates
4. **Documentation** - API guides, code comments

### What AI Was NOT Used For (Prohibited ❌)
1. ❌ Requirements gathering or prioritization
2. ❌ Architecture design decisions
3. ❌ System design patterns
4. ❌ Technology stack selection
5. ❌ Performance/security trade-offs
6. ❌ Component boundaries

---

## 📊 Statistics Summary

- **Total AI Sessions**: 7
- **Date Range**: 2025-11-10 to 2025-11-11
- **Primary Tool**: Claude 3.5 Sonnet (via Cursor)
- **Commits with AI**: 4
  - `79c9a13` - Update question endpoint to allow multiple topics
  - `b27dea8` - Fix linters
  - `4d12c07` - Fix test case error and generate sample code
  - `3964ec0` - Update matching service to use shared topics

### Contribution Levels
- Minimal (< 30%): 29%
- Moderate (30-60%): 57%
- Significant (60-80%): 14%
- Complete (> 80%): 0%

---

## 📝 File Attributions

All files with significant AI contribution have header comments. See:

1. **`backend/question-service/src/models/question-model.js`**
   - Function signature schema and starter code generation

2. **`backend/question-service/src/controllers/question-controller.js`**
   - Random question endpoint implementation

3. **`backend/collaboration-service/utils/codeExecutor.js`**
   - Dynamic code execution with parameter construction

4. **`backend/matching-service/src/app.js`**
   - Topics parameter fix for question fetching

---

## ✅ Compliance Status

**FULLY COMPLIANT** with CS3219 AI Usage Policy (Appendix 3)

All requirements met:
- [x] Requirements and architecture created without AI
- [x] AI used only for allowed activities
- [x] All AI-influenced files have header attributions
- [x] README includes project-level AI use summary
- [x] Prompts and outputs archived in usage-log.md
- [x] All AI outputs reviewed, tested, and verified

---

## 📖 How to Use This Documentation

### For Team Members
1. Review `usage-log.md` to understand what AI assistance was used
2. Check file headers for specific AI contributions in code files
3. Ensure you understand all AI-assisted code before committing

### For Instructors/TAs
1. See `compliance-checklist.md` for comprehensive policy verification
2. Review `usage-log.md` for detailed session-by-session documentation
3. Check main `README.md` for project-level AI summary
4. Verify file headers in the 4 attributed files

### For Submission
Include with your project:
1. This entire `/ai/` directory
2. Updated `README.md` with AI Use Summary section
3. All 4 files with header attributions

---

## 🔍 Verification Evidence

### Testing Performed
- ✅ Random endpoint tested with multiple topics and difficulties
- ✅ JWT authentication validated end-to-end
- ✅ Matching service tested with question fetching
- ✅ Function signatures tested with code execution
- ✅ Frontend builds verified in Docker
- ✅ TypeScript type safety validated
- ✅ Prettier formatting compliance checked

### Code Understanding
- ✅ All team members can explain AI-assisted components
- ✅ Modifications made based on project requirements
- ✅ Additional features added beyond AI suggestions
- ✅ Architecture decisions remained team-driven

---

## 📞 Contact

**Team**: CS3219-AY2526Sem1-G35  
**Primary Author of AI Documentation**: Johannsen Lum  
**Course**: CS3219 Software Engineering Principles and Patterns  
**Semester**: AY2526 Semester 1

For questions about AI usage, refer to:
1. `usage-log.md` for specific sessions
2. `compliance-checklist.md` for policy compliance
3. Main project `README.md` for summary

---

**Last Updated**: 2025-11-11  
**Status**: Ready for Submission ✅

