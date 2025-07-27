@echo off
echo 🎯 AI-Powered Task Manager - Startup Script
echo ==============================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo 📝 Creating .env file...
    (
        echo # Required Environment Variables
        echo OPENAI_API_KEY=your_openai_api_key_here
        echo JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
        echo DATABASE_URL=postgresql://postgres:password@db:5432/taskmanager
        echo.
        echo # Optional Environment Variables
        echo SUPABASE_URL=
        echo SUPABASE_KEY=
    ) > .env
    echo ✅ .env file created. Please update it with your OpenAI API key.
    echo 🔑 Get your OpenAI API key from: https://platform.openai.com/api-keys
    echo.
    echo ⚠️  Please edit the .env file and add your OpenAI API key before continuing.
    echo Press any key when you're ready to continue...
    pause >nul
)

REM Check if OpenAI API key is set
findstr /C:"your_openai_api_key_here" .env >nul
if not errorlevel 1 (
    echo ⚠️  Please set your OpenAI API key in the .env file before continuing.
    echo 🔑 Get your OpenAI API key from: https://platform.openai.com/api-keys
    pause
    exit /b 1
)

echo 🚀 Starting the application...
echo This may take a few minutes on first run...

REM Build and start the services
docker-compose up --build -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check if services are running
docker-compose ps | findstr "Up" >nul
if not errorlevel 1 (
    echo.
    echo ✅ Application is running successfully!
    echo.
    echo 🌐 Access your application:
    echo    Frontend: http://localhost:3000
    echo    Backend API: http://localhost:8000
    echo    API Documentation: http://localhost:8000/docs
    echo.
    echo 📝 To stop the application, run: docker-compose down
    echo 📝 To view logs, run: docker-compose logs -f
    echo.
    echo 🎉 Happy task managing!
) else (
    echo ❌ Some services failed to start. Check the logs with: docker-compose logs
    pause
    exit /b 1
)

pause 