#!/bin/bash

# Start script for Stanford Dining Hall Ranking App
# This script starts both the backend and frontend servers

echo "🚀 Starting Stanford Dining Hall Ranking App..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready -U asreddy -d stanford_menu > /dev/null 2>&1; then
    echo "⚠️  Warning: PostgreSQL database might not be running or accessible"
    echo "   The app will fall back to hardcoded data if the database is unavailable"
    echo ""
fi

# Check if database has data
DB_COUNT=$(psql -U asreddy -d stanford_menu -t -c "SELECT COUNT(*) FROM menu_item;" 2>/dev/null | tr -d ' ')
if [ -z "$DB_COUNT" ] || [ "$DB_COUNT" = "0" ]; then
    echo "⚠️  Warning: Database appears to be empty"
    echo "   Run: cd backend && ./setup-db.sh"
    echo ""
fi

# Start both servers
echo "📦 Starting backend server (port 3001)..."
echo "📦 Starting frontend server (port 5173)..."
echo ""
echo "✅ Servers starting! Open http://localhost:5173 in your browser"
echo ""

npm start

