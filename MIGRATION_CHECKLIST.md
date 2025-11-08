# Migration Checklist for Existing Code

Use this checklist to update any remaining frontend components to use the new secure patterns.

## ✅ Authentication Changes

### Remove localStorage Usage
**Find and Replace Pattern:**

❌ **OLD (Insecure):**
```javascript
localStorage.setItem('token', response.data.token);
const token = localStorage.getItem('token');
localStorage.removeItem('token');
```

✅ **NEW (Secure):**
```javascript
// No localStorage usage - tokens are in httpOnly cookies
// Just handle the response data
return response.data.data;
```

### Update API Interceptors
**Find and Replace Pattern:**

❌ **OLD:**
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

✅ **NEW:**
```javascript
api.interceptors.request.use((config) => {
  // Token automatically sent via httpOnly cookie
  // No manual Authorization header needed
  return config;
});
```

---

## ✅ API Response Handling

### Standardize Response Parsing
**Find and Replace Pattern:**

❌ **OLD (Shotgun approach):**
```javascript
const data = response.data?.data?.users || 
             response.data?.data || 
             response.data || 
             [];
```

✅ **NEW (Consistent):**
```javascript
// Backend always returns: { success: true, message: "...", data: {...} }
const { users, pagination } = response.data.data;
```

### Update Error Handling
**Find and Replace Pattern:**

❌ **OLD:**
```javascript
catch (error) {
  const errorMessage = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Unknown error';
}
```

✅ **NEW:**
```javascript
catch (error) {
  // Backend always returns: { success: false, message: "...", errors: null }
  const errorMessage = error.response?.data?.message || 'Operation failed';
}
```

---

## ✅ Access Control Updates

### Remove Unauthorized API Calls
**Find These Patterns:**

❌ **REMOVE from Employee components:**
```javascript
// Employees should NOT call these
await usersAPI.getAll();  // Only for ADMIN/HR
await usersAPI.getById(otherUserId);  // Only for own profile
```

✅ **REPLACE with:**
```javascript
// Employees get own data from auth state or profile endpoint
const user = useSelector(state => state.auth.user);
// or
const response = await usersAPI.getById(currentUser.id);
```

### Add Role Guards
**Add to Components:**

```javascript
import { canViewAllUsers, canManageUsers } from '@/utils/roleGuards';

// In component:
const { user } = useAuth();

// Conditional rendering
{canViewAllUsers(user.role) && (
  <AdminOnlyComponent />
)}

// Conditional navigation
useEffect(() => {
  if (user && !canViewAllUsers(user.role)) {
    router.push('/dashboard/employee-dashboard');
  }
}, [user]);
```

---

## ✅ Configuration Updates

### Update API Base URL
**Find and Replace:**

❌ **OLD:**
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

✅ **NEW:**
```javascript
// Use Next.js proxy instead of direct backend URL
const API_URL = '/api';
```

### Update Environment Variables
**Remove from .env:**
```env
# ❌ Remove this - exposes backend URL to client
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Add to .env:**
```env
# ✅ Add this - only used server-side
BACKEND_URL=http://localhost:5000
```

---

## ✅ Files to Check and Update

### High Priority (Security Critical)

- [ ] `frontend/src/store/authSlice.js`
  - [ ] Remove all `localStorage.setItem('token', ...)`
  - [ ] Remove all `localStorage.getItem('token')`
  - [ ] Remove all `localStorage.removeItem('token')`

- [ ] `frontend/src/lib/api.js`
  - [ ] Change baseURL to `/api`
  - [ ] Remove Authorization header from interceptor
  - [ ] Ensure `withCredentials: true`

- [ ] `frontend/src/hooks/useAuth.js`
  - [ ] Remove any localStorage token checks
  - [ ] Rely on Redux state only

### Medium Priority (Data Access)

- [ ] `frontend/src/app/employee/page.jsx`
  - [ ] REMOVE or fix unauthorized `usersAPI.getAll()` call
  - [ ] Use only own profile data

- [ ] `frontend/src/app/dashboard/admin/page.jsx`
  - [ ] Update response parsing to use consistent structure
  - [ ] Add role guard checks

- [ ] `frontend/src/app/dashboard/employee-dashboard/leave/page.jsx`
  - [ ] Update response parsing
  - [ ] Ensure only accessing own leave data

- [ ] `frontend/src/app/dashboard/employee-dashboard/profile/page.jsx`
  - [ ] Ensure only updating own profile
  - [ ] Add authorization check

### Low Priority (Nice to Have)

- [ ] `frontend/src/app/dashboard/employees/page.jsx`
  - [ ] Replace mock data with real API calls
  - [ ] Add proper error handling

- [ ] All other components making API calls
  - [ ] Standardize response parsing
  - [ ] Add proper error handling
  - [ ] Add role guards where needed

---

## ✅ Testing Checklist

### Authentication Tests
- [ ] Login successfully sets httpOnly cookie
- [ ] Logout clears cookie
- [ ] Authenticated requests include cookie automatically
- [ ] 401 redirects to login
- [ ] Cannot access token via JavaScript console

### Authorization Tests
- [ ] ADMIN can access all users
- [ ] HR_OFFICER can access all users
- [ ] EMPLOYEE cannot access all users (403)
- [ ] EMPLOYEE can access own profile
- [ ] EMPLOYEE cannot update other profiles (403)
- [ ] Role guards hide/show correct UI elements

### Data Integrity Tests
- [ ] Update user profile validates data
- [ ] Invalid data rejected with clear error message
- [ ] Pagination works correctly
- [ ] Filtering works correctly

### Configuration Tests
- [ ] Frontend connects to backend via proxy
- [ ] No CORS errors
- [ ] Environment variables used correctly
- [ ] Works in development and production

---

## ✅ Common Patterns to Update

### Pattern 1: Fetching Current User
❌ **OLD:**
```javascript
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    fetchUserProfile();
  }
}, []);
```

✅ **NEW:**
```javascript
const { user } = useAuth();  // From Redux state

useEffect(() => {
  if (!user) {
    router.push('/auth/login');
    return;
  }
  // User data already available
}, [user]);
```

### Pattern 2: Protecting Routes
❌ **OLD:**
```javascript
useEffect(() => {
  if (!localStorage.getItem('token')) {
    router.push('/auth/login');
  }
}, []);
```

✅ **NEW:**
```javascript
const { user, isAuthenticated } = useAuth();

useEffect(() => {
  if (!isAuthenticated) {
    router.push('/auth/login');
  }
}, [isAuthenticated]);
```

### Pattern 3: Conditional API Calls
❌ **OLD:**
```javascript
// Always fetches all users, even for employees
const response = await usersAPI.getAll();
```

✅ **NEW:**
```javascript
const { user } = useAuth();

if (canViewAllUsers(user.role)) {
  const response = await usersAPI.getAll();
} else {
  // Employees see only their own data
  const response = await usersAPI.getById(user.id);
}
```

---

## ✅ Verification Commands

### Check for localStorage Usage
```bash
# Search for localStorage in frontend code
cd frontend
grep -r "localStorage" src/

# Should only find in:
# - Old browser compatibility code (if any)
# - Comments explaining why we DON'T use it
```

### Check for Bearer Token Usage
```bash
# Search for Authorization headers
grep -r "Authorization.*Bearer" frontend/src/

# Should only find in:
# - Comments
# - Test files
```

### Check for Direct Backend URLs
```bash
# Search for hardcoded backend URLs
grep -r "http://.*:5000" frontend/src/

# Should find: None (or only in comments)
```

### Check for NEXT_PUBLIC_API_URL
```bash
# Search for public API URL usage
grep -r "NEXT_PUBLIC_API_URL" frontend/

# Should find: None (or only in old comments)
```

---

## ✅ Deployment Pre-flight Checklist

Before deploying to production:

- [ ] All localStorage usage removed
- [ ] All Bearer token usage removed
- [ ] All components use `/api` proxy
- [ ] All role guards implemented
- [ ] All validation added to update endpoints
- [ ] Environment variables set correctly
- [ ] HTTPS enabled (required for secure cookies)
- [ ] JWT_SECRET is strong and unique
- [ ] CORS_ORIGIN set to production domain
- [ ] All tests passing
- [ ] Security audit completed

---

## 📝 Notes

- Don't forget to clear browser localStorage after deployment to remove old tokens
- Inform users they may need to log in again after update
- Monitor error logs for authorization failures
- Keep security documentation updated

## 🆘 Need Help?

If you encounter issues during migration:

1. Check [SECURITY_FIXES.md](./SECURITY_FIXES.md) for context
2. Review [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) for implementation details
3. Check [ACCESS_CONTROL.md](./ACCESS_CONTROL.md) for role-based patterns
4. Test with different user roles
5. Check browser console and network tab for errors
