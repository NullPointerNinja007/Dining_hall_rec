/**
 * Database connection and query utilities
 * Supports PostgreSQL, MySQL, and SQLite
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'stanford_menu',
  user: process.env.DB_USER || 'asreddy',
  password: process.env.DB_PASSWORD || '', // No password for local setup
  // Connection string (alternative to above)
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create PostgreSQL connection pool
let pool = null;

/**
 * Initialize database connection
 */
function initDatabase() {
  try {
    if (dbConfig.connectionString) {
      pool = new Pool({
        connectionString: dbConfig.connectionString,
        ssl: dbConfig.ssl,
      });
    } else if (dbConfig.database) {
      pool = new Pool(dbConfig);
    } else {
      console.warn('No database configuration found. Using mock data.');
      return null;
    }

    // Test connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('✅ Database connected successfully');
      }
    });

    return pool;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return null;
  }
}

/**
 * Query database
 * @param {string} queryText - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
async function query(queryText, params = []) {
  if (!pool) {
    pool = initDatabase();
  }

  if (!pool) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await pool.query(queryText, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get dining halls with menu items for a specific date and meal
 * @param {string} date - Date in format 'YYYY-MM-DD' or 'MM/DD/YYYY'
 * @param {string} meal - Meal type: 'Breakfast', 'Lunch', 'Dinner', 'Brunch'
 * @returns {Promise<Array>} - Array of dining halls with menu items
 */
async function getDiningHallsMenu(date, meal) {
  try {
    // Convert date format if needed (MM/DD/YYYY -> YYYY-MM-DD)
    let formattedDate = date;
    if (date.includes('/')) {
      const [month, day, year] = date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Query based on the actual schema: menu_item table
    const queryText = `
      SELECT 
        hall_name,
        name as item_name,
        station,
        ingredients,
        allergens,
        diet_tags,
        category,
        notes
      FROM menu_item
      WHERE date_served = $1 AND meal_type = $2
      ORDER BY hall_name, category, name
    `;

    const result = await query(queryText, [formattedDate, meal]);

    // Transform result into expected format
    const hallsMap = new Map();

    result.rows.forEach(row => {
      const hallName = row.hall_name;
      
      if (!hallsMap.has(hallName)) {
        hallsMap.set(hallName, {
          name: hallName,
          foodItems: [],
        });
      }

      const hall = hallsMap.get(hallName);
      
      // Parse allergens (stored as TEXT, comma-separated like "SOY, WHEAT")
      let allergens = [];
      if (row.allergens) {
        allergens = row.allergens
          .split(',')
          .map(a => a.trim().toLowerCase())
          .filter(a => a.length > 0);
        
        // Map common allergen abbreviations to standard names
        const allergenMap = {
          'wheat': 'gluten',
          'milk': 'dairy',
          'eggs': 'eggs',
          'egg': 'eggs',
          'soy': 'soy',
          'fish': 'fish',
          'shellfish': 'shellfish',
          'peanuts': 'nuts',
          'peanut': 'nuts',
          'treenuts': 'nuts',
          'tree nuts': 'nuts',
          'sesame': 'nuts', // Could be separate, but grouping with nuts
        };
        
        allergens = allergens.map(a => allergenMap[a] || a);
        // Remove duplicates
        allergens = [...new Set(allergens)];
      }

      hall.foodItems.push({
        name: row.item_name,
        allergens: allergens,
        station: row.station,
        ingredients: row.ingredients,
        dietTags: row.diet_tags,
        category: row.category,
        notes: row.notes,
      });
    });

    return Array.from(hallsMap.values());
  } catch (error) {
    console.error('Error fetching dining halls menu:', error);
    throw error;
  }
}

/**
 * Get all dining halls
 * @returns {Promise<Array>} - Array of unique dining hall names
 */
async function getAllDiningHalls() {
  try {
    const queryText = 'SELECT DISTINCT hall_name FROM menu_item ORDER BY hall_name';
    const result = await query(queryText);
    return result.rows.map(row => row.hall_name);
  } catch (error) {
    console.error('Error fetching dining halls:', error);
    throw error;
  }
}

/**
 * Get available dates in the database
 * @returns {Promise<Array>} - Array of available dates
 */
async function getAvailableDates() {
  try {
    const queryText = 'SELECT DISTINCT date_served FROM menu_item ORDER BY date_served';
    const result = await query(queryText);
    return result.rows.map(row => row.date_served);
  } catch (error) {
    console.error('Error fetching available dates:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  query,
  getDiningHallsMenu,
  getAllDiningHalls,
  getAvailableDates,
  closeDatabase,
};

