# Authentication Flow Documentation

## Overview
The HR System now uses **httpOnly cookies** for JWT token storage, providing maximum security against XSS attacks.

## How It Works

### 1. Login Flow
```
Client                  Next.js Proxy              Backend
  |                          |                         |
  |--POST /api/auth/login--->|--POST /auth/login------>|
  |                          |                         |
  |                          |         [Validate credentials]
  |                          |         [Generate JWT]
  |                          |         [Set httpOnly cookie]
  |                          |                         |
  |<------Response-----------<-----Response + Cookie---|
  |  (user data, NO token)   |   (Set-Cookie header)   |
```

**Backend (authController.js):**
- Validates credentials
- Generates JWT token
- Sets token in httpOnly cookie (cannot be accessed by JavaScript)
- Returns user data WITHOUT token in response body

**Frontend (authSlice.js):**
- Receives user data
- Stores user info in Redux state
- Does NOT store token (it's in httpOnly cookie)

### 2. Authenticated Requests
```
Client                  Next.js Proxy              Backend
  |                          |                         |
  |--GET /api/users--------->|--GET /users------------>|
  |  (Cookie auto-sent)      |  (Cookie forwarded)     |
  |                          |                         |
  |                          |      [Verify JWT from cookie]
  |                          |      [Check permissions]
  |                          |                         |
  |<------Response-----------<--------Response---------|
```

**Frontend (api.js):**
- Sets `withCredentials: true` to include cookies in requests
- Uses Next.js proxy (`/api`) to avoid CORS issues
- Browser automatically sends httpOnly cookie

**Backend (authMiddleware.js):**
- Reads JWT from `req.cookies.token`
- Verifies and decodes token
- Attaches user info to `req.user`

### 3. Logout Flow
```
Client                  Next.js Proxy              Backend
  |                          |                         |
  |--POST /api/auth/logout-->|--POST /auth/logout----->|
  |                          |                         |
  |                          |      [Clear cookie]
  |                          |      [Terminate session]
  |                          |                         |
  |<------Response-----------<--------Response---------|
  |  (Cookie cleared)        |   (Clear-Cookie header) |
```

**Backend:**
- Clears the httpOnly cookie
- Terminates database sessions
- Logs activity

**Frontend:**
- Clears Redux state
- Redirects to login

## Security Benefits

### ✅ Prevents XSS Attacks
- Token stored in httpOnly cookie
- JavaScript cannot access the cookie
- Even if attacker injects malicious script, they cannot steal the token

### ✅ Automatic Cookie Handling
- Browser manages cookies automatically
- No manual token management in JavaScript
- Reduces risk of developer errors

### ✅ CSRF Protection
- Use `sameSite: 'lax'` or 'strict' cookie attribute
- Backend should validate origin headers
- Consider implementing CSRF tokens for sensitive operations

### ✅ Secure Transport
- `secure: true` flag ensures cookies only sent over HTTPS in production
- Prevents man-in-the-middle attacks

## Configuration

### Backend Cookie Settings
```javascript
res.cookie('token', token, {
  httpOnly: true,                          // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',                         // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000          // 7 days
});
```

### Frontend API Configuration
```javascript
const api = axios.create({
  baseURL: '/api',           // Use Next.js proxy
  withCredentials: true,      // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Next.js Proxy Configuration
```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ]
}
```

## Migration from localStorage

### Before (Insecure)
```javascript
// Backend sent token in response body
success(res, { user, token });

// Frontend stored in localStorage
localStorage.setItem('token', token);

// Frontend manually added to headers
config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
```

### After (Secure)
```javascript
// Backend sets httpOnly cookie
res.cookie('token', token, { httpOnly: true });
success(res, { user });  // No token in response

// Frontend does nothing with token (it's in cookie)
// No localStorage usage

// Browser automatically sends cookie
// No manual Authorization header needed
```

## Testing Authentication

### 1. Check Cookie in Browser DevTools
1. Login to the application
2. Open DevTools > Application > Cookies
3. Verify `token` cookie exists with:
   - `HttpOnly` flag = true
   - `Secure` flag = true (in production)
   - `SameSite` = Lax

### 2. Verify Token Not in Response
```javascript
// Login response should NOT contain token
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      // ... other user fields
      // NO "token" field
    }
  }
}
```

### 3. Test Authenticated Request
```bash
# Should work (cookie sent automatically)
curl -X GET http://localhost:3000/api/users \
  -H "Cookie: token=your-jwt-token" \
  --cookie-jar cookies.txt

# Should fail 401 (no cookie)
curl -X GET http://localhost:3000/api/users
```

## Troubleshooting

### Issue: 401 Unauthorized on all requests
**Cause:** Cookie not being sent or read
**Solutions:**
1. Ensure `withCredentials: true` in axios config
2. Check backend has `credentials: true` in CORS config
3. Verify cookie domain matches frontend domain
4. Check cookie hasn't expired

### Issue: Cookie not set after login
**Cause:** CORS or cookie configuration issue
**Solutions:**
1. Ensure frontend uses proxy (`/api`)
2. Backend CORS origin must match frontend origin
3. In production, ensure using HTTPS for `secure: true` cookies

### Issue: Cookie cleared unexpectedly
**Cause:** Token expiration or session termination
**Solutions:**
1. Check JWT expiry time
2. Verify session hasn't been terminated by admin
3. Check for logout calls

## Best Practices

1. **Always use HTTPS in production** - Required for secure cookies
2. **Set appropriate expiry times** - Balance between UX and security
3. **Implement refresh tokens** - For longer sessions without re-login
4. **Log authentication events** - Monitor for suspicious activity
5. **Use CSP headers** - Additional XSS protection layer
6. **Implement rate limiting** - Prevent brute force attacks
7. **Regular security audits** - Keep dependencies updated

## Related Files

- `backend/src/controllers/authController.js` - Authentication logic
- `backend/src/middleware/authMiddleware.js` - JWT verification
- `frontend/src/store/authSlice.js` - Redux authentication state
- `frontend/src/lib/api.js` - Axios configuration
- `frontend/next.config.js` - API proxy configuration
