# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Stanford Dining Hall Ranking app.

## Quick Setup (Automated)

For a quick setup, use the provided script:

```bash
cd backend
./setup-db.sh
```

This script will:
- Check if PostgreSQL is installed
- Create the database
- Import the SQL file from the project root (`scraped_stanford_menu.sql`)
- Guide you through the next steps

## Database Schema

The database uses a single table `menu_item` as defined in `scraped_stanford_menu.sql` (located in the project root directory).

The SQL file contains:
- Table creation statement
- Sample data for dining hall menus

**Note:** The `scraped_stanford_menu.sql` file is already in the project root directory. You don't need to download it separately.

```sql
CREATE TABLE menu_item (
    item_id SERIAL PRIMARY KEY,
    hall_name TEXT NOT NULL,
    date_served DATE NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Brunch')),
    name TEXT NOT NULL,
    station TEXT,
    ingredients TEXT,
    made_on_shared_equipment TEXT,
    allergens TEXT,
    diet_tags TEXT,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Setup Steps

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Option 1: Using createdb command (simpler)
createdb stanford_menu

# Option 2: Using psql
psql postgres

# Then in psql:
CREATE DATABASE stanford_menu;

# Create user (optional, if you want a specific user)
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stanford_menu TO your_username;

# Exit
\q
```

### 3. Import SQL File

The SQL file `scraped_stanford_menu.sql` is already in the project root directory. Import it:

```bash
# From the project root directory
psql -d stanford_menu -U your_username -f scraped_stanford_menu.sql

# Or if you're in a different directory, use the full path
psql -d stanford_menu -U your_username -f /path/to/Dining\ Hall\ Ranking/scraped_stanford_menu.sql
```

**Note:** Make sure you're in the project root directory or provide the correct path to the SQL file.

### 4. Configure Backend

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stanford_menu
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3001
```

**OR** use a connection string:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/stanford_menu
```

### 5. Install Backend Dependencies

```bash
cd backend
npm install
```

### 6. Start Backend Server

```bash
npm start
```

The server should start on `http://localhost:3001`

### 7. Test the Connection

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test menu endpoint
curl "http://localhost:3001/api/menu?date=11/08/2025&meal=Dinner"
```

### 8. Update Frontend Configuration

The frontend will automatically try to connect to the backend at `http://localhost:3001`. 

If your backend is on a different URL, create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Cloud Database Options

### Heroku Postgres
```bash
heroku addons:create heroku-postgresql:mini
heroku config:get DATABASE_URL
```

### Railway
1. Create a new PostgreSQL database on Railway
2. Copy the connection string
3. Add it to your `.env` file as `DATABASE_URL`

### Supabase
1. Create a new project on Supabase
2. Go to Settings > Database
3. Copy the connection string
4. Add it to your `.env` file

## Troubleshooting

### Connection refused
- Make sure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check if the port is correct (default: 5432)

### Authentication failed
- Verify username and password in `.env`
- Check PostgreSQL user permissions

### Database does not exist
- Make sure you created the database: `CREATE DATABASE stanford_menu;`
- Verify the database name in `.env`

### Table does not exist
- Make sure you imported the SQL file: `psql -d stanford_menu -f scraped_stanford_menu.sql`
- Check if the table exists: `\dt` in psql

## Database Queries

### View all dining halls
```sql
SELECT DISTINCT hall_name FROM menu_item ORDER BY hall_name;
```

### View menu for a specific date and meal
```sql
SELECT * FROM menu_item 
WHERE date_served = '2025-11-08' AND meal_type = 'Dinner'
ORDER BY hall_name, category;
```

### Count items per dining hall
```sql
SELECT hall_name, COUNT(*) as item_count 
FROM menu_item 
GROUP BY hall_name 
ORDER BY hall_name;
```

