# CS3219 Project (PeerPrep) - AY2526S1
## Group: G35

### Note: 
- You are required to develop individual microservices within separate folders within this repository.
- The teaching team should be given access to the repositories as we may require viewing the history of the repository in case of any disputes or disagreements. 

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

## CI/CD Pipeline

This project includes a complete CI/CD pipeline with GitHub Actions.

### Quick Start

1. **View the pipeline**: Go to the [Actions](https://github.com/your-org/your-repo/actions) tab
2. **Test locally**: Run `npm test` in each service directory
3. **Read the guide**: See [CI-CD-QUICK-START.md](CI-CD-QUICK-START.md)
4. **Detailed docs**: See [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md)

### What's Included

- ✅ **CI Pipeline** - Automatic testing and code quality checks on every PR
- ✅ **CD Pipeline** - Automated deployment to production
- ✅ **Integration Tests** - Full system testing with docker-compose
- ✅ **Kubernetes Deployment** - Deploy to K8s clusters
- ✅ **Security Scanning** - Vulnerability scanning with Trivy
- ✅ **Dependency Updates** - Automated npm dependency updates

### Workflow Status

The pipeline runs automatically on:
- Pull requests to `master`, `main`, or `develop`
- Pushes to `master` or `main` branches
- Version tags (e.g., `v1.0.0`)

See [.github/workflows/](.github/workflows/) for workflow definitions.