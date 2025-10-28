# CI/CD Setup Guide for PeerPrep

This guide explains how to set up and use the CI/CD pipeline for the PeerPrep project.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Workflow Descriptions](#workflow-descriptions)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

The PeerPrep project uses GitHub Actions for CI/CD. The pipeline includes:

- ✅ Automated code quality checks (Prettier)
- ✅ Automated testing for all services
- ✅ Docker image building and publishing
- ✅ Security scanning (Trivy)
- ✅ Integration testing with docker-compose
- ✅ Automated deployment to Kubernetes
- ✅ Dependency updates
- ✅ Rollback capabilities

## Quick Start

### 1. Enable GitHub Actions

GitHub Actions are automatically enabled for public repositories. For private repositories:

1. Go to your repository
2. Navigate to `Settings > Actions > General`
3. Enable "Allow all actions and reusable workflows"

### 2. Create Required Secrets

Go to `Settings > Secrets and variables > Actions`:

#### GitHub Container Registry (GHCR)

The default token `GITHUB_TOKEN` is automatically provided and has necessary permissions.

#### Kubernetes Deployment (Optional)

If deploying to Kubernetes:

```
# For Google Kubernetes Engine (GKE)
GKE_KEY_FILE: <service-account-json>
GKE_CLUSTER_NAME: <cluster-name>
GKE_ZONE: <cluster-zone>

# For Azure Kubernetes Service (AKS)
AZURE_CLIENT_ID: <client-id>
AZURE_CLIENT_SECRET: <client-secret>
AZURE_SUBSCRIPTION_ID: <subscription-id>
AZURE_TENANT_ID: <tenant-id>
AKS_CLUSTER_NAME: <cluster-name>
AKS_RESOURCE_GROUP: <resource-group>

# For Amazon Elastic Kubernetes Service (EKS)
AWS_ACCESS_KEY_ID: <access-key>
AWS_SECRET_ACCESS_KEY: <secret-key>
AWS_REGION: <region>
EKS_CLUSTER_NAME: <cluster-name>
```

### 3. Set Environment Variables

Go to `Settings > Environments` and configure:

- **staging**: Add any staging-specific secrets
- **production**: Add any production-specific secrets and deployment URLs

### 4. Test the Pipeline

Create a test PR:

```bash
git checkout -b test/ci-pipeline
git commit --allow-empty -m "test: CI pipeline"
git push origin test/ci-pipeline
```

Check the Actions tab to verify everything runs successfully.

## Detailed Setup

### Workflow Files

The project includes the following workflow files in `.github/workflows/`:

| File | Purpose | Triggers |
|------|---------|----------|
| `ci.yml` | Continuous Integration | PRs, pushes |
| `cd.yml` | Continuous Deployment | main/master, tags |
| `integration-test.yml` | Integration tests | PRs |
| `deploy-k8s.yml` | K8s deployment | main/master, tags |
| `dependency-update.yml` | Dependency updates | Weekly, manual |

### Understanding Each Workflow

#### CI Pipeline (`ci.yml`)

Runs on every PR to ensure code quality:

1. **Lint and Format Check**: Validates code style
2. **Unit Tests**: Runs tests for each service
3. **Docker Build**: Builds Docker images
4. **Summary**: Reports overall status

**To run locally:**

```bash
cd backend/user-service
npm install
npm run format:check
npm test
```

#### CD Pipeline (`cd.yml`)

Deploys to production:

1. **Build Images**: Creates optimized Docker images
2. **Security Scan**: Scans for vulnerabilities
3. **Deploy**: Deploys to configured environment
4. **Health Check**: Verifies deployment
5. **Rollback**: Automatically on failure

#### Integration Tests (`integration-test.yml`)

Ensures services work together:

```bash
# Run locally
docker compose up -d
docker compose ps  # Check all services are healthy
docker compose down
```

#### Kubernetes Deployment (`deploy-k8s.yml`)

Deploys to a Kubernetes cluster:

1. Configures kubectl
2. Updates image tags
3. Applies manifests
4. Waits for rollout
5. Verifies health

#### Dependency Updates (`dependency-update.yml`)

Automatically keeps dependencies fresh:

- Runs every Sunday
- Updates npm packages
- Creates PRs for review

## Configuration

### Customizing Build Commands

Edit `package.json` in each service:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "format:check": "prettier --check .",
    "lint": "eslint ."
  }
}
```

### Customizing Docker Builds

Edit Dockerfiles:

- `backend/user-service/Dockerfile`
- `backend/question-service/Dockerfile`
- `backend/collaboration-service/Dockerfile`
- `backend/matching-service/Dockerfile`
- `frontend/Dockerfile`

### Customizing Kubernetes Deployment

Edit Kubernetes manifests in `k8s/`:

- `k8s/deployments/*.yaml`
- `k8s/services/*.yaml`
- `k8s/configmaps/*.yaml`

### Adding New Services

1. **Add to CI matrix:**

Edit `.github/workflows/ci.yml`:

```yaml
matrix:
  service:
    - name: new-service
      path: backend/new-service
```

2. **Add to CD pipeline:**

Edit `.github/workflows/cd.yml` similarly.

3. **Update docker-compose.yml:**

Add your new service configuration.

### Environment Variables

Configure in GitHub repository settings:

1. Go to `Settings > Secrets and variables > Actions`
2. Add secrets or variables
3. Reference in workflows: `${{ secrets.SECRET_NAME }}`

Common variables:

```yaml
env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_PREFIX: owner/peerprep
```

## Monitoring

### GitHub Actions Dashboard

Access at: `https://github.com/<owner>/<repo>/actions`

Features:
- Run history
- Job logs
- Artifacts
- Performance metrics

### Notifications

Configure in GitHub:

1. Settings > Notifications > Actions
2. Choose notification preferences

### Status Badges

Add to your README:

```markdown
![CI](https://github.com/<owner>/<repo>/workflows/CI/badge.svg)
![CD](https://github.com/<owner>/<repo>/workflows/CD/badge.svg)
```

### Third-Party Monitoring

Integrate with:
- Slack notifications
- Discord webhooks
- Email alerts
- PagerDuty

## Troubleshooting

### Common Issues

#### CI Tests Failing

**Problem:** Tests pass locally but fail in CI

**Solutions:**
- Check Node.js version matches
- Verify environment variables
- Check database connectivity
- Review test timeouts

```yaml
# Increase timeout in jest.config.js
testTimeout: 30000
```

#### Docker Build Failing

**Problem:** Image build times out

**Solutions:**
- Optimize Dockerfile layers
- Use build cache
- Remove unnecessary files

```dockerfile
# Use multi-stage builds
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
COPY --from=builder /app/dist ./dist
CMD ["node", "server.js"]
```

#### Deployment Failing

**Problem:** Services don't deploy

**Solutions:**
- Check Kubernetes credentials
- Verify cluster access
- Review resource limits
- Check pod logs: `kubectl logs -f <pod-name>`

#### Slow Pipeline

**Problem:** CI/CD takes too long

**Solutions:**
- Use matrix parallelization
- Cache dependencies
- Use buildx cache
- Reduce test scope

```yaml
# Cache dependencies
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### Debug Workflows

Enable debug logging:

1. Go to repository
2. Settings > Secrets > Actions
3. Add: `ACTIONS_STEP_DEBUG: true`
4. Add: `ACTIONS_RUNNER_DEBUG: true`

### Getting Help

1. Check workflow logs in GitHub
2. Review service-specific logs
3. Consult documentation
4. Contact team

## Best Practices

### For Development

1. **Test locally first**
2. **Create small, focused PRs**
3. **Write meaningful commit messages**
4. **Review CI results before requesting reviews**
5. **Fix linting issues early**

### For Deployment

1. **Deploy to staging first**
2. **Monitor deployments closely**
3. **Use feature flags for new features**
4. **Plan rollback procedures**
5. **Document breaking changes**

### For Security

1. **Review security scan results**
2. **Keep dependencies updated**
3. **Use least privilege**
4. **Rotate secrets regularly**
5. **Enable branch protection**

### For Performance

1. **Optimize Docker images**
2. **Use multi-stage builds**
3. **Cache aggressively**
4. **Parallelize jobs**
5. **Monitor resource usage**

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Project README](../README.md)

## Support

For issues or questions:
1. Check [existing issues](https://github.com/<owner>/<repo>/issues)
2. Create a new issue
3. Contact the development team

