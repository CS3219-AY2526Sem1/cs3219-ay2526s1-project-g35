# CI/CD Pipeline - Quick Start Guide

## 🚀 What's Been Set Up

Your project now has a complete CI/CD pipeline with GitHub Actions! Here's what's included:

### Workflows Created

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Runs on every PR and push to `develop`, `master`, or `main`
   - Checks code formatting
   - Runs tests for all services
   - Builds Docker images
   - Takes ~10-15 minutes

2. **`.github/workflows/cd.yml`** - Continuous Deployment
   - Runs on pushes to `master`/`main` branches
   - Builds and pushes images to GitHub Container Registry
   - Security scanning with Trivy
   - Deploys to staging (develop branch)
   - Deploys to production (master/main)
   - Automatic rollback on failure

3. **`.github/workflows/integration-test.yml`** - Integration Tests
   - Starts all services with docker-compose
   - Verifies service health
   - Tests inter-service communication

4. **`.github/workflows/deploy-k8s.yml`** - Kubernetes Deployment
   - Deploys to Kubernetes cluster
   - Updates image tags
   - Applies manifests
   - Monitors rollout

5. **`.github/workflows/dependency-update.yml`** - Automated Updates
   - Runs weekly (Sundays)
   - Updates npm dependencies
   - Creates PRs for review

## 📋 Quick Setup (5 minutes)

### Step 1: Enable GitHub Actions

Already done! GitHub Actions are enabled by default.

### Step 2: Verify Workflows

Go to: `https://github.com/<your-org>/<your-repo>/actions`

You should see:
- CI Pipeline
- CD Pipeline
- Integration Tests
- Deploy to Kubernetes
- Dependency Update

### Step 3: Test the Pipeline

```bash
# Create a test branch
git checkout -b test/ci-setup

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-setup

# Create a Pull Request
# The CI pipeline will run automatically
```

### Step 4: Configure Secrets (Optional)

If you want to deploy to Kubernetes, add secrets:

1. Go to: `Settings > Secrets and variables > Actions`
2. Add required secrets (see `docs/CI-CD-SETUP.md`)

### Step 5: Set Up Environments (Optional)

1. Go to: `Settings > Environments`
2. Create:
   - `staging` - for staging deployments
   - `production` - for production deployments

## 🎯 How to Use

### For Development

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   # Open PR on GitHub
   ```

4. **CI runs automatically:**
   - ✓ Code formatting check
   - ✓ Unit tests
   - ✓ Docker builds
   - ✓ Integration tests

5. **Merge when CI passes:**
   - Review CI results
   - Get approvals
   - Merge to `develop` or `master`

### For Deployment

#### Deploy to Staging

```bash
# Merge to develop branch
git checkout develop
git merge feature/my-feature
git push origin develop

# CD pipeline deploys to staging
```

#### Deploy to Production

```bash
# Merge to master/main
git checkout master
git merge develop
git push origin master

# Or tag a release
git tag v1.0.0
git push origin v1.0.0

# CD pipeline deploys to production
```

### Manual Deployment

1. Go to: `Actions` tab
2. Select `Deploy to Kubernetes`
3. Click `Run workflow`
4. Select environment
5. Click `Run workflow`

## 📊 Pipeline Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Pull Request                          │
└───────────────────┬───────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                     CI Pipeline                          │
│  ├─ Lint & Format Check                                 │
│  ├─ Unit Tests (all services)                           │
│  ├─ Build Docker Images                                 │
│  └─ Integration Tests                                   │
└───────────────────┬───────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│            Merge to develop/master                      │
└───────────────────┬───────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                     CD Pipeline                          │
│  ├─ Build & Push Images                                 │
│  ├─ Security Scanning                                   │
│  ├─ Deploy to Staging (develop)                         │
│  └─ Deploy to Production (master)                       │
└───────────────────┬───────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│              Deploy to Kubernetes                        │
│  ├─ Update Manifests                                    │
│  ├─ Apply to Cluster                                    │
│  ├─ Wait for Rollout                                    │
│  ├─ Health Checks                                       │
│  └─ Rollback on Failure                                 │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Customization

### Change Test Commands

Edit each service's `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:integration": "jest --integration"
  }
}
```

### Add New Service

1. Add to CI workflow matrix
2. Add to CD workflow
3. Update docker-compose.yml
4. Create Dockerfile

See `docs/CI-CD-SETUP.md` for details.

### Environment Variables

Edit workflow files:

```yaml
env:
  NODE_VERSION: '20'  # Change Node version
  REGISTRY: ghcr.io   # Change registry
```

## 📈 Monitoring

### View Pipeline Status

1. Go to `Actions` tab
2. See workflow runs
3. Click to view details
4. Check job logs

### Status Badges

Add to README.md:

```markdown
![CI](https://github.com/owner/repo/workflows/CI/badge.svg)
![CD](https://github.com/owner/repo/workflows/CD/badge.svg)
```

### Notifications

Configure in GitHub:
1. Settings > Notifications > Actions
2. Choose your preferences

## 🐛 Troubleshooting

### CI Failing?

1. Check the workflow run logs
2. Look for specific job failures
3. Run locally: `npm test`

### Deployment Failed?

1. Check deployment logs
2. Verify secrets are set
3. Review Kubernetes manifests

### Need Help?

1. Check `docs/CI-CD-SETUP.md`
2. Review workflow files
3. Ask team members

## ✨ Next Steps

1. ✅ **Review the workflows** - Understand what each does
2. ✅ **Test the pipeline** - Create a test PR
3. ✅ **Configure secrets** - If deploying to K8s
4. ✅ **Set up environments** - staging and production
5. ✅ **Monitor first deployment** - Check logs and health

## 📚 Additional Resources

- [Detailed Setup Guide](docs/CI-CD-SETUP.md)
- [Workflow Documentation](.github/workflows/README.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Project README](README.md)

## 🎉 You're All Set!

Your CI/CD pipeline is ready to use. Just push code and watch it deploy automatically!

---

**Questions?** Check the documentation or ask the team.

