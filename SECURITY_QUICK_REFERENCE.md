# 🔒 Security Quick Reference Card

## 🚨 Critical Rules

### ❌ NEVER DO THIS
```javascript
// ❌ Store tokens in localStorage
localStorage.setItem('token', token);

// ❌ Manually add Authorization header
config.headers.Authorization = `Bearer ${token}`;

// ❌ Use direct backend URL in frontend
const API_URL = 'http://localhost:5000/api';

// ❌ Allow employees to access all users
router.get('/users', authMiddleware, getAllUsers);

// ❌ Skip validation on updates
await prisma.users.update({ where: { id }, data: req.body });

// ❌ Guess response structure
const data = res.data?.data || res.data || [];
```

### ✅ ALWAYS DO THIS
```javascript
// ✅ Tokens in httpOnly cookies (backend handles this)
res.cookie('token', token, { httpOnly: true });

// ✅ Use Next.js proxy
const API_URL = '/api';

// ✅ Enforce role-based access
router.get('/users', authMiddleware, roleMiddleware(['ADMIN', 'HR']), getAllUsers);

// ✅ Always validate input
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ message: error.message });

// ✅ Use consistent response structure
const { users } = response.data.data;
```

---

## 🎯 Quick Fixes

### Authentication
```javascript
// Login (Backend)
res.cookie('token', jwt.sign({ userId }, secret), { httpOnly: true });
success(res, { user });  // No token in response

// API Setup (Frontend)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true  // Sends cookies automatically
});
```

### Access Control
```javascript
// Route Protection (Backend)
router.get('/users', 
  authMiddleware,                          // Check authentication
  roleMiddleware(['ADMIN', 'HR_OFFICER']), // Check authorization
  getAllUsers
);

// Component Protection (Frontend)
import { canViewAllUsers } from '@/utils/roleGuards';
const { user } = useAuth();

if (!canViewAllUsers(user.role)) {
  return <Unauthorized />;
}
```

### Validation
```javascript
// Define Schema
const schema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  salary: Joi.number().positive().required()
});

// Use in Controller
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ message: error.message });
// Use 'value', not 'req.body'
```

---

## 🔍 Quick Checks

### Is My Code Secure?
- [ ] No localStorage usage for tokens?
- [ ] No NEXT_PUBLIC_API_URL in frontend?
- [ ] Using `/api` proxy path?
- [ ] Cookies have httpOnly flag?
- [ ] Routes protected with roleMiddleware?
- [ ] Updates validated with Joi?
- [ ] Consistent response parsing?

### Test Commands
```bash
# 1. Check for localStorage
grep -r "localStorage" frontend/src/

# 2. Check for exposed URLs
grep -r "NEXT_PUBLIC_API_URL" frontend/

# 3. Check for Bearer tokens
grep -r "Bearer" frontend/src/

# 4. All should return minimal results
```

---

## 📋 Common Patterns

### Fetch Current User
```javascript
// ✅ From Redux
const { user } = useAuth();

// ❌ From localStorage
const token = localStorage.getItem('token');
```

### Protect Route
```javascript
// ✅ Check authentication
const { user, isAuthenticated } = useAuth();
useEffect(() => {
  if (!isAuthenticated) router.push('/auth/login');
}, [isAuthenticated]);
```

### Handle Response
```javascript
// ✅ Consistent structure
try {
  const response = await api.get('/users');
  const { users, pagination } = response.data.data;
  setUsers(users);
} catch (error) {
  toast.error(error.response?.data?.message || 'Failed');
}
```

### Role-Based Rendering
```javascript
// ✅ Use role guards
import { canViewAllUsers } from '@/utils/roleGuards';

{canViewAllUsers(user.role) && (
  <SensitiveComponent />
)}
```

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Backend
JWT_SECRET=super-secret-change-in-production
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Frontend
BACKEND_URL=http://localhost:5000
```

### Pre-Deploy
- [ ] Strong JWT_SECRET set
- [ ] HTTPS enabled
- [ ] NODE_ENV=production
- [ ] CORS_ORIGIN configured
- [ ] All security fixes applied
- [ ] No console.log statements
- [ ] Error handling in place

---

## 📞 Quick Help

| Issue | Solution | Doc |
|-------|----------|-----|
| 401 Unauthorized | Check cookie exists, not expired | [AUTH](./AUTHENTICATION_FLOW.md) |
| 403 Forbidden | Check user role permissions | [ACCESS](./ACCESS_CONTROL.md) |
| CORS Error | Use `/api` proxy, not direct URL | [FIXES](./SECURITY_FIXES.md) |
| Validation Error | Check Joi schema matches payload | [FIXES](./SECURITY_FIXES.md) |
| Token in localStorage | Remove, use httpOnly cookies | [AUTH](./AUTHENTICATION_FLOW.md) |

---

## 🎓 Learn More

- **Security Basics:** [SECURITY_EXECUTIVE_SUMMARY.md](./SECURITY_EXECUTIVE_SUMMARY.md)
- **Implementation:** [SECURITY_FIXES.md](./SECURITY_FIXES.md)
- **Authentication:** [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)
- **Authorization:** [ACCESS_CONTROL.md](./ACCESS_CONTROL.md)
- **Migration:** [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)

---

**Print this card and keep it near your desk! 📌**
