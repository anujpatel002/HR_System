# Department & Manager Assignment Feature

## Overview
Implemented department dropdown and automatic manager assignment feature for employee creation.

## Changes Made

### 1. Frontend Changes (`frontend/src/app/dashboard/admin/page.jsx`)

#### Import DEPARTMENTS Constant
```javascript
import { ROLES, DEPARTMENTS } from '../../../utils/constants';
```

#### Added State Management
- `selectedDepartment`: Tracks selected department
- `selectedRole`: Tracks selected role
- Added `watch` to form hook to monitor field changes

```javascript
const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

// Watch for department and role changes
const watchDepartment = watch('department');
const watchRole = watch('role');
```

#### Auto-Assignment Logic
Added useEffect that:
- Monitors department and role changes
- Only triggers for new employees (not editing)
- Fetches all users when department is selected and role is EMPLOYEE
- Finds manager in the selected department with MANAGER role
- Auto-populates managerId field
- Shows success toast with manager name
- Shows info toast if no manager found

```javascript
useEffect(() => {
  const autoAssignManager = async () => {
    if (!editingUser && watchDepartment && watchRole === ROLES.EMPLOYEE) {
      try {
        const response = await usersAPI.getAll({ limit: 1000 });
        const userData = response.data.data;
        const usersList = Array.isArray(userData) ? userData : (userData.users || []);
        
        const manager = usersList.find(u => 
          u.department === watchDepartment && 
          u.role === ROLES.MANAGER
        );
        
        if (manager) {
          setValue('managerId', manager.id);
          toast.success(`Auto-assigned manager: ${manager.fullName}`);
        } else {
          setValue('managerId', '');
          toast.info(`No manager found for ${watchDepartment} department`);
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
      }
    }
  };

  autoAssignManager();
}, [watchDepartment, watchRole, editingUser, setValue]);
```

#### Department Dropdown
Replaced text input with dropdown:

**Before:**
```javascript
<input
  {...register('department', {
    required: !editingUser ? 'Department is required' : false
  })}
  type="text"
  className="input-field"
  placeholder="Enter department"
/>
```

**After:**
```javascript
<select
  {...register('department', {
    required: !editingUser ? 'Department is required' : false
  })}
  className="input-field"
>
  <option value="">Select Department</option>
  {Object.entries(DEPARTMENTS).map(([key, value]) => (
    <option key={key} value={value}>
      {value}
    </option>
  ))}
</select>
```

#### Hidden Manager Field
Added hidden input to store auto-assigned manager:
```javascript
<input
  {...register('managerId')}
  type="hidden"
/>
```

### 2. Backend Changes (`backend/src/controllers/authController.js`)

#### Updated Registration Schema
Added managerId field (bank details removed - users add them later):
```javascript
const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'MANAGER').default('EMPLOYEE'),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
  basicSalary: Joi.number().positive().optional(),
  managerId: Joi.string().optional()
});
```

#### Enhanced User Registration
Modified to create employee record with manager assignment:

```javascript
const hashedPassword = await bcrypt.hash(value.password, 12);

// Extract employee-specific fields
const { managerId, ...userData } = value;

const user = await prisma.users.create({
  data: {
    ...userData,
    password: hashedPassword
  },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    department: true,
    designation: true
  }
});

// Create employee record with manager relationship if managerId provided
if (managerId) {
  await prisma.employees.create({
    data: {
      id: `EMP-${user.id.substring(0, 8)}`,
      userId: user.id,
      manager: managerId,
      updatedAt: new Date()
    }
  });
}
```

**Note:** Bank details (accountNumber, ifscCode) are NOT collected during user creation. Users can add their bank details later through their profile or HR can update them separately.

## Features

### Department Dropdown
- ✅ Replaces free-text input with dropdown
- ✅ Uses predefined DEPARTMENTS constant
- ✅ Shows 6 departments: IT, HR, FINANCE, MARKETING, OPERATIONS, SALES
- ✅ Required field validation
- ✅ Consistent data entry

### Auto-Manager Assignment
- ✅ Automatically triggers when:
  - Creating new employee (not editing)
  - Department is selected
  - Role is EMPLOYEE
- ✅ Finds manager with:
  - Matching department
  - MANAGER role
- ✅ Auto-populates managerId field
- ✅ Shows success notification with manager name
- ✅ Shows info message if no manager exists for department

### Backend Support
- ✅ Accepts managerId in registration
- ✅ Creates employee record with manager relationship
- ✅ Stores manager in employees.manager field
- ✅ Validates all input with Joi schema

## Database Schema
The feature uses existing schema:

**employees table:**
- `manager` (String, nullable): Stores the manager ID

**users table:**
- `role`: Used to identify MANAGER role
- `department`: Used to match employee with manager

## User Flow

1. **Admin opens Add User form**
2. **Fills in basic details** (name, email, password)
3. **Selects Role = EMPLOYEE**
4. **Selects Department** from dropdown (e.g., "IT")
5. **System automatically**:
   - Searches for manager in IT department
   - Finds user with role=MANAGER and department=IT
   - Auto-fills managerId field
   - Shows toast: "Auto-assigned manager: John Doe"
6. **Admin completes remaining fields** (designation, salary, etc.)
7. **Submits form**
8. **Backend**:
   - Creates user record
   - Creates employee record with manager relationship
   - Returns success

## Benefits

### For Users
- ✅ No typing errors in department names
- ✅ Consistent department naming
- ✅ Automatic manager assignment saves time
- ✅ Visual feedback via toast notifications

### For System
- ✅ Data consistency
- ✅ Enforced department values
- ✅ Proper manager-employee relationships
- ✅ Better reporting and hierarchy

### For Managers
- ✅ Automatic team assignment
- ✅ Clear organizational hierarchy
- ✅ Proper access control setup

## Testing Checklist

- [ ] Department dropdown shows all 6 departments
- [ ] Selecting department doesn't break form
- [ ] Auto-assignment works when role=EMPLOYEE
- [ ] Auto-assignment doesn't trigger when editing user
- [ ] Toast notification shows correct manager name
- [ ] Toast shows info message when no manager exists
- [ ] Form submission includes managerId
- [ ] Backend creates employee record with manager
- [ ] Manager field is stored in database
- [ ] Form validation still works correctly

## Future Enhancements

1. **Show Manager Info**: Display assigned manager name in form (not just toast)
2. **Manager Dropdown**: Allow manual manager selection/override
3. **Multiple Managers**: Support department with multiple managers
4. **Manager Hierarchy**: Support multi-level management chains
5. **Team View**: Show manager's team members in dashboard
6. **Approval Workflow**: Require manager approval for new employee

## Notes

- Manager assignment only happens for new employees, not when editing
- If no manager exists for department, field remains empty
- Hidden managerId field ensures data is submitted
- Frontend fetches up to 1000 users to find managers (may need optimization for large orgs)
- Backend creates employee record only if managerId provided
- **Bank details (Account Number, IFSC Code) are NOT collected during registration** - users add them later through their profile

## Related Files

- `frontend/src/app/dashboard/admin/page.jsx` - Main form implementation
- `frontend/src/utils/constants.js` - DEPARTMENTS constant
- `backend/src/controllers/authController.js` - Registration logic
- `backend/prisma/schema.prisma` - Database schema (employees.manager field)
