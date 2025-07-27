#!/bin/bash

echo "🎯 AI-Powered Task Manager - Startup Script"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Required Environment Variables
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
DATABASE_URL=postgresql://postgres:password@db:5432/taskmanager

# Optional Environment Variables
SUPABASE_URL=
SUPABASE_KEY=
EOF
    echo "✅ .env file created. Please update it with your OpenAI API key."
    echo "🔑 Get your OpenAI API key from: https://platform.openai.com/api-keys"
    echo ""
    echo "⚠️  Please edit the .env file and add your OpenAI API key before continuing."
    echo "Press Enter when you're ready to continue..."
    read
fi

# Check if OpenAI API key is set
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Please set your OpenAI API key in the .env file before continuing."
    echo "🔑 Get your OpenAI API key from: https://platform.openai.com/api-keys"
    exit 1
fi

echo "🚀 Starting the application..."
echo "This may take a few minutes on first run..."

# Build and start the services
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📝 To stop the application, run: docker-compose down"
    echo "📝 To view logs, run: docker-compose logs -f"
    echo ""
    echo "🎉 Happy task managing!"
else
    echo "❌ Some services failed to start. Check the logs with: docker-compose logs"
    exit 1
fi 