# Deploy All Supabase Edge Functions
# Run this script to deploy all Edge Functions to Supabase

Write-Host "🚀 Deploying CampusConnect Edge Functions to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✅ Supabase CLI installed: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

Write-Host "📂 Project directory: $projectDir" -ForegroundColor Gray
Write-Host ""

# List of Edge Functions to deploy
$functions = @(
    "posts-api",
    "home-feed-api",
    "societies-api",
    "admin-api",
    "push-notifications",
    "categories-api",
    "institutes-api",
    "reports-api",
    "notifications-api",
    "profile-api",
    "media-upload-api",
    "invitations-api",
    "health"
)

$successCount = 0
$failCount = 0
$failedFunctions = @()

# Deploy each function
foreach ($func in $functions) {
    Write-Host "📦 Deploying $func..." -ForegroundColor Cyan
    
    # Check if function directory exists
    $funcPath = Join-Path "supabase" "functions" $func
    if (!(Test-Path $funcPath)) {
        Write-Host "   ⚠️  Skipping $func - directory not found" -ForegroundColor Yellow
        continue
    }
    
    try {
        # Deploy function
        $output = supabase functions deploy $func 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $func deployed successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ $func deployment failed" -ForegroundColor Red
            Write-Host "   Error: $output" -ForegroundColor Red
            $failCount++
            $failedFunctions += $func
        }
    } catch {
        Write-Host "   ❌ $func deployment failed: $_" -ForegroundColor Red
        $failCount++
        $failedFunctions += $func
    }
    
    Write-Host ""
}

# Summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

if ($failCount -gt 0) {
    Write-Host ""
    Write-Host "Failed functions:" -ForegroundColor Red
    foreach ($func in $failedFunctions) {
        Write-Host "  - $func" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "💡 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Check Supabase project is linked: supabase link" -ForegroundColor Gray
    Write-Host "   2. Verify you're logged in: supabase login" -ForegroundColor Gray
    Write-Host "   3. Check function logs: supabase functions logs <function-name>" -ForegroundColor Gray
    Write-Host "   4. See SUPABASE_TROUBLESHOOTING.md for detailed help" -ForegroundColor Gray
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "🎉 Deployment complete! Check your functions at:" -ForegroundColor Green
    Write-Host "   https://supabase.com/dashboard/project/_/functions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Check function logs: supabase functions logs posts-api" -ForegroundColor Gray
    Write-Host "   2. Test endpoints in your app" -ForegroundColor Gray
    Write-Host "   3. Monitor for errors in Supabase Dashboard" -ForegroundColor Gray
}

exit $(if ($failCount -gt 0) { 1 } else { 0 })

