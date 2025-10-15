# 🎨 Prettier Setup & GitHub Actions Guide

## Overview

This project now has consistent code formatting across all services using **Prettier**. GitHub Actions automatically check code style on every pull request and push.

## 📁 What Was Added

### For Each Service:
- ✅ `.prettierrc` - Prettier configuration
- ✅ `.prettierignore` - Files to ignore
- ✅ `package.json` - Added format scripts

### Services Configured:
1. ✅ `backend/user-service`
2. ✅ `backend/question-service`
3. ✅ `backend/collaboration-service`
4. ✅ `backend/matching-service`
5. ✅ `frontend`

### GitHub Actions:
- ✅ `.github/workflows/prettier-check.yml` - Main workflow (parallel checks)

## 🚀 Quick Start

### Format Code in Any Service

```bash
# Navigate to any service
cd backend/user-service
# or cd backend/question-service
# or cd frontend

# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

### Format All Services at Once

**PowerShell:**
```powershell
# Format all backend services
@('user-service', 'question-service', 'collaboration-service', 'matching-service') | ForEach-Object {
    Write-Host "Formatting $_..." -ForegroundColor Cyan
    Set-Location "backend\$_"
    npm run format
    Set-Location ..\..
}

# Format frontend
Set-Location frontend
npm run format
Set-Location ..
```

**Bash/Linux/Mac:**
```bash
# Format all services
for service in user-service question-service collaboration-service matching-service; do
    echo "Formatting $service..."
    cd "backend/$service"
    npm run format
    cd ../..
done

cd frontend && npm run format && cd ..
```

## 📋 Available Commands

In each service directory:

| Command | Description |
|---------|-------------|
| `npm run format` | Format all files (auto-fix) |
| `npm run format:check` | Check formatting (no changes) |

## 🤖 GitHub Actions Workflows

### Parallel Workflow

**File:** `.github/workflows/prettier-check.yml`

- ✅ Checks all services in parallel (faster)
- ✅ Creates GitHub checks for each service
- ✅ Comments on PR if checks fail
- ✅ Shows which service failed

**Triggers:**
- Pull requests to `master`, `main`, or `develop`
- Pushes to `master`, `main`, or `develop`



## 🔧 How GitHub Actions Work

### When Code is Pushed or PR is Created:

1. **GitHub Actions triggers** the workflow
2. **Checks out your code**
3. **Sets up Node.js** environment
4. **Installs Prettier** for each service
5. **Runs `prettier --check`** on all files
6. **Reports results**:
   - ✅ Green check if formatting is correct
   - ❌ Red X if formatting issues found
   - 💬 Comments on PR with instructions

### What Happens If Check Fails?

1. GitHub shows a ❌ failed check
2. PR cannot be merged (if branch protection enabled)
3. You get a comment explaining what to do
4. You run `npm run format` to fix
5. Commit and push the formatted code
6. GitHub re-runs the check automatically

## 📝 Workflow Details

### Prettier Check Workflow (prettier-check.yml)

```yaml
# Runs on: Pull Requests and Pushes to main branches
on:
  pull_request:
    branches: [master, main, develop]
  push:
    branches: [master, main, develop]

# Checks these services in parallel:
strategy:
  matrix:
    service:
      - backend/user-service
      - backend/question-service
      - backend/collaboration-service
      - backend/matching-service
      - frontend

# Steps for each service:
# 1. Checkout code
# 2. Setup Node.js
# 3. Install dependencies
# 4. Install Prettier
# 5. Run prettier --check
# 6. Comment on PR if failed
```

### Key Features:

**Matrix Strategy:** Runs checks in parallel for speed
```yaml
strategy:
  matrix:
    service: [service1, service2, ...]
```

**Caching:** Speeds up workflow with npm cache
```yaml
cache: 'npm'
cache-dependency-path: ${{ matrix.service }}/package-lock.json
```

**PR Comments:** Automatically comments when checks fail
```yaml
if: failure() && github.event_name == 'pull_request'
uses: actions/github-script@v7
```

## 🛠️ Customization

### Change Which Branches Trigger Checks

Edit `.github/workflows/prettier-check.yml`:

```yaml
on:
  pull_request:
    branches: [master, main, develop, feature/*]  # Add more branches
  push:
    branches: [master, main]  # Only check pushes to these
```

### Add More Services

Edit the matrix in `.github/workflows/prettier-check.yml`:

```yaml
strategy:
  matrix:
    service:
      - backend/user-service
      - backend/new-service  # Add here
      - frontend
```

### Skip Checks for Certain Files

Add to each service's `.prettierignore`:

```
# Skip test files
**/*.test.js
**/*.spec.js

# Skip generated files
src/generated/**
```

### Change Prettier Rules

Edit `.prettierrc` in each service:

```json
{
  "singleQuote": false,  // Use double quotes instead
  "printWidth": 80,      // Shorter lines
  "semi": false          // No semicolons
}
```

## 🔒 Branch Protection Rules

To **enforce** Prettier checks before merging:

1. Go to GitHub → Repository Settings
2. Navigate to **Branches**
3. Add a **branch protection rule** for `master` or `main`
4. Check: ✅ **Require status checks to pass before merging**
5. Search for: `Check Code Formatting` or `Prettier Check All Services`
6. Select the check
7. Save

Now PRs **cannot be merged** until Prettier checks pass!


## 📊 Example Workflow Run

### Successful Run:
```
✅ Check Code Formatting (backend/user-service)
✅ Check Code Formatting (backend/question-service)
✅ Check Code Formatting (backend/collaboration-service)
✅ Check Code Formatting (backend/matching-service)
✅ Check Code Formatting (frontend)
✅ Prettier Check Summary
```

### Failed Run:
```
✅ Check Code Formatting (backend/user-service)
❌ Check Code Formatting (backend/question-service)  ← Failed
✅ Check Code Formatting (backend/collaboration-service)
✅ Check Code Formatting (backend/matching-service)
✅ Check Code Formatting (frontend)
❌ Prettier Check Summary
```

## 🐛 Troubleshooting

### GitHub Action Fails but Local Check Passes

**Cause:** Different Prettier versions

**Solution:** 
```bash
# Install Prettier as dev dependency
cd backend/question-service
npm install --save-dev prettier

# Commit package.json changes
git add package.json package-lock.json
git commit -m "Add Prettier as dev dependency"
```

### "Prettier not found" Error

**Solution:**
```bash
# Install Prettier in the service
npm install --save-dev prettier
```

### Want to Ignore Certain Files

Add to `.prettierignore` in the service:
```
# Ignore specific files
src/legacy-code.js
config/old-config.js
```

### Workflow Takes Too Long

**Solution:** Use the simple workflow instead:
```yaml
# Disable prettier-check.yml
# Enable prettier-simple.yml
```

Or cache more aggressively:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

## 📚 Additional Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions - setup-node](https://github.com/actions/setup-node)

## 🎯 Best Practices

1. ✅ **Format before committing**
   ```bash
   npm run format
   ```

2. ✅ **Check formatting in CI/CD** (already done!)

3. ✅ **Use pre-commit hooks** for automatic checking

4. ✅ **Enable branch protection** to enforce checks

5. ✅ **Keep Prettier config consistent** across services

6. ✅ **Document style rules** in team guidelines

## 📈 Benefits

- ✅ **Consistent code style** across all services
- ✅ **Automatic enforcement** via GitHub Actions
- ✅ **Faster code reviews** (no style debates)
- ✅ **Fewer merge conflicts** (consistent formatting)
- ✅ **Professional codebase** appearance
- ✅ **Easy onboarding** for new developers

## 🎓 Team Workflow

### For Developers:

1. Write code normally
2. Before committing: `npm run format`
3. Commit and push
4. GitHub Actions checks automatically
5. If check fails:
   - Run `npm run format` in the failing service
   - Commit and push again
   - Check passes ✅

### For Code Reviewers:

1. Focus on **logic and functionality**
2. No need to review **code style** (Prettier handles it)
3. Look for the ✅ green check on GitHub
4. If ❌ red, ask author to run `npm run format`

## 🔄 Updating Prettier Config

To change the style rules:

1. Update `.prettierrc` in one service
2. Test: `npm run format`
3. If happy, copy to all services:
   ```powershell
   Copy-Item backend\user-service\.prettierrc backend\question-service\
   Copy-Item backend\user-service\.prettierrc backend\collaboration-service\
   Copy-Item backend\user-service\.prettierrc backend\matching-service\
   Copy-Item backend\user-service\.prettierrc frontend\
   ```
4. Format all services
5. Commit all changes together

---

**Result:** Your team now has automated, consistent code formatting with GitHub Actions enforcement! 🎉
