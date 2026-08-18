@echo off
REM Start script for Community Hub Server (Windows)
REM This script handles initial setup and starts the server

echo ============================================================
echo    Akili Community Hub - Startup Script (Windows)
echo ============================================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo [OK] Created .env file. Please edit it with your settings.
        echo.
        echo Press any key to continue or Ctrl+C to exit and edit .env first...
        pause >nul
    ) else (
        echo [ERROR] .env.example not found. Cannot create .env file.
        exit /b 1
    )
)

REM Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

REM Check if database exists
if not exist data\hub.db (
    echo [INFO] Database not found. Running migrations...
    call npm run migrate
    if errorlevel 1 (
        echo [ERROR] Migration failed
        exit /b 1
    )
    echo [OK] Database created
    echo.
    
    echo [INFO] Seeding database with initial data...
    call npm run seed
    if errorlevel 1 (
        echo [ERROR] Seeding failed
        exit /b 1
    )
    echo [OK] Database seeded
    echo.
) else (
    echo [OK] Database exists
    echo.
)

REM Start the server
echo [INFO] Starting Community Hub Server...
echo.

call npm start




