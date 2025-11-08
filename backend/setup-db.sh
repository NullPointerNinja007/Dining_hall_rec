#!/bin/bash

# Database setup script
# This script helps set up the PostgreSQL database for the Stanford Dining Hall Ranking app

echo "🍽️  Stanford Dining Hall Database Setup"
echo "========================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Get database name
read -p "Enter database name (default: stanford_menu): " DB_NAME
DB_NAME=${DB_NAME:-stanford_menu}

# Get username (default to current user)
read -p "Enter PostgreSQL username (default: $USER): " DB_USER
DB_USER=${DB_USER:-$USER}

echo ""
echo "Creating database: $DB_NAME"
echo ""

# Create database
createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || {
    echo "⚠️  Database might already exist, continuing..."
}

# Get path to SQL file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/../stanford_menu.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found at: $SQL_FILE"
    echo "Please make sure stanford_menu.sql is in the project root directory"
    exit 1
fi

echo "✅ Found SQL file: $SQL_FILE"
echo ""
echo "Importing SQL file into database..."
echo ""

# Import SQL file
psql -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Create a .env file in the backend directory:"
    echo "   cd backend"
    echo "   cp .env.example .env"
    echo ""
    echo "2. Edit .env with your database credentials:"
    echo "   DB_NAME=$DB_NAME"
    echo "   DB_USER=$DB_USER"
    echo "   # No password needed for local setup"
    echo ""
    echo "3. Start the backend server:"
    echo "   npm start"
else
    echo ""
    echo "❌ Failed to import SQL file"
    echo "Please check the error messages above"
    exit 1
fi

