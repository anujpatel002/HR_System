# Database Schema Update Instructions

## ✅ Changes Made:

1. **Added `password_resets` table** to Prisma schema
2. **Confirmed `company` and `companyId` are optional** in users table
3. **Fixed backend code** to handle optional company fields

## 🔧 To Apply Changes:

### Step 1: Stop the backend server
Press `Ctrl+C` in the backend terminal

### Step 2: Run Prisma commands
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Step 3: Restart the backend server
```bash
npm run dev
```

## 📋 What This Fixes:

✅ **User creation from admin dashboard** - No longer requires company fields
✅ **Password reset functionality** - Now has proper database table
✅ **Manager assignment** - Works correctly for employees
✅ **Public signup** - Still creates admin with company info

## 🎯 Testing:

After applying changes, test:
1. Create user from admin dashboard ✓
2. Assign manager to employee ✓
3. Password reset flow ✓
4. Public signup ✓

---

**Note:** If `npx prisma generate` fails due to file lock, close the backend server completely and try again.
