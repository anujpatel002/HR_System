# MySQL Migration Guide

This project has been converted from PostgreSQL to MySQL. Follow this guide to set up the database.

## Prerequisites

1. **Install MySQL**
   - Download and install MySQL Server from: https://dev.mysql.com/downloads/mysql/
   - Or use MySQL with XAMPP/WAMP/MAMP
   - Recommended: MySQL 8.0 or higher

2. **Verify MySQL Installation**
   ```bash
   mysql --version
   ```

## Database Setup

### Step 1: Create Database

Connect to MySQL:
```bash
mysql -u root -p
```

Create the database:
```sql
CREATE DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 2: Configure Environment

1. Copy the environment example:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="mysql://root:your_password@localhost:3306/hr_system"
   ```

   Format: `mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`

   Examples:
   - Local: `mysql://root:password@localhost:3306/hr_system`
   - With socket: `mysql://root:password@localhost:3306/hr_system?socket=/tmp/mysql.sock`
   - SSL: `mysql://root:password@localhost:3306/hr_system?sslmode=require`

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Create Database Schema

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables
- Set up relationships
- Create indexes
- Apply the schema to your MySQL database

### Step 6: Seed Database

```bash
npm run seed
```

This creates default users:
- **Admin**: admin@workzen.com / admin123
- **HR Officer**: hr@workzen.com / hr123
- **Payroll Officer**: payroll@workzen.com / payroll123
- **Employee**: john.doe@workzen.com / employee123

### Step 7: Start the Server

```bash
npm run dev
```

Server will start on http://localhost:5000

## Key Differences from PostgreSQL

### 1. **Enum Handling**
MySQL stores enums differently than PostgreSQL. Prisma handles this automatically.

### 2. **JSON Fields**
MySQL supports JSON natively. No changes needed in code.

### 3. **Date/Time Types**
- PostgreSQL `TIMESTAMP` → MySQL `DATETIME`
- Prisma abstracts this difference

### 4. **ID Strategy**
Both databases support string IDs (used by this project via UUID/CUID).

## Prisma Commands Reference

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Troubleshooting

### Connection Issues

**Error: "Can't reach database server"**
- Verify MySQL is running: `sudo service mysql status` (Linux) or check Services (Windows)
- Check host and port in DATABASE_URL
- Verify firewall settings

**Error: "Access denied for user"**
- Check username and password in DATABASE_URL
- Grant proper permissions:
  ```sql
  GRANT ALL PRIVILEGES ON hr_system.* TO 'root'@'localhost';
  FLUSH PRIVILEGES;
  ```

### Migration Issues

**Error: "Database 'hr_system' does not exist"**
- Create the database manually first (see Step 1)

**Error: "Table already exists"**
- Reset migrations: `npx prisma migrate reset`
- Or drop the database and recreate it

### Character Encoding Issues

Ensure database uses UTF-8:
```sql
ALTER DATABASE hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Production Deployment

### Environment Variables

Set these on your hosting platform:
```env
DATABASE_URL="mysql://user:password@host:3306/database"
JWT_SECRET="your-production-secret"
NODE_ENV="production"
PORT=5000
FRONTEND_URL="https://your-domain.com"
```

### Hosting Recommendations

1. **PlanetScale** (MySQL)
   - Serverless MySQL platform
   - Automatic scaling
   - Free tier available

2. **AWS RDS MySQL**
   - Managed MySQL service
   - High availability
   - Automated backups

3. **Google Cloud SQL**
   - Fully managed MySQL
   - Integrated with GCP services

4. **DigitalOcean MySQL**
   - Managed database
   - Easy setup
   - Affordable pricing

### Deployment Steps

1. Set up MySQL database on your hosting platform
2. Get connection string from your provider
3. Update DATABASE_URL environment variable
4. Deploy backend code
5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
6. Optionally run seed script for initial data

## Backup and Restore

### Backup Database
```bash
mysqldump -u root -p hr_system > backup.sql
```

### Restore Database
```bash
mysql -u root -p hr_system < backup.sql
```

### Prisma Studio
For visual database management:
```bash
npx prisma studio
```

Access at: http://localhost:5555

## Performance Tips

1. **Indexes**: Already configured in Prisma schema
2. **Connection Pooling**: Prisma handles this automatically
3. **Query Optimization**: Use Prisma's select and include strategically
4. **Caching**: Consider implementing Redis for frequently accessed data

## Security Notes

1. **Never commit .env file** - It's already in .gitignore
2. **Use strong passwords** in production
3. **Enable SSL/TLS** for database connections in production
4. **Regular backups** - Set up automated backup schedule
5. **Limit database user permissions** - Don't use root in production

## Support

If you encounter issues:
1. Check Prisma documentation: https://www.prisma.io/docs
2. MySQL documentation: https://dev.mysql.com/doc/
3. Verify all environment variables are correct
4. Check MySQL error logs
5. Use `npx prisma studio` to inspect database state
