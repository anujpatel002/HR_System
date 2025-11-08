# Quick Start - Testing Department & Manager Assignment

## Prerequisites
✅ Backend server running on port 5000
✅ Frontend server running on port 3000
✅ Database connected with Prisma
✅ At least one MANAGER user exists in each department for testing

## Step 1: Create Test Managers (if needed)

Before testing employee creation, ensure you have managers in departments:

```bash
# Example: Create IT Manager
POST http://localhost:5000/api/auth/register
{
  "name": "John Manager",
  "email": "john.manager@company.com",
  "password": "manager123",
  "role": "MANAGER",
  "department": "IT",
  "designation": "IT Manager",
  "basicSalary": 80000
}

# Example: Create HR Manager
POST http://localhost:5000/api/auth/register
{
  "name": "Sarah HR",
  "email": "sarah.hr@company.com",
  "password": "manager123",
  "role": "MANAGER",
  "department": "HR",
  "designation": "HR Manager",
  "basicSalary": 75000
}
```

## Step 2: Start Servers

### Backend
```powershell
cd d:\Projects\HR_System\backend
npm run dev
```

### Frontend (in new terminal)
```powershell
cd d:\Projects\HR_System\frontend
npm run dev
```

## Step 3: Login as Admin

1. Navigate to http://localhost:3000/auth/login
2. Login with admin credentials
3. Go to Admin Dashboard

## Step 4: Test Department Dropdown

1. Click **"Add New User"** button
2. Verify **Department** field is now a dropdown (not text input)
3. Click dropdown - should show:
   - Select Department (placeholder)
   - IT
   - HR
   - FINANCE
   - MARKETING
   - OPERATIONS
   - SALES

## Step 5: Test Auto-Manager Assignment

### Scenario A: Create Employee with Manager
1. Fill in:
   - Name: "Alice Employee"
   - Email: "alice@company.com"
   - Password: "test1234"
   - **Role: Select "EMPLOYEE"**
   - **Department: Select "IT"**
2. Watch for toast notification: ✅ "Auto-assigned manager: John Manager"
3. Complete remaining fields:
   - Designation: "Software Developer"
   - Basic Salary: 50000
4. Click "Add User"
5. Verify success

### Scenario B: Create Employee without Manager
1. Click "Add New User" again
2. Fill in:
   - Name: "Bob Employee"
   - Email: "bob@company.com"
   - Password: "test1234"
   - **Role: "EMPLOYEE"**
   - **Department: "FINANCE"** (assuming no manager exists)
3. Watch for info notification: ℹ️ "No manager found for FINANCE department"
4. Complete form and submit
5. Should still create successfully (manager field empty)

### Scenario C: Create Non-Employee User
1. Click "Add New User" again
2. Fill in:
   - Name: "Charlie HR"
   - Email: "charlie@company.com"
   - Password: "test1234"
   - **Role: "HR_OFFICER"**
   - **Department: "HR"**
3. Should NOT show manager assignment toast (only for employees)
4. Complete form and submit

## Step 6: Verify Database

Check if employee record was created with manager:

```sql
-- Check employees table
SELECT e.id, e.userId, e.manager, u.name, u.role, u.department
FROM employees e
JOIN users u ON e.userId = u.id
WHERE u.email = 'alice@company.com';

-- Should show manager field populated with manager's ID
```

## Expected Results

### Department Dropdown
✅ Shows dropdown instead of text input
✅ Contains all 6 departments
✅ Required field validation works
✅ Can't submit without selecting department

### Auto-Manager Assignment
✅ Triggers only when role = EMPLOYEE
✅ Triggers only when creating new user (not editing)
✅ Finds correct manager for department
✅ Shows success toast with manager name
✅ Shows info toast if no manager found
✅ Doesn't interfere with other roles

### Backend
✅ Accepts managerId in registration
✅ Creates user record successfully
✅ Creates employee record with manager field
✅ Returns proper success response

## Common Issues & Solutions

### Issue: No managers found toast always appears
**Solution**: Create manager users for each department first

### Issue: TypeError on manager assignment
**Solution**: Ensure API returns array in correct format (check admin-overview fix)

### Issue: Form doesn't show dropdown
**Solution**: Verify DEPARTMENTS imported in admin/page.jsx

### Issue: Manager field not saving
**Solution**: Check backend creates employee record with manager field

### Issue: Auto-assignment not triggering
**Solution**: 
- Verify useEffect dependencies correct
- Check watchDepartment and watchRole have values
- Ensure not editing existing user

## Testing Checklist

Frontend:
- [ ] Department shows as dropdown
- [ ] All 6 departments visible in dropdown
- [ ] Can select department from dropdown
- [ ] Auto-assignment triggers for employees
- [ ] Toast shows correct manager name
- [ ] Toast shows when no manager exists
- [ ] Hidden managerId field exists in form
- [ ] Form submits successfully

Backend:
- [ ] Registration accepts managerId
- [ ] Registration accepts accountNumber
- [ ] Registration accepts ifscCode
- [ ] User record created in users table
- [ ] Employee record created in employees table
- [ ] Manager field populated in employees table
- [ ] No errors in server logs

Database:
- [ ] New user exists in users table
- [ ] New employee exists in employees table
- [ ] Manager field contains correct ID
- [ ] accountNumber and ifscCode stored if provided

## Next Steps After Testing

If all tests pass:
1. ✅ Feature is complete and working
2. Create managers for all departments
3. Train users on new dropdown feature
4. Monitor manager assignments in production

If tests fail:
1. Check console errors (F12 in browser)
2. Check backend logs
3. Verify database schema matches
4. Review DEPARTMENT_MANAGER_FEATURE.md for implementation details
