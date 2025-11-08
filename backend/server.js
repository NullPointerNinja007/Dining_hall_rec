/**
 * Express server for dining hall ranking API
 */

const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.initDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get dining halls menu for a specific date and meal
app.get('/api/menu', async (req, res) => {
  try {
    const { date, meal = 'Dinner' } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const diningHalls = await db.getDiningHallsMenu(date, meal);
    res.json(diningHalls);
  } catch (error) {
    console.error('Error in /api/menu:', error);
    res.status(500).json({ error: 'Failed to fetch dining hall menu', details: error.message });
  }
});

// Get all dining halls
app.get('/api/dining-halls', async (req, res) => {
  try {
    const diningHalls = await db.getAllDiningHalls();
    res.json(diningHalls);
  } catch (error) {
    console.error('Error in /api/dining-halls:', error);
    res.status(500).json({ error: 'Failed to fetch dining halls', details: error.message });
  }
});

// Get available dates
app.get('/api/dates', async (req, res) => {
  try {
    const dates = await db.getAvailableDates();
    res.json(dates);
  } catch (error) {
    console.error('Error in /api/dates:', error);
    res.status(500).json({ error: 'Failed to fetch available dates', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🍽️  Menu API: http://localhost:${PORT}/api/menu?date=MM/DD/YYYY&meal=Dinner`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await db.closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await db.closeDatabase();
  process.exit(0);
});

