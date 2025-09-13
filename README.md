# CS3219 PeerPrep - Microservices Architecture

A peer programming preparation platform built with microservices architecture.

## Project Structure

```
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service calls
│   │   ├── utils/             # Utility functions
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React contexts
│   │   └── assets/            # Static assets
│   ├── public/                # Public static files
│   └── config/                # Frontend configuration
├── backend/                    # Backend microservices
│   ├── UserService/           # User management microservice
│   ├── CollaborationService/  # Real-time collaboration microservice
│   ├── QuestionService/       # Question management microservice
│   └── MatchingService/       # User matching microservice
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

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your environment variables
3. Run `docker-compose up` to start all services
4. Access the frontend at `http://localhost:3000`

## Development

Each microservice can be developed and deployed independently. See individual service README files for specific setup instructions.