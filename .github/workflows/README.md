# CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for the PeerPrep project. This document explains each workflow and how to use them.

## Workflows Overview

### 1. `ci.yml` - Continuous Integration Pipeline

**Triggers:** Pull requests and pushes to `master`, `main`, or `develop` branches

**Purpose:** Runs code quality checks, tests, and builds Docker images for all services.

**Jobs:**
- **lint-and-format**: Runs Prettier formatting checks across all services
- **test-user-service**: Runs tests for the user service
- **test-question-service**: Runs tests for the question service (includes MongoDB)
- **test-matching-service**: Runs tests for the matching service
- **test-collaboration-service**: Runs tests for the collaboration service
- **test-frontend**: Runs linting and builds the Next.js frontend
- **build-docker-images**: Builds Docker images for all services
- **ci-success**: Summary job that tracks overall pipeline status

**Usage:**
```bash
# The pipeline runs automatically on pull requests
git checkout -b feature/new-feature
git push origin feature/new-feature

# Create a pull request - CI will run automatically
```

### 2. `cd.yml` - Continuous Deployment Pipeline

**Triggers:** 
- Pushes to `master` or `main` branches
- Version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

**Purpose:** Builds Docker images, scans for vulnerabilities, and deploys to environments.

**Jobs:**
- **build-and-push**: Builds and pushes Docker images to GitHub Container Registry
- **security-scan**: Runs Trivy vulnerability scanner on built images
- **deploy-staging**: Deploys to staging environment (develop branch)
- **deploy-production**: Deploys to production environment
- **rollback**: Automatically rolls back on deployment failure
- **cleanup**: Cleans up old container images

**Usage:**
```bash
# Deploy to production
git push origin master

# Deploy specific version
git tag v1.0.0
git push origin v1.0.0

# Manual deployment via GitHub Actions UI
```

**Required Secrets:**
- `GITHUB_TOKEN` (automatically provided)

**Environment Variables (set in GitHub repository settings):**
- Configure staging and production environments
- Set deployment URLs

### 3. `integration-test.yml` - Integration Testing

**Triggers:** Pull requests and manual dispatch

**Purpose:** Runs comprehensive integration tests with docker-compose.

**Jobs:**
- **integration-tests**: Starts all services with docker-compose and verifies health
- **test-service-communication**: Tests inter-service communication

**Usage:**
```bash
# Runs automatically on pull requests
git push origin feature/new-feature

# Or trigger manually via GitHub Actions UI
```

### 4. `deploy-k8s.yml` - Kubernetes Deployment

**Triggers:**
- Pushes to `master` or `main` branches
- Version tags
- Manual dispatch with environment selection

**Purpose:** Deploys the application to a Kubernetes cluster.

**Jobs:**
- **deploy**: Deploys to specified environment (production or staging)

**Prerequisites:**
1. Set up Kubernetes cluster credentials
2. Configure kubectl in the workflow
3. Ensure proper permissions for GitHub Actions

**Required Secrets:**
- Kubernetes cluster credentials (varies by provider)
  - For GKE: Google Cloud credentials
  - For AKS: Azure service principal
  - For EKS: AWS credentials

**Usage:**
```bash
# Deploy via GitHub Actions UI (recommended)
# Or push to master/main branch

# Workflow will:
# 1. Update image tags in Kubernetes manifests
# 2. Apply manifests to cluster
# 3. Wait for rollout
# 4. Verify deployment health
# 5. Rollback on failure
```

### 5. `dependency-update.yml` - Automated Dependency Updates

**Triggers:**
- Weekly schedule (Sundays at 00:00 UTC)
- Manual dispatch

**Purpose:** Automatically updates dependencies and creates pull requests.

**Jobs:**
- **update-dependencies**: Updates npm dependencies and creates PRs

**Usage:**
```bash
# Automatic updates on schedule
# Or trigger manually via GitHub Actions UI
```

**Note:** Review and test PRs before merging.

## Setup Instructions

### 1. Repository Settings

Go to `Settings > Secrets and variables > Actions` and add:

- **GHCR_PACKAGE_SECRET**: Personal access token with `packages:write` permission
- **KUBERNETES_CREDENTIALS**: Kubernetes cluster credentials
- **DEPLOYMENT_URL**: Your deployment URL

### 2. Environment Configuration

Go to `Settings > Environments` and create:

- **staging**: For staging deployments
- **production**: For production deployments

Add protection rules as needed (required reviewers, etc.)

### 3. GitHub Container Registry (GHCR)

Images are published to:
```
ghcr.io/<owner>/peerprep-<service>:<tag>
```

To use images:
```bash
docker pull ghcr.io/<owner>/peerprep-user-service:latest

# For Kubernetes
kubectl set image deployment/user-service user-service=ghcr.io/<owner>/peerprep-user-service:latest
```

### 4. Kubernetes Configuration

Update `k8s/deployments/*.yaml` to reference your image registry:

```yaml
spec:
  template:
    spec:
      containers:
      - name: user-service
        image: ghcr.io/<owner>/peerprep-user-service:latest
```

### 5. Workflow Permissions

Ensure the repository has these permissions enabled:
- Settings > Actions > General > Workflow permissions: "Read and write permissions"

## Customization

### Adding New Services

1. Add service to matrix in `ci.yml`:
```yaml
service:
  - name: new-service
    path: backend/new-service
```

2. Add to `cd.yml` and other workflows similarly.

### Changing Test Commands

Update test commands in respective service `package.json` files.

### Custom Deployment Scripts

Add deployment steps in `cd.yml` or `deploy-k8s.yml`:

```yaml
- name: Custom deployment step
  run: |
    # Your deployment commands
```

## Monitoring and Troubleshooting

### Viewing Workflow Runs

Go to `Actions` tab in GitHub to view:
- Run history
- Job logs
- Artifacts

### Common Issues

**Issue: Tests failing**
- Check individual test logs
- Ensure test databases are properly configured
- Verify environment variables

**Issue: Docker builds failing**
- Check Dockerfile syntax
- Verify build context paths
- Check for dependency issues

**Issue: Deployment failing**
- Verify Kubernetes cluster access
- Check kubectl configuration
- Review service health endpoints

**Issue: Dependency updates not working**
- Check GitHub token permissions
- Verify branch protection rules
- Review automation restrictions

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review service-specific documentation
3. Contact the development team

## Best Practices

1. **Always review PRs** before merging
2. **Test locally** before pushing
3. **Keep dependencies updated** by reviewing automated PRs
4. **Monitor deployments** for any issues
5. **Use feature flags** for gradual rollouts
6. **Set up alerts** for deployment failures
7. **Review security scan results** regularly
8. **Keep secrets secure** and rotate regularly

## Workflow Dependencies

```
┌─────────────────┐
│  Pull Request   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ CI (ci) │
    └────┬────┘
         │
         ▼
    ┌────────────────┐
    │ Merge to main  │
    └────┬───────────┘
         │
         ▼
    ┌─────────┐      ┌─────────────────┐
    │ CD (cd) ├─────►│ Deploy to prod  │
    └─────────┘      └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Deploy K8s     │
└─────────────────┘
```

## Reference

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build and Push](https://github.com/docker/build-push-action)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

