# API Testing Script
# Run this after starting the backend to test all endpoints

Write-Host "🧪 Testing College Certificate API" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://localhost:8000"
$ADMIN_SECRET = "secret"  # Change this to your actual secret

# Test 1: Health Check
Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "✓ Health check passed: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed" -ForegroundColor Red
    exit
}

# Test 2: Create Event
Write-Host "2. Creating test event..." -ForegroundColor Yellow
$eventData = @{
    name = "Web Development Workshop 2025"
    description = "A comprehensive workshop on modern web development"
    date = "2025-03-15"
} | ConvertTo-Json

try {
    $event = Invoke-RestMethod -Uri "$BASE_URL/api/events/?admin_secret=$ADMIN_SECRET" `
        -Method Post `
        -ContentType "application/json" `
        -Body $eventData
    Write-Host "✓ Event created with ID: $($event.id)" -ForegroundColor Green
    $eventId = $event.id
} catch {
    Write-Host "✗ Failed to create event: $_" -ForegroundColor Red
    exit
}

# Test 3: List Events
Write-Host "3. Listing all events..." -ForegroundColor Yellow
try {
    $events = Invoke-RestMethod -Uri "$BASE_URL/api/events/" -Method Get
    Write-Host "✓ Found $($events.Count) event(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to list events" -ForegroundColor Red
}

# Test 4: Add Participant
Write-Host "4. Adding test participant..." -ForegroundColor Yellow
$participantData = @{
    event_id = $eventId
    name = "Mihir Amin"
    email = "mihir@example.com"
    roll_no = "20CO123"
    department = "Computer Engineering"
} | ConvertTo-Json

try {
    $participant = Invoke-RestMethod -Uri "$BASE_URL/api/participants/?admin_secret=$ADMIN_SECRET" `
        -Method Post `
        -ContentType "application/json" `
        -Body $participantData
    Write-Host "✓ Participant added with ID: $($participant.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add participant: $_" -ForegroundColor Red
}

# Test 5: Generate Certificates
Write-Host "5. Generating certificates..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/api/certificates/generate_for_event/${eventId}?admin_secret=$ADMIN_SECRET" `
        -Method Post
    Write-Host "✓ $($result.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to generate certificates: $_" -ForegroundColor Red
}

# Test 6: List Certificates
Write-Host "6. Listing certificates..." -ForegroundColor Yellow
try {
    $certificates = Invoke-RestMethod -Uri "$BASE_URL/api/certificates/by_event/${eventId}?admin_secret=$ADMIN_SECRET" `
        -Method Get
    Write-Host "✓ Found $($certificates.Count) certificate(s)" -ForegroundColor Green
    
    if ($certificates.Count -gt 0) {
        $certCode = $certificates[0].certificate_code
        Write-Host "   Certificate code: $certCode" -ForegroundColor Cyan
        
        # Test 7: Verify Certificate
        Write-Host "7. Verifying certificate..." -ForegroundColor Yellow
        try {
            $verification = Invoke-RestMethod -Uri "$BASE_URL/api/certificates/verify/$certCode" -Method Get
            Write-Host "✓ Certificate status: $($verification.status)" -ForegroundColor Green
            Write-Host "   Name: $($verification.name)" -ForegroundColor Cyan
            Write-Host "   Event: $($verification.event_name)" -ForegroundColor Cyan
        } catch {
            Write-Host "✗ Failed to verify certificate" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "✗ Failed to list certificates: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "- Visit http://localhost:8000/docs for API documentation"
Write-Host "- Start frontend with: cd college-cert-frontend && npm run dev"
Write-Host "- Visit http://localhost:5173/admin/events"
