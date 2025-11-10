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

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run `docker-compose up` to start all services
4. Access the frontend at `http://localhost:3000`

## Development

Each microservice can be developed and deployed independently. See individual service README files for specific setup instructions.