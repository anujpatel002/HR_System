# Role-Based Access Control (RBAC) Implementation

## Overview
The HR System now implements proper role-based access control to prevent unauthorized data access.

## User Roles

### 1. ADMIN
- **Full system access**
- Can view all users and their data
- Can create, update, and delete users
- Can manage all HR functions
- Can view sensitive data (salaries, bank details)

### 2. HR_OFFICER
- **HR management access**
- Can view all employees
- Can update employee records
- Can view sensitive data (salaries, bank details)
- Can manage leave requests and payroll

### 3. PAYROLL_OFFICER
- **Payroll management access**
- Can manage payroll operations
- Can view salary information
- Limited user management

### 4. MANAGER
- **Department management access**
- Can view team members
- Can approve leave requests
- Can view team attendance

### 5. EMPLOYEE
- **Self-service access only**
- Can view own profile
- Can update own profile (limited fields)
- Can request leave
- Can view own attendance
- **CANNOT view other employees' data**

## Access Control Implementation

### API Endpoint Protection

#### User Management Routes
```javascript
// backend/src/routes/userRoutes.js

router.get('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'HR_OFFICER']),  // ❌ EMPLOYEE removed
  getAllUsers
);

router.get('/:id', 
  authMiddleware,  // Any authenticated user (for own profile)
  getUserById
);

router.post('/', 
  authMiddleware, 
  roleMiddleware(['ADMIN']),  // Only ADMIN can create
  createUser
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'HR_OFFICER', 'EMPLOYEE']),  // Self-update allowed
  updateUser
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware(['ADMIN']),  // Only ADMIN can delete
  deleteUser
);
```

### Data Filtering by Role

#### getAllUsers Controller
```javascript
const getAllUsers = async (req, res) => {
  const userRole = req.user.role;

  // Define visible fields based on role
  const selectFields = {
    id: true,
    employeeId: true,
    name: true,
    email: true,
    department: true,
    designation: true,
    createdAt: true
  };

  // Only ADMIN and HR_OFFICER see sensitive data
  if (userRole === 'ADMIN' || userRole === 'HR_OFFICER') {
    selectFields.role = true;
    selectFields.basicSalary = true;
    selectFields.bankName = true;
    selectFields.accountNumber = true;
    selectFields.ifscCode = true;
    selectFields.panNo = true;
    selectFields.uanNo = true;
  }

  // Employees can only see their own data
  const whereClause = userRole === 'EMPLOYEE' 
    ? { id: req.user.id } 
    : {};

  const users = await prisma.users.findMany({
    where: whereClause,
    select: selectFields,
    // ... pagination
  });
};
```

### Update Authorization

#### updateUser Controller
```javascript
const updateUser = async (req, res) => {
  const { id } = req.params;
  
  // Authorization check: Users can update their own profile
  if (req.user.id !== id && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'HR_OFFICER') {
    return error(res, 'You can only update your own profile', 403);
  }
  
  // Validate request body
  const { error: validationError, value } = updateUserSchema.validate(req.body);
  if (validationError) {
    return error(res, validationError.details[0].message, 400);
  }
  
  // Proceed with update...
};
```

## Security Scenarios

### Scenario 1: Employee Tries to View All Users
**Before Fix:**
```
GET /api/users
Authorization: Bearer <employee-token>

Response: 200 OK
{
  "users": [
    { "id": "1", "name": "Admin", "salary": 100000 },
    { "id": "2", "name": "HR", "salary": 80000 },
    { "id": "3", "name": "Employee", "salary": 50000 }
  ]
}
```
❌ **Security Issue:** Employee can see everyone's salaries

**After Fix:**
```
GET /api/users
Authorization: Bearer <employee-token>

Response: 403 Forbidden
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```
✅ **Secure:** Route blocked by roleMiddleware

### Scenario 2: Employee Views Own Profile
**Before & After (Both Work):**
```
GET /api/users/employee-id
Authorization: Bearer <employee-token>

Response: 200 OK
{
  "user": {
    "id": "employee-id",
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "designation": "Software Engineer"
  }
}
```
✅ **Allowed:** getUserById checks if user is viewing own profile

### Scenario 3: Employee Tries to Update Another Employee
**Request:**
```
PUT /api/users/other-employee-id
Authorization: Bearer <employee-token>
Body: { "name": "Hacked Name" }

Response: 403 Forbidden
{
  "success": false,
  "message": "You can only update your own profile"
}
```
✅ **Blocked:** Authorization check in updateUser controller

### Scenario 4: HR Officer Views All Users
**Request:**
```
GET /api/users
Authorization: Bearer <hr-officer-token>

Response: 200 OK
{
  "users": [
    {
      "id": "1",
      "name": "Admin",
      "email": "admin@company.com",
      "role": "ADMIN",
      "basicSalary": 100000,
      "bankName": "HDFC Bank",
      "accountNumber": "123456789"
    },
    // ... more users with full details
  ]
}
```
✅ **Allowed:** HR_OFFICER role has access to sensitive data

## Frontend Integration

### Role Guards
```javascript
// frontend/src/utils/roleGuards.js

export const isAdmin = (role) => role === 'ADMIN';
export const isHR = (role) => role === 'HR_OFFICER';
export const isEmployee = (role) => role === 'EMPLOYEE';
export const canViewAllUsers = (role) => isAdmin(role) || isHR(role);
export const canManageUsers = (role) => isAdmin(role);
```

### Component-Level Protection
```jsx
// Example: Only show salary column to ADMIN/HR
{canViewAllUsers(user.role) && (
  <td className="px-6 py-4">
    ${user.basicSalary?.toLocaleString()}
  </td>
)}

// Example: Hide "Manage Users" button from employees
{canManageUsers(user.role) && (
  <button onClick={handleManageUsers}>
    Manage Users
  </button>
)}
```

### Route Protection
```jsx
// Example: Redirect employees away from admin pages
useEffect(() => {
  if (user && !canViewAllUsers(user.role)) {
    router.push('/dashboard/employee-dashboard');
  }
}, [user]);
```

## Data Visibility Matrix

| Data Field        | ADMIN | HR_OFFICER | PAYROLL_OFFICER | MANAGER | EMPLOYEE (Own) | EMPLOYEE (Others) |
|-------------------|-------|------------|-----------------|---------|----------------|-------------------|
| Name              | ✅    | ✅         | ✅              | ✅      | ✅             | ❌                |
| Email             | ✅    | ✅         | ✅              | ✅      | ✅             | ❌                |
| Role              | ✅    | ✅         | ✅              | ✅      | ✅             | ❌                |
| Department        | ✅    | ✅         | ✅              | ✅      | ✅             | ❌                |
| Designation       | ✅    | ✅         | ✅              | ✅      | ✅             | ❌                |
| Basic Salary      | ✅    | ✅         | ✅              | ❌      | ✅             | ❌                |
| Bank Details      | ✅    | ✅         | ✅              | ❌      | ✅             | ❌                |
| PAN/UAN           | ✅    | ✅         | ✅              | ❌      | ✅             | ❌                |
| Mobile/Address    | ✅    | ✅         | ❌              | ❌      | ✅             | ❌                |

## Testing Access Control

### Test 1: Employee Cannot List All Users
```bash
# Login as employee
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@company.com","password":"password"}' \
  -c cookies.txt

# Try to get all users
curl -X GET http://localhost:3000/api/users \
  -b cookies.txt

# Expected: 403 Forbidden
```

### Test 2: Employee Can View Own Profile
```bash
# Get own user ID from login response
# Then request own profile
curl -X GET http://localhost:3000/api/users/{own-id} \
  -b cookies.txt

# Expected: 200 OK with own data
```

### Test 3: HR Can View All Users
```bash
# Login as HR
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@company.com","password":"password"}' \
  -c cookies.txt

# Get all users
curl -X GET http://localhost:3000/api/users \
  -b cookies.txt

# Expected: 200 OK with all users' full data
```

### Test 4: Employee Cannot Update Others
```bash
# Login as employee
# Try to update another user
curl -X PUT http://localhost:3000/api/users/{other-id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}' \
  -b cookies.txt

# Expected: 403 Forbidden
```

## Audit Logging

All sensitive operations should be logged:

```javascript
// Example: Log when sensitive data is accessed
await logActivity(req.user.id, 'VIEW_ALL_USERS', 'USER_MANAGEMENT', {
  role: req.user.role,
  timestamp: new Date(),
  ipAddress: req.ip
});
```

## Best Practices

1. **Principle of Least Privilege**
   - Give users minimum permissions needed
   - Default deny, explicit allow

2. **Defense in Depth**
   - Protect at route level (roleMiddleware)
   - Protect at controller level (authorization checks)
   - Protect at data level (field filtering)
   - Protect at frontend level (UI guards)

3. **Consistent Enforcement**
   - All endpoints must check authentication
   - Sensitive endpoints must check authorization
   - Never trust client-side checks alone

4. **Regular Audits**
   - Review permission matrix regularly
   - Test with different roles
   - Monitor audit logs

5. **Clear Error Messages**
   - Don't leak information in error messages
   - Use 403 for authorization failures
   - Use 401 for authentication failures

## Related Files

- `backend/src/middleware/roleMiddleware.js` - Role checking middleware
- `backend/src/middleware/authMiddleware.js` - Authentication verification
- `backend/src/controllers/userController.js` - User data access control
- `backend/src/routes/*.js` - Route-level protection
- `frontend/src/utils/roleGuards.js` - Frontend role utilities
