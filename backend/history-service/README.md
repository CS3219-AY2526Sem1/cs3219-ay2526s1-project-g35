# History Service

A microservice for tracking user question attempts in the PeerPrep application. Built with Node.js, Express.js, and PostgreSQL, with secure credential management via Google Secret Manager.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Google Cloud Setup](#google-cloud-setup)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- ✅ Track user question attempts with timestamp
- ✅ Session tracking for collaboration sessions
- ✅ Retrieve user-specific history
- ✅ Admin statistics by category, difficulty, and user
- ✅ JWT-based authentication
- ✅ Google Secret Manager integration for secure credential storage
- ✅ PostgreSQL database with Sequelize ORM
- ✅ Swagger/OpenAPI documentation
- ✅ Docker support
- ✅ Health check endpoints
- ✅ Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL (Google Cloud SQL)
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Secret Management**: Google Cloud Secret Manager
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## Architecture

```
history-service/
├── config/
│   ├── database.js          # PostgreSQL connection configuration
│   ├── secretManager.js     # Google Secret Manager integration
│   └── swagger.js           # API documentation configuration
├── controllers/
│   └── historyController.js # Request handlers
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── jwtAuth.js           # JWT authentication middleware
├── models/
│   └── History.js           # Sequelize model for history
├── routes/
│   └── historyRoutes.js     # API route definitions
├── src/
│   ├── index.js             # Express app setup
│   └── server.js            # Server startup with DB initialization
├── .env                     # Local environment variables
├── .env.docker              # Docker environment variables
├── Dockerfile               # Container definition
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Google Cloud Platform account (for production)
- Docker (optional, for containerization)

### Local Development Setup

1. **Clone the repository**

```bash
cd backend/history-service
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up PostgreSQL locally**

Create a PostgreSQL database:

```sql
CREATE DATABASE historydb;
```

4. **Configure environment variables**

Copy the `.env` file and update with your local configuration:

```bash
# .env
PORT=8004
NODE_ENV=development

# Google Cloud Configuration
GCP_PROJECT_ID=your-gcp-project-id
USE_SECRET_MANAGER=false

# PostgreSQL Configuration (local development)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=historydb
DB_USER=postgres
DB_PASSWORD=your-password
DB_DIALECT=postgres

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# Logging
LOG_LEVEL=info
```

5. **Run the service**

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

6. **Verify the service is running**

Open your browser or use curl:

```bash
curl http://localhost:8004/health
```

7. **Access API Documentation**

Navigate to: http://localhost:8004/api-docs

### Google Cloud Setup

#### 1. Create Cloud SQL PostgreSQL Instance

```bash
gcloud sql instances create peerprep-postgres \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1
```

#### 2. Create Database

```bash
gcloud sql databases create historydb \
  --instance=peerprep-postgres
```

#### 3. Create Secrets in Secret Manager

```bash
# PostgreSQL Connection String
echo -n "postgresql://username:password@host:5432/historydb?ssl=true" | \
  gcloud secrets create history-service-db-connection-string \
  --data-file=-

# JWT Secret
echo -n "your-jwt-secret-key" | \
  gcloud secrets create history-service-jwt-secret \
  --data-file=-
```

#### 4. Grant Service Account Access

```bash
# Allow the service account to access secrets
gcloud secrets add-iam-policy-binding history-service-db-connection-string \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding history-service-jwt-secret \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 5. Update Environment Variables for Production

Set `USE_SECRET_MANAGER=true` in your production environment:

```bash
# .env.docker or Kubernetes ConfigMap
USE_SECRET_MANAGER=true
GCP_PROJECT_ID=your-gcp-project-id
```

## API Documentation

### Swagger UI

Interactive API documentation is available at: http://localhost:8004/api-docs

### OpenAPI Spec

JSON specification: http://localhost:8004/api-docs.json

## Database Schema

### History Table

| Column         | Type                         | Description                         |
| -------------- | ---------------------------- | ----------------------------------- |
| id             | UUID                         | Primary key (auto-generated)        |
| user_id        | VARCHAR(255)                 | User ID from user service           |
| session_id     | VARCHAR(255)                 | Collaboration session ID            |
| question_title | VARCHAR(500)                 | Title of the attempted question     |
| difficulty     | ENUM('Easy','Medium','Hard') | Question difficulty level           |
| category       | VARCHAR(100)                 | Question category/topic             |
| created_at     | TIMESTAMP                    | When the attempt was made           |

**Indexes:**

- `idx_user_id` on `user_id`
- `idx_session_id` on `session_id`
- `idx_difficulty` on `difficulty`
- `idx_category` on `category`
- `idx_created_at` on `created_at`
- `idx_user_created` on `(user_id, created_at)`

## Environment Variables

| Variable             | Required | Default               | Description                                        |
| -------------------- | -------- | --------------------- | -------------------------------------------------- |
| PORT                 | No       | 8004                  | Port the service listens on                        |
| NODE_ENV             | No       | development           | Environment (development/production)               |
| GCP_PROJECT_ID       | Yes\*    | -                     | Google Cloud Project ID                            |
| USE_SECRET_MANAGER   | No       | false                 | Enable Google Secret Manager                       |
| DB_CONNECTION_STRING | Yes\*    | -                     | PostgreSQL connection string (from Secret Manager) |
| DB_HOST              | Yes\*\*  | localhost             | PostgreSQL host (local dev)                        |
| DB_PORT              | No       | 5432                  | PostgreSQL port (local dev)                        |
| DB_NAME              | Yes\*\*  | historydb             | Database name (local dev)                          |
| DB_USER              | Yes\*\*  | postgres              | Database user (local dev)                          |
| DB_PASSWORD          | Yes\*\*  | -                     | Database password (local dev)                      |
| JWT_SECRET           | Yes      | -                     | JWT secret for token verification                  |
| CORS_ORIGIN          | No       | http://localhost:3000 | Allowed CORS origin                                |

\* Required when `USE_SECRET_MANAGER=true`  
\*\* Required when `USE_SECRET_MANAGER=false` (local development)

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "message": "History Service is running",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "uptime": 123.45
}
```

### Create History Entry

```http
POST /history
Content-Type: application/json

{
  "user_id": "user123",
  "question_title": "Two Sum",
  "difficulty": "Easy",
  "category": "Arrays",
  "session_id": "session-abc-123"  // Optional: for collaboration tracking
}
```

**Response:**

```json
{
  "success": true,
  "message": "History entry created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user123",
    "session_id": "session-abc-123",
    "question_title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays",
    "created_at": "2025-11-05T10:30:00.000Z"
  }
}
```

**Note:** The `session_id` field is optional and can be used to track collaboration sessions. When users solve questions together, the same session ID can be used to link their attempts.

### Get User History

```http
GET /history?user_id=user123&limit=50&offset=0
```

**Response:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "user123",
      "session_id": "session-abc-123",
      "question_title": "Two Sum",
      "difficulty": "Easy",
      "category": "Arrays",
      "created_at": "2025-11-05T10:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

### Get Admin Statistics

```http
GET /admin/stats
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_attempts": 1234,
      "unique_users": 56
    },
    "by_category": [
      {
        "category": "Arrays",
        "attempt_count": 456,
        "unique_users": 32
      }
    ],
    "by_difficulty": [
      {
        "difficulty": "Easy",
        "attempt_count": 500,
        "unique_users": 40
      }
    ],
    "by_user": [
      {
        "user_id": "user123",
        "total_attempts": 45,
        "unique_categories": 8,
        "unique_difficulties": 3,
        "first_attempt": "2025-01-01T00:00:00.000Z",
        "last_attempt": "2025-11-05T10:30:00.000Z"
      }
    ]
  }
}
```

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

## Session ID Migration

If you're upgrading from a previous version without `session_id` support, see [SESSION-ID-MIGRATION.md](SESSION-ID-MIGRATION.md) for detailed migration instructions.

The migration adds:

- `session_id` column to the `histories` table
- Index on `session_id` for better query performance
- Updated API to accept optional `session_id` parameter

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
