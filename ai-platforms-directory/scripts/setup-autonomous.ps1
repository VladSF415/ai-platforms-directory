# Autonomous Tasks Setup Script (Windows PowerShell)

Write-Host "🤖 Setting up Autonomous Task Suite" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if DeepSeek API key is set
if (-not $env:DEEPSEEK_API_KEY) {
    Write-Host "❌ DEEPSEEK_API_KEY not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your DeepSeek API key:" -ForegroundColor Yellow
    Write-Host "  `$env:DEEPSEEK_API_KEY = 'sk-...'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or add to system environment variables:" -ForegroundColor Yellow
    Write-Host "  [System.Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY', 'sk-...', 'User')" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ DeepSeek API key detected" -ForegroundColor Green
Write-Host ""

# Get current directory status
$platformsCount = (Get-Content platforms.json | ConvertFrom-Json).Length
Write-Host "📊 Current directory status:" -ForegroundColor Cyan
Write-Host "  Platforms: $platformsCount" -ForegroundColor White
Write-Host ""

# Menu
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host ""
Write-Host "1) Test discovery (find 3 new platforms)" -ForegroundColor White
Write-Host "2) Test enrichment (enrich 5 platforms)" -ForegroundColor White
Write-Host "3) Test affiliate hunter (scan platforms)" -ForegroundColor White
Write-Host "4) Test health check (check platforms)" -ForegroundColor White
Write-Host "5) Run full orchestrator (all tasks)" -ForegroundColor White
Write-Host "6) Setup Windows Task Scheduler (schedule daily)" -ForegroundColor White
Write-Host "7) Exit" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice [1-7]"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔍 Testing platform discovery..." -ForegroundColor Cyan
        node scripts/ai-powered-organizer.mjs --discover --max=3 --provider=deepseek --verbose
    }
    "2" {
        Write-Host ""
        Write-Host "🔧 Testing data enrichment..." -ForegroundColor Cyan
        node scripts/data-enrichment.mjs --max=5 --verbose
    }
    "3" {
        Write-Host ""
        Write-Host "💰 Testing affiliate hunter..." -ForegroundColor Cyan
        node scripts/affiliate-hunter.mjs
    }
    "4" {
        Write-Host ""
        Write-Host "🏥 Testing health check..." -ForegroundColor Cyan
        node scripts/platform-health-check.mjs
    }
    "5" {
        Write-Host ""
        Write-Host "🤖 Running full orchestrator..." -ForegroundColor Cyan
        Write-Host "This will run all autonomous tasks based on their schedule" -ForegroundColor Yellow
        node scripts/autonomous-orchestrator.mjs
    }
    "6" {
        Write-Host ""
        Write-Host "⏰ Setting up Windows Task Scheduler..." -ForegroundColor Cyan
        Write-Host "Creating daily task at 3 AM..." -ForegroundColor Yellow

        $scriptPath = Join-Path $PSScriptRoot "autonomous-orchestrator.mjs"
        $action = New-ScheduledTaskAction -Execute "node" -Argument $scriptPath
        $trigger = New-ScheduledTaskTrigger -Daily -At 3am

        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

        try {
            Register-ScheduledTask -TaskName "AI Directory - Autonomous Tasks" `
                -Action $action `
                -Trigger $trigger `
                -Settings $settings `
                -Description "Runs autonomous tasks for AI Platforms Directory" `
                -Force

            Write-Host "✅ Task scheduled successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "View task in Task Scheduler:" -ForegroundColor Yellow
            Write-Host "  taskschd.msc" -ForegroundColor White
        }
        catch {
            Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
            Write-Host "You may need to run PowerShell as Administrator" -ForegroundColor Yellow
        }
    }
    "7" {
        Write-Host "Goodbye!" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  - Review AUTONOMOUS_TASKS.md for full documentation" -ForegroundColor White
Write-Host "  - Check autonomous-runs.log for execution logs" -ForegroundColor White
Write-Host "  - Monitor .autonomous-state.json for task state" -ForegroundColor White
Write-Host ""
