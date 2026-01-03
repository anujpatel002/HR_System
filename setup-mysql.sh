#!/bin/bash

# MySQL Setup Script for WorkZen HR System
# This script helps set up the MySQL database

echo "🚀 WorkZen MySQL Setup Script"
echo "================================"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo "Please install MySQL first:"
    echo "  - Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "  - macOS: brew install mysql"
    echo "  - Windows: Download from https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

echo "✅ MySQL is installed"
echo ""

# Get database credentials
read -p "Enter MySQL username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "Enter MySQL password: " MYSQL_PASS
echo ""

read -p "Enter database name (default: hr_system): " DB_NAME
DB_NAME=${DB_NAME:-hr_system}

read -p "Enter MySQL host (default: localhost): " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}

read -p "Enter MySQL port (default: 3306): " MYSQL_PORT
MYSQL_PORT=${MYSQL_PORT:-3306}

echo ""
echo "Creating database..."

# Create database
mysql -u"$MYSQL_USER" -p"$MYSQL_PASS" -h"$MYSQL_HOST" -P"$MYSQL_PORT" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Create .env file
echo ""
echo "Creating .env file..."

cd backend

if [ ! -f .env.example ]; then
    echo "❌ .env.example not found"
    exit 1
fi

# Generate DATABASE_URL
DATABASE_URL="mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:${MYSQL_PORT}/${DB_NAME}"

# Copy .env.example to .env
cp .env.example .env

# Update DATABASE_URL in .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
else
    # Linux
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
fi

echo "✅ .env file created"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

# Run migrations
echo ""
echo "Running database migrations..."
npx prisma migrate dev --name init

if [ $? -ne 0 ]; then
    echo "❌ Failed to run migrations"
    exit 1
fi

echo "✅ Migrations completed"

# Seed database
echo ""
read -p "Do you want to seed the database with default users? (y/n): " SEED_DB

if [ "$SEED_DB" = "y" ] || [ "$SEED_DB" = "Y" ]; then
    echo "Seeding database..."
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
        echo ""
        echo "📝 Default Login Accounts:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Admin:"
        echo "  Email: admin@workzen.com"
        echo "  Password: admin123"
        echo ""
        echo "HR Officer:"
        echo "  Email: hr@workzen.com"
        echo "  Password: hr123"
        echo ""
        echo "Payroll Officer:"
        echo "  Email: payroll@workzen.com"
        echo "  Password: payroll123"
        echo ""
        echo "Employee:"
        echo "  Email: john.doe@workzen.com"
        echo "  Password: employee123"
    else
        echo "❌ Failed to seed database"
    fi
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the backend server:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Server will run on: http://localhost:5000"
