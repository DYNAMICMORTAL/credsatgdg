# Deployment Verification Script
# Run this after deployment to verify everything is working

Write-Host "`n=== College Certificate System - Deployment Verification ===" -ForegroundColor Cyan
Write-Host ""

# Get URLs from user
Write-Host "Enter your deployment URLs:" -ForegroundColor Yellow
$backendUrl = Read-Host "Backend URL (e.g., https://your-backend.onrender.com)"
$frontendUrl = Read-Host "Frontend URL (e.g., https://your-frontend.vercel.app)"

Write-Host "`n--- Testing Backend ---" -ForegroundColor Green

# Test 1: Health Check
Write-Host "1. Testing health endpoint..." -NoNewline
try {
    $healthResponse = Invoke-WebRequest -Uri "$backendUrl/health" -Method Get -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "   Response: $($healthResponse.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: API Docs
Write-Host "2. Testing API documentation..." -NoNewline
try {
    $docsResponse = Invoke-WebRequest -Uri "$backendUrl/docs" -Method Get -ErrorAction Stop
    if ($docsResponse.StatusCode -eq 200) {
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "   Docs available at: $backendUrl/docs" -ForegroundColor Gray
    }
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: CORS Headers
Write-Host "3. Testing CORS configuration..." -NoNewline
try {
    $corsHeaders = @{
        "Origin" = $frontendUrl
        "Access-Control-Request-Method" = "GET"
    }
    $corsResponse = Invoke-WebRequest -Uri "$backendUrl/health" -Method Options -Headers $corsHeaders -ErrorAction Stop
    $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    if ($allowOrigin) {
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "   Allowed Origin: $allowOrigin" -ForegroundColor Gray
    } else {
        Write-Host " ⚠ WARNING" -ForegroundColor Yellow
        Write-Host "   CORS headers not found (may still work)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠ WARNING" -ForegroundColor Yellow
    Write-Host "   Could not verify CORS (this is normal for some deployments)" -ForegroundColor Yellow
}

Write-Host "`n--- Testing Frontend ---" -ForegroundColor Green

# Test 4: Frontend Loading
Write-Host "4. Testing frontend accessibility..." -NoNewline
try {
    $frontendResponse = Invoke-WebRequest -Uri $frontendUrl -Method Get -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "   Frontend is accessible" -ForegroundColor Gray
    }
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check if frontend has expected content
Write-Host "5. Checking frontend content..." -NoNewline
try {
    $frontendContent = $frontendResponse.Content
    if ($frontendContent -match "Certificate" -or $frontendContent -match "Event") {
        Write-Host " ✓ PASS" -ForegroundColor Green
        Write-Host "   Frontend content looks correct" -ForegroundColor Gray
    } else {
        Write-Host " ⚠ WARNING" -ForegroundColor Yellow
        Write-Host "   Frontend loaded but content may be incorrect" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ⚠ WARNING" -ForegroundColor Yellow
    Write-Host "   Could not verify content" -ForegroundColor Yellow
}

Write-Host "`n--- Summary ---" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL:  $backendUrl" -ForegroundColor White
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open frontend in browser: $frontendUrl" -ForegroundColor Gray
Write-Host "2. Check API documentation: $backendUrl/docs" -ForegroundColor Gray
Write-Host "3. Test the full flow:" -ForegroundColor Gray
Write-Host "   - Create a test event" -ForegroundColor Gray
Write-Host "   - Generate a certificate" -ForegroundColor Gray
Write-Host "   - Send a test email" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see any failures above:" -ForegroundColor Yellow
Write-Host "- Check POST_DEPLOYMENT.md for troubleshooting" -ForegroundColor Gray
Write-Host "- Verify environment variables are set correctly" -ForegroundColor Gray
Write-Host "- Check deployment logs on Render/Vercel" -ForegroundColor Gray
Write-Host ""

# Open URLs in browser
$openBrowser = Read-Host "Open URLs in browser? (Y/N)"
if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
    Write-Host "Opening backend docs..." -ForegroundColor Gray
    Start-Process "$backendUrl/docs"
    Start-Sleep -Seconds 1
    Write-Host "Opening frontend..." -ForegroundColor Gray
    Start-Process $frontendUrl
}

Write-Host "`nVerification complete!" -ForegroundColor Green
