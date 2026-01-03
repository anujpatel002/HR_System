@echo off
echo ================================
echo MySQL Setup for HR System
echo ================================
echo.

echo Step 1: Create database manually in MySQL
echo Please run these commands in MySQL Workbench or MySQL Command Line:
echo.
echo mysql -u system -p
echo (enter password: 1234)
echo.
echo Then run:
echo CREATE DATABASE IF NOT EXISTS hr_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo EXIT;
echo.
pause

echo.
echo Step 2: Stopping any running backend servers...
taskkill /F /IM node.exe 2>nul

echo.
echo Step 3: Cleaning Prisma cache...
timeout /t 2 >nul
rmdir /S /Q node_modules\.prisma 2>nul

echo.
echo Step 4: Generating Prisma client...
call npx prisma generate

if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    echo Please close VS Code and any running Node processes, then try again
    pause
    exit /b 1
)

echo.
echo Step 5: Running migrations...
call npx prisma migrate dev --name init

if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)

echo.
echo Step 6: Seeding database...
call npm run seed

if %errorlevel% neq 0 (
    echo [WARNING] Seed failed, but you can continue
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Default accounts:
echo - Admin: admin@workzen.com / admin123
echo - HR: hr@workzen.com / hr123
echo - Payroll: payroll@workzen.com / payroll123
echo - Employee: john.doe@workzen.com / employee123
echo.
echo To start the server:
echo   npm run dev
echo.
pause
