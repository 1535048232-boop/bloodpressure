#!/bin/bash

# Blood Pressure App Start Script
echo "🩺 Starting Blood Pressure Recording App..."

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    echo "📦 Docker found, starting with docker-compose..."
    docker-compose up -d
    echo "✅ App started with Docker!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "📚 Health check: http://localhost:3001/api/health"
else
    echo "⚙️ Docker not found, starting in development mode..."

    # Start backend
    echo "🔧 Starting backend server..."
    cd backend
    npm install 2>/dev/null || true
    npm run dev &
    BACKEND_PID=$!
    cd ..

    # Wait for backend to start
    sleep 3

    # Start frontend
    echo "🌐 Starting frontend server..."
    cd frontend
    npm install 2>/dev/null || true
    npm start &
    FRONTEND_PID=$!
    cd ..

    echo "✅ App started in development mode!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3001"
    echo "📚 Health check: http://localhost:3001/api/health"
    echo ""
    echo "⏹️ To stop: Press Ctrl+C and run: kill $BACKEND_PID $FRONTEND_PID"
fi

echo ""
echo "🎉 Blood Pressure App is ready!"
echo "👥 Create a new account or login to start recording your blood pressure."