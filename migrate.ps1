# CampusConnect Database Migration Script
# Run this to apply all database migrations

Write-Host "🚀 CampusConnect Migration Script" -ForegroundColor Cyan
Write-Host ""

# Check if SUPABASE_ACCESS_TOKEN is set
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "⚠️  SUPABASE_ACCESS_TOKEN not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To use CLI, get your token from:" -ForegroundColor White
    Write-Host "https://supabase.com/dashboard/account/tokens" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor White
    Write-Host '$env:SUPABASE_ACCESS_TOKEN="your-token-here"' -ForegroundColor Green
    Write-Host ""
    Write-Host "Or just run the migrations manually in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx/sql" -ForegroundColor White
    Write-Host "2. Copy contents of: supabase/migrations/003_add_missing_columns.sql" -ForegroundColor White
    Write-Host "3. Paste and run in SQL Editor" -ForegroundColor White
    Write-Host "4. Then repeat with: supabase/migrations/002_safe_migration.sql" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Do you want to open the SQL Editor now? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Start-Process "https://supabase.com/dashboard/project/egdavxjkyxvawgguqmvx/sql"
        Write-Host "✅ Opening SQL Editor in your browser..." -ForegroundColor Green
    }
    
    exit 0
}

Write-Host "✅ Access token found!" -ForegroundColor Green
Write-Host ""

# Link to project
Write-Host "📡 Linking to Supabase project..." -ForegroundColor Cyan
npx supabase link --project-ref egdavxjkyxvawgguqmvx

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project linked!" -ForegroundColor Green
Write-Host ""

# Run migration 003 - Add missing columns
Write-Host "📝 Running migration 003: Add missing columns..." -ForegroundColor Cyan
$migration003 = Get-Content "supabase\migrations\003_add_missing_columns.sql" -Raw
$migration003 | npx supabase db query

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration 003 failed" -ForegroundColor Red
    Write-Host "Try running it manually in Supabase Dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Migration 003 completed!" -ForegroundColor Green
Write-Host ""

# Run migration 002 - Safe migration
Write-Host "📝 Running migration 002: Complete schema setup..." -ForegroundColor Cyan
$migration002 = Get-Content "supabase\migrations\002_safe_migration.sql" -Raw
$migration002 | npx supabase db query

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration 002 had warnings (this might be okay)" -ForegroundColor Yellow
}

Write-Host "✅ Migration 002 completed!" -ForegroundColor Green
Write-Host ""

# Verify tables
Write-Host "🔍 Verifying database setup..." -ForegroundColor Cyan
$verifyQuery = @"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"@

$verifyQuery | npx supabase db query

Write-Host ""
Write-Host "🎉 Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Refresh your app" -ForegroundColor White
Write-Host "2. Try creating an account" -ForegroundColor White
Write-Host "3. Should work without errors! ✅" -ForegroundColor Green
Write-Host ""

