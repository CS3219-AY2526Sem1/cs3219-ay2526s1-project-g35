# CS3219 Project (PeerPrep) - AY2526S1
## Group: G35

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

## Project Structure

```
├── frontend/                    # Next.js frontend application
│   └── src/                     # App router, components, services, hooks, contexts
├── backend/                     # Backend microservices
│   ├── analytics-service/       # Admin metrics + downtime tracking (MongoDB)
│   ├── collaboration-service/   # Real-time collaboration (Redis + WebSockets)
│   ├── matching-service/        # Queue and pairing logic
│   ├── question-service/        # Question catalogue (MongoDB)
│   └── user-service/            # Authentication and profile management
├── docker-compose.yml         # Multi-service orchestration
└── .env.example              # Environment variables template
```

## Services

### UserService
- User registration and authentication
- Profile management
- User preferences and settings

### CollaborationService
- Real-time code collaboration
- WebSocket connections
- Session management

### QuestionService
- Question database management
- Question difficulty and categorization
- Question validation and updates

### MatchingService
- User matching algorithm
- Queue management
- Match notification system

### Analytics Service *(new)*
- Records site visits and aggregates metrics for the admin dashboard
- Tracks system downtime (manual + automated uptime monitor)
- Exposes admin-only endpoints consumed by the Chart.js graphs

## AI Use Summary

**Compliance Statement**: This project complies with CS3219 AI Usage Policy (Appendix 3). Requirements, architecture, and design decisions were made by the team without AI assistance.

**Tools Used**: Claude 3.5 Sonnet (via Cursor AI)

**Usage Period**: 2025-11-10 to 2025-11-11

### Prohibited Phases Avoided
- ✅ Requirements and architecture created by team without AI
- ✅ All design decisions and trade-offs made by team members
- ✅ System architecture (microservices) designed independently
- ✅ Technology stack and component boundaries decided by team

### Allowed Uses
AI tools were used only for implementation, debugging, and documentation:

1. **Implementation Code**
   - Random question endpoint with MongoDB aggregation and Redis caching
   - Function signature schema for dynamic code execution
   - Starter code template generation for multiple languages
   - Test case format migration from string-based to params/expected structure

2. **Debugging Assistance**
   - JWT authentication token extraction from HTTP-only cookies
   - Docker build TypeScript errors and type safety fixes
   - Service communication parameter mismatches
   - Code execution errors with complex data types

3. **Refactoring**
   - Code executor to support dynamic parameter construction
   - Test case format standardization across all 48 questions
   - Prettier formatting compliance

4. **Documentation**
   - API usage guide for adding questions with function signatures
   - Code comments and inline documentation

### Verification
- ✅ All AI outputs reviewed and tested by team members
- ✅ Code modified based on project-specific requirements
- ✅ Full understanding of all implemented functionality
- ✅ End-to-end testing performed on all AI-assisted features

**Detailed Documentation**: See `/ai/usage-log.md` for complete prompts, outputs, and verification notes.

**File Attributions**: AI-influenced files include header comments with specific attribution details.

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run `docker-compose up` to start all services
4. Access the frontend at `http://localhost:3000`

## Development

Each microservice can be developed and deployed independently. See individual service README files for specific setup instructions.