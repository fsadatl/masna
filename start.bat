@echo off
echo 🚀 Starting Idea to Project Platform...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your configuration before running again.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist uploads mkdir uploads
if not exist logs mkdir logs

REM Start services with Docker Compose
echo 🐳 Starting services with Docker Compose...
docker-compose -f docker-compose.dev.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if database is ready
echo 🗄️  Checking database connection...
:check_db
docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    echo    Waiting for database...
    timeout /t 2 /nobreak >nul
    goto check_db
)

REM Create database tables
echo 📊 Creating database tables...
docker-compose -f docker-compose.dev.yml exec backend python create_tables.py

REM Check if services are running
echo 🔍 Checking service status...
docker-compose -f docker-compose.dev.yml ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ All services are running!
    echo.
    echo 🌐 Access URLs:
    echo    Frontend: http://localhost:3000
    echo    Backend API: http://localhost:8000
    echo    API Documentation: http://localhost:8000/docs
    echo.
    echo 📋 Next steps:
    echo    1. Open http://localhost:3000 in your browser
    echo    2. Register a new account
    echo    3. Start using the platform!
    echo.
    echo 🛠️  Useful commands:
    echo    View logs: docker-compose -f docker-compose.dev.yml logs -f
    echo    Stop services: docker-compose -f docker-compose.dev.yml down
    echo    Restart services: docker-compose -f docker-compose.dev.yml restart
) else (
    echo ❌ Some services failed to start. Check logs with: docker-compose -f docker-compose.dev.yml logs
    exit /b 1
)

pause
