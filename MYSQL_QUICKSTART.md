# Quick Start Guide - MySQL Migration

## ✅ Migration Complete!

Your WorkZen HR System has been successfully converted from PostgreSQL to MySQL.

## 🚀 Quick Setup (3 Steps)

### Option 1: Automated Setup (Recommended)

**Windows:**
```cmd
setup-mysql.bat
```

**Linux/macOS:**
```bash
chmod +x setup-mysql.sh
./setup-mysql.sh
```

The script will:
- ✅ Create MySQL database
- ✅ Generate .env configuration
- ✅ Install dependencies
- ✅ Run migrations
- ✅ Seed default users

### Option 2: Manual Setup

**Step 1: Create MySQL Database**
```sql
mysql -u root -p
CREATE DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Step 2: Configure Environment**
```bash
cd backend
cp .env.example .env
```

Edit `.env` and update:
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/hr_system"
```

**Step 3: Setup & Run**
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npm run seed

# Start server
npm run dev
```

## 📝 Default Login Accounts

After seeding:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@workzen.com | admin123 |
| HR Officer | hr@workzen.com | hr123 |
| Payroll Officer | payroll@workzen.com | payroll123 |
| Employee | john.doe@workzen.com | employee123 |

## 📚 Documentation

- **Full Setup Guide**: [MYSQL_MIGRATION_GUIDE.md](MYSQL_MIGRATION_GUIDE.md)
- **Migration Details**: [POSTGRESQL_TO_MYSQL_MIGRATION.md](POSTGRESQL_TO_MYSQL_MIGRATION.md)
- **Backend README**: [backend/README.md](backend/README.md)

## 🔧 What Changed?

### ✅ Files Modified
- `backend/prisma/schema.prisma` - Updated to MySQL
- `backend/.env.example` - MySQL connection string
- `README.md` - Updated tech stack
- `backend/README.md` - MySQL instructions

### ❌ No Code Changes Required
- All controllers work as-is
- All routes work as-is  
- All middleware work as-is
- Prisma ORM abstracts database differences

## 🐛 Troubleshooting

**MySQL not installed?**
- Windows: https://dev.mysql.com/downloads/mysql/
- macOS: `brew install mysql`
- Ubuntu: `sudo apt-get install mysql-server`

**Connection refused?**
- Verify MySQL is running: `sudo service mysql status`
- Check credentials in `.env`

**Database doesn't exist?**
- Run: `CREATE DATABASE hr_system;` in MySQL

**Migration errors?**
- Delete and recreate database
- Run `npx prisma migrate reset`

## 🎯 Next Steps

1. ✅ Complete setup (see above)
2. 🚀 Start backend: `cd backend && npm run dev`
3. 🌐 Start frontend: `cd frontend && npm run dev`
4. 📱 Access app: http://localhost:3000

## 💡 Why MySQL?

- ✅ Most popular open-source database
- ✅ More hosting options
- ✅ Better for read-heavy workloads
- ✅ Lower hosting costs
- ✅ Wider community support
- ✅ More GUI management tools

## 🆘 Need Help?

Check these files for detailed information:
1. **MYSQL_MIGRATION_GUIDE.md** - Complete setup & troubleshooting
2. **POSTGRESQL_TO_MYSQL_MIGRATION.md** - Technical migration details
3. **backend/README.md** - Backend API documentation

---

**Ready to go! 🎉**

Run the setup script or follow manual steps above to get started with MySQL.
