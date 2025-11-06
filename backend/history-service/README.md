# History Service

A microservice for tracking user question attempts in the PeerPrep application. Built with Node.js, Express.js, and PostgreSQL with JWT authentication.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Testing](#testing)

## Features

- ✅ Track user question attempts with timestamp
- ✅ Retrieve user-specific history with authentication
- ✅ Admin statistics by category, difficulty, and user
- ✅ JWT-based authentication with user service integration
- ✅ Request validation using Joi schemas
- ✅ Role-based access control (user vs admin)
- ✅ PostgreSQL database with Sequelize ORM
- ✅ Swagger/OpenAPI documentation
- ✅ Docker support
- ✅ Health check endpoints
- ✅ Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL 14
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## Architecture

```
history-service/
├── config/
│   ├── database.js          # PostgreSQL connection configuration
│   ├── secretManager.js     # Secret management
│   └── swagger.js           # API documentation configuration
├── controllers/
│   └── historyController.js # Request handlers
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   ├── jwtAuth.js           # JWT authentication middleware
│   └── validation.js        # Request validation schemas
├── models/
│   └── History.js           # Sequelize model for history
├── routes/
│   └── historyRoutes.js     # API route definitions
├── services/
│   └── historyService.js    # Business logic layer
├── src/
│   ├── index.js             # Express app setup
│   └── server.js            # Server startup with DB initialization
├── test/
│   └── history.test.js      # Integration tests
├── .env                     # Environment variables
├── Dockerfile               # Container definition
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- User service running on port 8000 (for authentication)
- Docker (optional)

### Local Development

1. **Install dependencies**

```bash
cd backend/history-service
npm install
```

2. **Configure environment variables**

Create a `.env` file:

```bash
PORT=8004
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=historydb
DB_USER=postgres
DB_PASSWORD=your-password

JWT_SECRET=your-jwt-secret-key
USER_SERVICE_URL=http://localhost:8000

LOG_LEVEL=info
```

3. **Set up the database**

```sql
CREATE DATABASE historydb;
```

Run the schema (automatically applied on startup, or manually):

```bash
psql -h localhost -U postgres -d historydb -f schema.sql
```

4. **Start the service**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

5. **Verify it's running**

```bash
curl http://localhost:8004/health
```

### Docker Setup

Using docker-compose (recommended):

```bash
# From project root
docker-compose up -d history-service
```

The service will be available at `http://localhost:8004`

## Database Schema

### `histories` Table

| Column          | Type                      | Description                        |
| --------------- | ------------------------- | ---------------------------------- |
| id              | UUID                      | Primary key (auto-generated)       |
| user_id         | VARCHAR(255)              | User ID from user service          |
| question_title  | VARCHAR(500)              | Title of the attempted question    |
| difficulty      | VARCHAR(10)               | Question difficulty (Easy/Medium/Hard) |
| category        | VARCHAR(100)              | Question category/topic            |
| created_at      | TIMESTAMP                 | When the attempt was made          |

**Indexes:**
- `idx_user_id` - Fast lookups by user
- `idx_difficulty` - Filter by difficulty
- `idx_category` - Filter by category
- `idx_created_at` - Sort by time
- `idx_user_created` - Composite index for user history queries

## API Endpoints

### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "message": "History Service is running",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "uptime": 123.45
}
```

---

### 2. Create History Entry

Record a new question attempt.

**Endpoint:** `POST /history`

**Authentication:** None

**Request Body:**
```json
{
  "user_id": "68f089685ff31e0413f85bf8",
  "question_title": "Two Sum",
  "difficulty": "Easy",
  "category": "Arrays"
}
```

**Required Fields:**
- `user_id` (string, 1-255 chars) - User ID from user service
- `question_title` (string, 1-500 chars) - Question title
- `difficulty` (string) - Must be "Easy", "Medium", or "Hard"
- `category` (string, 1-255 chars) - Question category

**Success Response (201):**
```json
{
  "success": true,
  "message": "History entry created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "68f089685ff31e0413f85bf8",
    "question_title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays",
    "created_at": "2025-11-06T10:30:00.000Z"
  }
}
```

**Error Response (400 - Validation Failed):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "difficulty",
      "message": "Difficulty must be Easy, Medium, or Hard"
    }
  ]
}
```

---

### 3. Get User History

Retrieve question attempt history for a specific user.

**Endpoint:** `GET /history`

**Authentication:** Required (JWT token via `accessToken` cookie or `Authorization: Bearer <token>` header)

**Authorization:** Users can only view their own history. Admins can view any user's history.

**Query Parameters:**
- `user_id` (required) - User ID to fetch history for
- `limit` (optional, default: 100, max: 1000) - Number of records to return
- `offset` (optional, default: 0) - Number of records to skip (for pagination)
- `difficulty` (optional) - Filter by difficulty ("Easy", "Medium", "Hard")
- `category` (optional) - Filter by category
- `from_date` (optional) - Filter from date (ISO 8601 format)
- `to_date` (optional) - Filter to date (ISO 8601 format)

**Example Request:**
```bash
# Using cookie authentication
curl "http://localhost:8004/history?user_id=68f089685ff31e0413f85bf8&limit=10&difficulty=Easy" \
  -H "Cookie: accessToken=your-jwt-token"

# Using Bearer token
curl "http://localhost:8004/history?user_id=68f089685ff31e0413f85bf8&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "totalCount": 15,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "68f089685ff31e0413f85bf8",
      "question_title": "Two Sum",
      "difficulty": "Easy",
## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Manual Testing

See `TEST-GUIDE.md` for detailed testing instructions and examples.

Quick test script:

```bash
cd backend/history-service
.\test-get-history.ps1
```

---

## Common Error Codes

| Code | Error | Cause |
|------|-------|-------|
| 400 | Validation failed | Invalid request body or query parameters |
| 401 | Access denied. No token provided | Missing JWT token |
| 401 | Invalid token | Token is malformed or signature is invalid |
| 401 | Token expired | JWT token has expired |
| 403 | Access denied. You can only view your own history | User trying to access another user's history |
| 500 | Server configuration error | Missing JWT_SECRET or database configuration |

---

## License

MIT License - see LICENSE file for details

### Authentication Notes

- **Cookie-based:** Send JWT token in `accessToken` cookie
- **Header-based:** Send JWT token in `Authorization: Bearer <token>` header
- Token must be obtained from the user service (port 8000)
- Token is verified with user service to get user details and admin status

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Deployment

### Docker

#### Build the Docker Image

```bash
docker build -t history-service:latest .
```

#### Run the Container with Local PostgreSQL

```bash
docker run -p 8004:8004 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=history_db \
  -e DB_USER=history_user \
  -e DB_PASSWORD=Password_Group35 \
  -e JWT_SECRET=your-jwt-secret \
  history-service:latest
```

#### Run with Google Cloud SQL

```bash
docker run -p 8004:8004 \
  -e USE_SECRET_MANAGER=true \
  -e GCP_PROJECT_ID=your-project-id \
  history-service:latest
```

### Docker Compose (Recommended for Local Development)

The project includes a `docker-compose.yml` at the root that runs all services together.

#### Build and Start All Services

```bash
# From the project root directory
docker compose up --build
```

#### Start Only History Service with Dependencies

```bash
docker compose up history-service history-postgres
```

#### View Logs

```bash
# All services
docker compose logs -f

# History service only
docker compose logs -f history-service

# PostgreSQL only
docker compose logs -f history-postgres
```

#### Stop All Services

```bash
docker compose down
```

#### Stop and Remove Volumes (Clean Start)

```bash
docker compose down -v
```

### Docker Compose Configuration

The `docker-compose.yml` includes:

**History Service**
- Runs on port `8004`
- Uses `.env.docker` for configuration
- Automatically connects to `history-postgres` container
- Health checks enabled
- Auto-restarts on failure

**PostgreSQL Container**
- PostgreSQL 14 Alpine image
- Runs on port `5432`
- Automatic schema initialization via `schema.sql`
- Persistent data volume: `history_postgres_data`
- Health checks enabled
- Credentials from environment variables

### Environment Files

#### `.env.docker` (Production - Uses Google Secret Manager)

```bash
# Server Configuration
PORT=8004
NODE_ENV=production

# Google Cloud Configuration (Use Secret Manager for credentials)
GCP_PROJECT_ID=peerprep-475911
USE_SECRET_MANAGER=true

# JWT Configuration (fetched from Secret Manager: user-service-jwt-secret)
# DB credentials fetched from Secret Manager: history-service-db-connection-string

# Logging
LOG_LEVEL=info
```

**Required:** Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable before running:

```powershell
# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\gcp-key.json"

# Then start the service
docker compose up -d history-service
```

#### `.env` (Local Development - Direct Connection)

For local development without Secret Manager:

```bash
# Server Configuration
PORT=8004
NODE_ENV=production

# Google Cloud Configuration
GCP_PROJECT_ID=peerprep-475911
USE_SECRET_MANAGER=true

# JWT Configuration (fetched from Secret Manager)
# DB credentials fetched from Secret Manager

# Logging
LOG_LEVEL=info
```

### Kubernetes

See the `k8s/` directory in the repository root for Kubernetes deployment manifests.

## Security Best Practices

1. **Never commit secrets**: Use Google Secret Manager for all sensitive data
2. **JWT tokens**: Ensure JWT_SECRET is strong and rotated regularly
3. **Database credentials**: Store in Secret Manager, use SSL for connections
4. **Input validation**: All inputs are validated before database operations
5. **Rate limiting**: Consider adding rate limiting for production
6. **CORS**: Configure CORS_ORIGIN appropriately for your frontend

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists
- For Cloud SQL, verify IAM permissions

### Secret Manager Issues

- Verify `GCP_PROJECT_ID` is correct
- Check service account has `secretmanager.secretAccessor` role
- Ensure secrets exist in Secret Manager

### Authentication Issues

- Verify `JWT_SECRET` matches the user service
- Check token expiration
- Ensure cookies are being sent with requests

## License

MIT License - see LICENSE file for details
