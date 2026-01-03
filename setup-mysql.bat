@echo off
REM MySQL Setup Script for WorkZen HR System (Windows)
REM This script helps set up the MySQL database

echo ================================
echo WorkZen MySQL Setup Script
echo ================================
echo.

REM Check if MySQL is in PATH
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] MySQL is not installed or not in PATH!
    echo Please install MySQL first:
    echo   Download from https://dev.mysql.com/downloads/mysql/
    echo.
    echo Or add MySQL to PATH:
    echo   C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

echo [OK] MySQL is installed
echo.

REM Get database credentials
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASS="Enter MySQL password: "

set /p DB_NAME="Enter database name (default: hr_system): "
if "%DB_NAME%"=="" set DB_NAME=hr_system

set /p MYSQL_HOST="Enter MySQL host (default: localhost): "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set /p MYSQL_PORT="Enter MySQL port (default: 3306): "
if "%MYSQL_PORT%"=="" set MYSQL_PORT=3306

echo.
echo Creating database...

REM Create database
mysql -u%MYSQL_USER% -p%MYSQL_PASS% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %errorlevel% equ 0 (
    echo [OK] Database '%DB_NAME%' created successfully
) else (
    echo [ERROR] Failed to create database
    pause
    exit /b 1
)

REM Navigate to backend directory
cd backend

if not exist .env.example (
    echo [ERROR] .env.example not found
    pause
    exit /b 1
)

echo.
echo Creating .env file...

REM Create .env from .env.example
copy .env.example .env >nul

REM Create temp file with DATABASE_URL
set DATABASE_URL=mysql://%MYSQL_USER%:%MYSQL_PASS%@%MYSQL_HOST%:%MYSQL_PORT%/%DB_NAME%

REM Update DATABASE_URL in .env
powershell -Command "(gc .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=\"%DATABASE_URL%\"' | Out-File -encoding ASCII .env"

echo [OK] .env file created
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

echo [OK] Prisma client generated
echo.

REM Run migrations
echo Running database migrations...
call npx prisma migrate dev --name init

if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)

echo [OK] Migrations completed
echo.

REM Seed database
set /p SEED_DB="Do you want to seed the database with default users? (y/n): "

if /i "%SEED_DB%"=="y" (
    echo Seeding database...
    call npm run seed
    
    if %errorlevel% equ 0 (
        echo [OK] Database seeded successfully
        echo.
        echo ================================
        echo Default Login Accounts:
        echo ================================
        echo.
        echo Admin:
        echo   Email: admin@workzen.com
        echo   Password: admin123
        echo.
        echo HR Officer:
        echo   Email: hr@workzen.com
        echo   Password: hr123
        echo.
        echo Payroll Officer:
        echo   Email: payroll@workzen.com
        echo   Password: payroll123
        echo.
        echo Employee:
        echo   Email: john.doe@workzen.com
        echo   Password: employee123
        echo.
    ) else (
        echo [ERROR] Failed to seed database
    )
)

echo.
echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo To start the backend server:
echo   cd backend
echo   npm run dev
echo.
echo Server will run on: http://localhost:5000
echo.
pause
