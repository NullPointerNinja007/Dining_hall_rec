# Backend API Server

Express server for fetching dining hall data from the database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `backend` directory with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password

# OR use a connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Server Port
PORT=3001
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### GET /health
Health check endpoint.

### GET /api/menu
Get dining hall menus for a specific date and meal.

**Query Parameters:**
- `date` (required): Date in format `MM/DD/YYYY` or `YYYY-MM-DD`
- `meal` (optional): Meal type (`Breakfast`, `Lunch`, `Dinner`, `Brunch`). Defaults to `Dinner`.

**Example:**
```
GET /api/menu?date=11/15/2024&meal=Dinner
```

**Response:**
```json
[
  {
    "name": "Arrillaga Family Dining Commons",
    "foodItems": [
      {
        "name": "Grilled Chicken Breast",
        "allergens": ["dairy"],
        "description": "...",
        "category": "Main"
      }
    ]
  }
]
```

### GET /api/dining-halls
Get all dining halls.

**Response:**
```json
["Arrillaga Family Dining Commons", "Ricker Dining", ...]
```

## Database Schema

The database uses a single `menu_item` table as defined in `scraped_stanford_menu.sql`:

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

To set up the database:

1. Create the database:
```bash
createdb stanford_menu
```

2. Import the SQL file from the project root:
```bash
psql -d stanford_menu -f ../scraped_stanford_menu.sql
```

The SQL queries in `db.js` are already configured for this schema.

