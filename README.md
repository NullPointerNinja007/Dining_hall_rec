# Stanford Dining Hall Ranking

A web-based application to rank Stanford Dining Halls based on user preferences and dietary needs.

## Features

- 🎨 Beautiful gradient landing page with search functionality
- 🔍 Natural language search (e.g., "I want chicken", "Rank based on beef")
- 📊 Ranked results with dining hall information
- 🏷️ Allergen badges for each food item
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for database backend - optional)

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. (Optional) Set up the database backend:
   - The SQL file `stanford_menu.sql` is already in the project root
   - See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions
   - Quick setup: `cd backend && ./setup-db.sh`
   - The app will work without the database, using hardcoded data as fallback

3. (Optional) Start the backend server (if using database):
```bash
cd backend
npm install
npm start
```

4. Start the frontend development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
  components/
    LandingPage.jsx    # Main landing page with search
    ResultsPage.jsx    # Results page with ranked dining halls
  data/
    diningHallData.json  # Hardcoded dining hall menu data
  services/
    api.js            # API service for Gemini integration
    diningHallData.js # Service to fetch data from Stanford website
  App.jsx             # Main app component with routing
  main.jsx            # Entry point
  index.css           # Global styles with Tailwind
```

## Data Source

The app uses dining hall menu data from [Stanford's Dining Hall Menu website](https://rdeapps.stanford.edu/dininghallmenu/).

### Updating Menu Data

Menu data is stored in `src/data/diningHallData.json`. To update the data:

1. Visit https://rdeapps.stanford.edu/dininghallmenu/
2. Select a dining hall, date, and meal
3. Copy the menu items and update `src/data/diningHallData.json`

The JSON format is:
```json
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      { "name": "Food Item Name", "allergens": ["allergen1", "allergen2"] }
    ]
  }
]
```

**Note:** The app will attempt to fetch data automatically from the website, but this may fail due to CORS restrictions. In that case, it will use the hardcoded data from `diningHallData.json`.

### Automatic Data Fetching

The app includes functionality to fetch data from the Stanford website (`src/services/diningHallData.js`). However, due to CORS (Cross-Origin Resource Sharing) restrictions, this will likely only work if:
- You're running a backend server that fetches the data
- The Stanford website enables CORS for your domain
- You're using a browser extension to bypass CORS

For now, manually updating `diningHallData.json` is the recommended approach.

## API Integration

The app uses **Google Gemini API as the primary** AI service, with **OpenAI (GPT-3.5-turbo) as a backup** if Gemini fails.

### API Provider Priority

1. **Primary: Google Gemini** - Uses `models/gemini-2.5-flash` (fast and efficient)
2. **Backup: OpenAI GPT-3.5-turbo** - Falls back if Gemini is unavailable
3. **Fallback: Mock data** - Uses keyword-based ranking if both APIs fail

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

**Note:** For production, you should use a backend server to keep your API keys secure. Exposing API keys in client-side code is a security risk. The API keys are currently hardcoded in the source code for development/testing purposes only.

### API Response Format

The Gemini API is configured to return data in the following format:

```json
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      {
        "name": "Food Item Name",
        "allergens": ["nuts", "dairy"]
      }
    ],
    "score": 9,
    "reason": "Explanation of ranking",
    "image": "optional-image-url"
  }
]
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technologies Used

- React 18
- Vite
- React Router
- Tailwind CSS
- Google Gemini AI (@google/generative-ai) - Primary AI provider
- OpenAI (openai) - Backup AI provider
- Axios

- Axios
