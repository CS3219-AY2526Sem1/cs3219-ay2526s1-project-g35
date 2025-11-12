# CS3219 Project (PeerPrep) - AY2526S1
## Group: G35

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

## Project Structure

```
project-root/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js 14 app router pages
│   │   ├── components/      # React components (UI, Monaco editor)
│   │   ├── contexts/        # React contexts (auth, theme)
│   │   ├── services/        # API service clients
│   │   └── types/           # TypeScript type definitions
│   └── public/              # Static assets
├── backend/
│   ├── user-service/        # User authentication & management (Port 8000)
│   │   ├── controller/      # Request handlers
│   │   ├── model/           # MongoDB user model
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # JWT auth, validation
│   │   └── services/        # Business logic (OTP, email)
│   ├── question-service/    # Question repository management (Port 8001)
│   │   ├── src/
│   │   │   ├── controllers/ # Request handlers with Redis caching
│   │   │   ├── models/      # Mongoose question schema
│   │   │   ├── routes/      # API routes with JWT protection
│   │   │   ├── middleware/  # Local JWT validation
│   │   │   ├── utils/       # Cache service utilities
│   │   │   └── config/      # Database & Redis configuration
│   │   └── test/            # 47 passing tests with mocked Redis
│   ├── collaboration-service/ # Real-time code collaboration (Port 8002)
│   │   ├── src/
│   │   │   ├── sessionManager.js      # Session state management
│   │   │   ├── socketHandlers.js      # WebSocket event handlers
│   │   │   ├── serviceIntegration.js  # HTTP calls to other services
│   │   │   └── server.js              # Socket.io server setup
│   │   ├── middleware/      # WebSocket authentication
│   │   └── config/          # Service URLs and constants
│   ├── matching-service/    # User matching logic (Port 8003)
│   │   ├── src/
│   │   │   ├── matching/    # Queue and pairing algorithms
│   │   │   ├── websocket/   # Real-time notifications
│   │   │   └── config/      # Redis configuration
│   │   └── test/            # Unit and integration tests
│   ├── history-service/     # Session & attempt tracking (Port 8004)
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Sequelize PostgreSQL models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── config/          # Database & secret manager config
│   │   └── gcp-service-account-key.json/ # Google Cloud credentials
│   └── analytics-service/   # Platform analytics & monitoring (Port 8005)
│       ├── src/
│       │   ├── controllers/ # Admin analytics endpoints
│       │   ├── models/      # MongoDB visit & downtime models
│       │   ├── services/    # Aggregation & uptime helpers
│       │   ├── workers/     # Cron-based uptime monitor (5 min interval)
│       │   └── utils/       # Time range parsing
│       └── .env.docker      # Production environment config
├── k8s/                     # Kubernetes deployment configs
│   ├── deployments/         # Service deployments
│   ├── services/            # Service definitions
│   ├── configmaps/          # Environment configurations
│   ├── ingress/             # Ingress rules
│   └── redis/               # Redis StatefulSets
└── docker-compose.yml       # Local development orchestration
```

## Services Overview

### Frontend (Next.js)
- **Port**: 3000
- **Tech Stack**: Next.js 14, React, TypeScript, Tailwind CSS, Monaco Editor
- **Features**:
  - User authentication with email verification (OTP)
  - Profile management with JWT-based sessions
  - Question browsing with advanced filters (difficulty, topics, tags)
  - Real-time collaborative coding sessions with WebSocket integration
  - Multi-language code editor (JavaScript, Python, Java, C++)
  - Live cursor tracking and chat system
  - Admin dashboard for analytics and user management
  - Responsive design with dark mode support

### Backend Microservices

All microservices are containerized with Docker, health-checked, and orchestrated via `docker-compose.yml`. They communicate over a shared `peerprep-network` bridge network.

#### 1. User Service
- **Port**: 8000
- **Database**: MongoDB (Atlas)
- **Cache**: Redis (port 6379)
- **Features**:
  - User registration with email verification (OTP system)
  - JWT-based authentication with httpOnly cookies (15-min access, 7-day refresh tokens)
  - Redis token whitelisting for single-session enforcement
  - Role-based access control (admin/user privileges)
  - Password security with Argon2id hashing
  - Forgot password flow with OTP verification
  - Rate limiting on authentication endpoints (10 attempts per 15 min)
  - Profile management endpoints
  - Admin user management (promote/demote privileges)

#### 2. Question Service
- **Port**: 8001
- **Database**: MongoDB (Atlas)
- **Cache**: Redis (port 6380)
- **Features**:
  - CRUD operations for coding questions (admin-protected)
  - Rich metadata: test cases, constraints, function signatures, starter code
  - Advanced filtering by difficulty, topics, and tags
  - Full-text search across title and description
  - Random question selection for matching sessions (with exclusion support)
  - JWT authentication on all endpoints (local validation, no service calls)
  - Category and difficulty enumeration endpoints
  - Database seeding scripts for sample questions

#### 3. Collaboration Service
- **Port**: 8002
- **Tech**: Node.js, Socket.io, WebSocket, Redis (port 6382)
- **Features**:
  - Real-time code synchronization between paired users
  - Multi-language support (JavaScript, Python, Java, C++, Go, Rust, etc.)
  - Live cursor position tracking and typing indicators
  - In-session chat messaging with user presence
  - Session lifecycle management (create, join, leave, auto-cleanup)
  - Integration with Matching Service for pre-authorized sessions
  - Question data fetched from Question Service on session creation
  - Empty session auto-cleanup (5-minute idle timeout)
  - Health monitoring for service dependencies
  - WebSocket authentication middleware

#### 4. Matching Service
- **Port**: 8003
- **Database**: Redis (port 6381)
- **Features**:
  - User matching based on difficulty and topic preferences
  - Queue management with timeout handling (30-second default)
  - Session coordination with Collaboration Service
  - Real-time match notifications via WebSocket
  - Priority queue for efficient pairing
  - Match cancellation and queue removal
  - User state tracking (queued, matched, in-session)
  - Automatic cleanup of stale queue entries
  - Integration with User Service for authentication

#### 5. History Service
- **Port**: 8004
- **Database**: PostgreSQL (Google Cloud SQL)
- **Secret Management**: Google Cloud Secret Manager
- **Features**:
  - User question attempt tracking with timestamps
  - Session-based history (links to collaboration sessions via `session_id`)
  - Tracks question attempts, difficulty, topics, and completion status
  - Full CRUD operations for user history records
  - Integration with Collaboration Service to persist session outcomes
  - Google Cloud credentials via service account JSON
  - Sequelize ORM for database operations
  - Swagger API documentation at `/api-docs`
  - Health check endpoint for monitoring
  - Optimized queries with indexes on user_id and created_at

#### 6. Analytics Service
- **Port**: 8005
- **Database**: MongoDB (with dedicated `analytics-mongodb` container)
- **Features**:
  - Site visit tracking (page views, unique visitors, session duration)
  - Automated uptime monitoring for all microservices (5-minute polling interval)
  - Downtime event recording with start/recovery timestamps
  - Time-series data aggregation (past week, month, year, custom ranges)
  - Admin dashboard metrics with Chart.js integration
  - JWT-authenticated endpoints (admin-only access)
  - Background cron worker for health checks (`*/5 * * * *` schedule)
  - Per-service downtime breakdown and SLA calculations
  - Automatic downtime event creation on service health failures
  - MongoDB persistence for visit events and downtime windows
  - Graceful startup state reconciliation (checks for open downtime events)

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14 (App Router with React Server Components)
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Code Editor**: Monaco Editor (VS Code's editor engine)
- **Real-time**: Socket.io Client, native WebSocket API
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Cookie-based JWT (httpOnly, secure, SameSite)

### Backend Technologies
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js 4.x
- **Real-time**: Socket.io 4.x, WebSocket Protocol
- **API Standards**: RESTful APIs with JSON responses

### Database Layer
- **Document Store**: MongoDB Atlas (User, Question, Analytics Services)
- **Relational Database**: PostgreSQL on Google Cloud SQL (History Service)
- **In-Memory Cache**: Redis 7 (4 separate instances for isolation):
  - User Service Redis (port 6379): JWT token whitelisting
  - Question Service Redis (port 6380): Question & random selection caching
  - Matching Service Redis (port 6381): Queue state management
  - Collaboration Service Redis (port 6382): Active session tracking
- **ODM/ORM**: Mongoose (MongoDB), Sequelize (PostgreSQL)

### Security & Authentication
- **Authentication**: JWT (JSON Web Tokens) with local validation via shared secret
- **Token Storage**: httpOnly cookies with SameSite=strict protection
- **Password Hashing**: Argon2id (memory-hard algorithm)
- **OTP System**: 6-digit codes with 5-minute expiry, rate-limited (user registration & password reset)
- **Session Management**: Redis token whitelisting, single-session enforcement
- **CORS**: Configurable allowed origins with credentials support
- **Rate Limiting**: Express rate-limit middleware (10 attempts per 15 min on auth endpoints)
- **Secret Management**: Google Cloud Secret Manager (History Service database credentials)

### DevOps & Infrastructure
- **Containerization**: Docker 24+, Docker Compose 2.x
- **Orchestration**: Kubernetes (Google Kubernetes Engine)
- **Load Balancing**: NGINX Ingress Controller with session affinity
- **Auto-Scaling**: Horizontal Pod Autoscaler (CPU/memory-based)
- **Service Discovery**: Kubernetes DNS with internal service names
- **Health Checks**: HTTP `/health` endpoints on all services (30s interval)
- **Networking**: Docker bridge network (`peerprep-network`) for local dev

### Development & Testing
- **Testing Framework**: Jest with Supertest (47+ tests in question-service)
- **API Documentation**: Swagger/OpenAPI 3.0 (History Service at `/api-docs`)
- **API Testing**: Postman collections with environment configs
- **Code Quality**: ESLint (frontend), Prettier (all services)
- **Process Management**: Nodemon (development), PM2 (optional production)
- **Logging**: Morgan (HTTP request logging), custom Winston loggers

### Performance Optimization
- **Caching Strategy**: 
  - Redis caching with TTL-based invalidation
- **Database Optimization**:
  - MongoDB compound indexes on difficulty + topics
  - PostgreSQL indexes on user_id and created_at
  - Connection pooling via Mongoose and Sequelize
- **API Performance**:
  - Local JWT validation (<1ms) vs service-to-service calls (~45ms)
  - Zero network overhead for authentication

### Monitoring & Observability
- **Uptime Monitoring**: Automated cron worker polling every 5 minutes (Analytics Service)
- **Downtime Tracking**: Automatic event creation with start/recovery timestamps
- **Metrics Collection**: Site visits, session duration, service health status
- **Time-series Aggregation**: Past week/month/year analytics with bucket aggregation
- **Health Dashboards**: Admin analytics dashboard with Chart.js visualizations

### Background Processing
- **Cron Jobs**: Node-cron for scheduled tasks (uptime monitor, cleanup jobs)
- **Worker Processes**: Uptime monitor running on `*/5 * * * *` schedule
- **Queue Management**: Redis-based priority queues (Matching Service)
- **Session Cleanup**: Automatic removal of empty sessions after 5 minutes

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