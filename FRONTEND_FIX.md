# Frontend Not Showing - Quick Fix

## Issue
Frontend shows blank/loading screen and doesn't redirect to login.

## Root Cause
The `useAuth` hook is making an API call on every page load, and if it fails or hangs, the page stays in loading state.

## Quick Fix Steps

### Step 1: Clear Browser Cache
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear all cookies and local storage
4. Hard refresh (Ctrl+Shift+R)

### Step 2: Check Backend Connection
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"OK","timestamp":"..."}`

### Step 3: Restart Frontend
```bash
cd frontend
# Kill existing process (Ctrl+C)
npm run dev
```

### Step 4: Open Browser Console
1. Open http://localhost:3000
2. Press F12 to open DevTools
3. Check Console tab for errors
4. Check Network tab for failed requests

## Expected Behavior
- Page should redirect to `/auth/login` within 1-2 seconds
- Login page should display with email/password fields

## If Still Not Working

### Temporary Bypass (Testing Only)
Replace `frontend/src/app/page.jsx` with this:

```javascript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Direct redirect without auth check
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">WorkZen</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
```

This bypasses the auth check and goes directly to login.

## Common Issues

### 1. Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 2. Node Modules Corrupted
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

### 3. Environment Variables Wrong
Check `frontend/.env.local`:
```
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=WorkZen
```

## Debug Commands

```bash
# Check if frontend is running
curl http://localhost:3000

# Check if backend is running  
curl http://localhost:5000/health

# Check backend auth endpoint
curl http://localhost:5000/api/auth/profile

# Should return 401 if not authenticated
```
