# Analytics Service

PeerPrep's analytics microservice aggregates platform metrics for the administrator dashboard. It records site visits, tracks downtime automatically, and exposes time-series data used by the frontend Chart.js graphs on `/admin/home`.

## Features

- REST API secured with JWT (reuse the user-service secret).
- MongoDB persistence for visit events and downtime windows.
- Time-range bucketing for **past week**, **past month**, **past year**, or a **selected month**.
- Background uptime monitor that polls critical services and creates downtime events automatically.
- Admin-only endpoints for fetching aggregated statistics consumed by the dashboard.

## Project Structure

```
backend/analytics-service/
├── Dockerfile
├── package.json
├── .env.sample
├── .env.docker
└── src/
    ├── config/
    │   └── database.js          # Mongo connection helper (Mongoose)
    ├── controllers/
    │   ├── adminAnalyticsController.js
    │   └── analyticsController.js
    ├── middleware/
    │   ├── errorHandler.js
    │   └── jwtAuth.js
    ├── models/
    │   ├── DowntimeEvent.js
    │   └── SiteVisitEvent.js
    ├── routes/
    │   └── analytics.routes.js
    ├── services/
    │   ├── downtimeService.js   # Aggregation + uptime helpers
    │   └── siteVisitService.js
    ├── utils/
    │   └── timeRange.js         # Range parsing + bucket generation
    ├── workers/
    │   └── uptimeMonitor.js     # Cron-based monitor
    ├── index.js                 # Express app wiring
    └── server.js                # Bootstrap + graceful shutdown
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `8005`). |
| `MONGODB_URI` | MongoDB connection string. Must include credentials for production (Atlas). |
| `JWT_SECRET` | Must match `JWT_SECRET` from user-service to validate access tokens locally. |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (`http://localhost:3000`, `http://frontend:3000`). |
| `ENABLE_UPTIME_MONITOR` | Set to `true` to run the cron-based monitor. |
| `UPTIME_POLL_INTERVAL_CRON` | Cron expression for polling cadence (default `*/1 * * * *`). |
| `MONITORED_SERVICES` | Comma-separated `serviceName|url` entries for uptime checks. |
| `SERVICE_HEALTH_TIMEOUT_MS` | Timeout (ms) for each health probe. |

`.env.sample` contains sane defaults for local development, while `.env.docker` aligns with the compose stack (including the bundled MongoDB container).

## Running Locally (without Docker)

1. Copy `.env.sample` to `.env` and set `MONGODB_URI` (e.g. `mongodb://localhost:27017/peerprep_analytics`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the service in watch mode:
   ```bash
   npm run dev
   ```
4. The API will be available at `http://localhost:8005` with a `/health` probe for readiness checks.

## Running via Docker Compose

`docker-compose.yml` already includes `analytics-service` and a `mongo:7` container (`analytics-mongodb`). To start everything:

```bash
docker compose up --build
```

The analytics service depends on:
- `analytics-mongodb` (persistent volume `analytics_mongodb_data`).
- `user-service` (for JWT validation and authentication flow).

## API Overview

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/analytics/visits` | Authenticated user | Record a site visit (`visitType`, `path`, optional metadata). |
| `POST` | `/analytics/downtime/start` | Admin | Manually open a downtime window for a service. |
| `POST` | `/analytics/downtime/recover` | Admin | Close the active downtime window for a service. |
| `GET` | `/analytics/admin/visits?range=week|month|year|custom&month=YYYY-MM` | Admin | Fetch visit counts per bucket plus totals. |
| `GET` | `/analytics/admin/downtime?range=...` | Admin | Fetch downtime minutes per bucket with per-service breakdown. |

All time-series responses include:
- `startDate` / `endDate`
- `buckets[]` (`label`, `value`, `raw`)
- `total` (visits) or `totalMinutes` (downtime)

## Automatic Downtime Tracking

When `ENABLE_UPTIME_MONITOR=true`, the cron worker (`workers/uptimeMonitor.js`) reads `MONITORED_SERVICES` and probes each `/health` endpoint at the specified cadence. Transitions from **up → down** create a `DowntimeEvent`; transitions from **down → up** close the event and compute duration. Aggregations clamp partial overlaps to the selected time window so the admin dashboard can safely request arbitrary ranges.

## MongoDB Atlas Setup Guide (Step-by-Step)

The analytics store uses MongoDB. If you prefer a managed instance on MongoDB Atlas, follow these steps (no prior MongoDB knowledge assumed):

1. **Create an Atlas account**
   - Visit <https://www.mongodb.com/cloud/atlas/register> and sign up (the free M0 tier is sufficient).
2. **Create a new project**
   - Name it (e.g. `PeerPrep Analytics`) and continue to the cluster creation wizard.
3. **Provision a cluster**
   - Choose the *Shared* tier (M0), select a cloud provider/region close to your deployment, and create the cluster.
4. **Create a database user**
   - In *Database Access*, add a new user with `Read and write to any database` role.
   - Save the autogenerated username/password (or define your own strong credentials).
5. **Allow network access**
   - In *Network Access*, add your IP address (`Add Current IP`) for local development.
   - For Docker deployments on the same machine, also whitelist `0.0.0.0/0` (or configure VPC peering for production).
6. **Grab the connection string**
   - Once the cluster is ready, click *Connect → Drivers* and copy the `mongodb+srv://...` URI.
   - Replace `<username>` / `<password>` with the credentials you created.
7. **Configure the service**
   - Update `backend/analytics-service/.env` or `.env.docker`:
     ```bash
     MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/peerprep_analytics?retryWrites=true&w=majority
     ```
   - Ensure `JWT_SECRET` matches the user-service secret so JWT validation succeeds.
8. **Run migrations (optional)**
   - Collections are created automatically by Mongoose when the service inserts the first event; no extra migration step is required.
9. **Verify connectivity**
   - Start the analytics service and monitor the logs for `✓ Connected to MongoDB for analytics-service`.
   - Use the admin dashboard to generate sample site visits; confirm documents appear under the `peerprep_analytics` database in Atlas.

To switch between local MongoDB and Atlas, only the `MONGODB_URI` and `MONITORED_SERVICES` values need updating. The Docker compose file defaults to the local container, while production can mount environment variables through your deployment platform.

## Integration Notes

- Frontend uses `NEXT_PUBLIC_ANALYTICS_SERVICE_URL` (`http://localhost:8005` locally, `http://analytics-service:8005` in Docker) and includes the same authentication cookies as other services.
- Admin dashboard fetches data via `fetchVisitSeries` and `fetchDowntimeSeries` on range changes. Custom month selection expects the format `YYYY-MM` (validated server-side).
- Site visits are recorded automatically when `/home` or `/admin/home` render, ensuring both admin and standard usage count towards metrics.

## Testing

- Add Jest/unit tests for the services by stubbing Mongoose models if deeper validation is required.
- For manual verification, seed the database with a few visit events and use the admin dashboard toggles to confirm bucket calculations, particularly across range boundaries.

## Next Steps

- Add authentication/authorization middleware at the API gateway (if present) to centralise access control.
- Extend uptime monitoring to emit notifications (Slack/webhook) when downtime crosses a threshold.
- Consider aggregating visit metrics by user segment (admin vs standard) via additional fields in `SiteVisitEvent` if future reporting needs become more granular.
