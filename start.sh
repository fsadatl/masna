#!/bin/bash

# Startup script for Idea to Project Platform
echo "🚀 Starting Idea to Project Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before running again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p logs

# Start services with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if database is ready
echo "🗄️  Checking database connection..."
until docker-compose -f docker-compose.dev.yml exec -T db pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done

# Create database tables
echo "📊 Creating database tables..."
docker-compose -f docker-compose.dev.yml exec backend python create_tables.py

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ All services are running!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Register a new account"
    echo "   3. Start using the platform!"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "   Restart services: docker-compose -f docker-compose.dev.yml restart"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi
