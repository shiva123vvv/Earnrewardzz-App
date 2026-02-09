Write-Host "--- Starting EarnRewardzz Backend Deployment ---" -ForegroundColor Cyan

# 1. Install local dependencies for functions
Write-Host "`n1. Installing functions dependencies..." -ForegroundColor Yellow
cd functions
npm install
cd ..

# 2. Check Firebase Login
Write-Host "`n2. Checking Firebase connection..." -ForegroundColor Yellow
$loginCheck = npx firebase login:list
if ($loginCheck -like "*No accounts*") {
    Write-Host "!!! Not logged in. Please log in to Firebase in the browser window that opens now." -ForegroundColor Red
    npx firebase login
} else {
    Write-Host "Logged in successfully." -ForegroundColor Green
}

# 3. Deploy
Write-Host "`n3. Deploying Cloud Functions and Firestore Rules..." -ForegroundColor Yellow
npx firebase deploy --only functions,firestore:rules --project earnrewards-b118b

Write-Host "`n--- Deployment Task Finished ---" -ForegroundColor Cyan
Write-Host "Important: Ensure Anonymous Auth is enabled in the Firebase Console!" -ForegroundColor Yellow
