#!/usr/bin/env pwsh
# Quick script to install Prettier in all services and format code

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Prettier Setup for All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    "backend\user-service",
    "backend\question-service",
    "backend\collaboration-service",
    "backend\matching-service",
    "frontend"
)

$action = Read-Host "What would you like to do?
1. Install Prettier in all services
2. Format all services
3. Check formatting in all services
4. Both install and format

Enter your choice (1-4)"

switch ($action) {
    "1" {
        Write-Host "`nInstalling Prettier in all services..." -ForegroundColor Yellow
        foreach ($service in $services) {
            Write-Host "`nProcessing $service..." -ForegroundColor Cyan
            Push-Location $service
            npm install --save-dev prettier
            Pop-Location
        }
        Write-Host "`n✅ Prettier installed in all services!" -ForegroundColor Green
    }
    "2" {
        Write-Host "`nFormatting all services..." -ForegroundColor Yellow
        foreach ($service in $services) {
            Write-Host "`nFormatting $service..." -ForegroundColor Cyan
            Push-Location $service
            npm run format
            Pop-Location
        }
        Write-Host "`n✅ All services formatted!" -ForegroundColor Green
    }
    "3" {
        Write-Host "`nChecking formatting in all services..." -ForegroundColor Yellow
        $failed = @()
        foreach ($service in $services) {
            Write-Host "`nChecking $service..." -ForegroundColor Cyan
            Push-Location $service
            $result = npm run format:check 2>&1
            if ($LASTEXITCODE -ne 0) {
                $failed += $service
                Write-Host "  ❌ Failed" -ForegroundColor Red
            } else {
                Write-Host "  ✅ Passed" -ForegroundColor Green
            }
            Pop-Location
        }
        
        if ($failed.Count -gt 0) {
            Write-Host "`n❌ Formatting check failed for:" -ForegroundColor Red
            foreach ($f in $failed) {
                Write-Host "  - $f" -ForegroundColor Red
            }
            Write-Host "`nRun 'npm run format' in each failed service to fix." -ForegroundColor Yellow
        } else {
            Write-Host "`n✅ All services have correct formatting!" -ForegroundColor Green
        }
    }
    "4" {
        Write-Host "`nInstalling and formatting all services..." -ForegroundColor Yellow
        foreach ($service in $services) {
            Write-Host "`nProcessing $service..." -ForegroundColor Cyan
            Push-Location $service
            Write-Host "  Installing Prettier..." -ForegroundColor Yellow
            npm install --save-dev prettier
            Write-Host "  Formatting code..." -ForegroundColor Yellow
            npm run format
            Pop-Location
        }
        Write-Host "`n✅ All services installed and formatted!" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Done! Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit the changes: git add . && git commit -m 'Add Prettier configuration'" -ForegroundColor White
Write-Host "2. Push to GitHub: git push" -ForegroundColor White
Write-Host "3. GitHub Actions will automatically check formatting on PRs" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
