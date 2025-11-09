import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { getFoodImageWithFallback } from './imageService.js'

// Gemini API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCjtaAab3krJRW6tRhBHOVLjOKJGbwgK3Q'

// OpenAI API key (backup)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '6b3acb23-9118-4388-a4bf-9bc49b77b5b8'

// Initialize Gemini AI (primary)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Initialize OpenAI (backup)
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - use backend in production
})

// Cache for dining hall data to avoid fetching multiple times
// Cache key format: `${meal}-${date}`
const diningHallsCache = new Map()
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Get dining hall data from backend API (SQL database ONLY)
 * @param {string} meal - Meal type (default: 'Dinner')
 * @param {string} date - Date in format "MM/DD/YYYY" (default: today)
 * @returns {Promise<Array>} - Array of dining halls with menu items
 * @throws {Error} - If backend API fails or returns no data
 */
async function getDiningHallsData(meal = 'Dinner', date = null) {
  // Get today's date in MM/DD/YYYY format if not provided
  if (!date) {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const year = today.getFullYear()
    date = `${month}/${day}/${year}`
  }
  
  const cacheKey = `${meal}-${date}`
  const now = Date.now()
  
  // Check if we have cached data for this specific meal/date combination
  const cached = diningHallsCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached dining hall data for ${meal} on ${date}`)
    return cached.data
  }
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  
  // ONLY fetch from backend API (SQL database)
  try {
    console.log(`Fetching from backend API (SQL) for ${meal} on ${date}...`)
    const response = await fetch(`${API_BASE_URL}/api/menu?date=${encodeURIComponent(date)}&meal=${encodeURIComponent(meal)}`)
    
    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`)
    }
    
    const realData = await response.json()
    
    if (!realData || realData.length === 0) {
      throw new Error(`No data found for ${meal} on ${date}`)
    }
    
    if (!realData.some(hall => hall.foodItems && hall.foodItems.length > 0)) {
      throw new Error(`No menu items found for ${meal} on ${date}`)
    }
    
    console.log(`✅ Successfully fetched data from SQL database for ${realData.length} dining halls`)
    // Cache the data with the specific meal/date key
    diningHallsCache.set(cacheKey, { data: realData, timestamp: now })
    return realData
  } catch (error) {
    console.error('Failed to fetch from backend API (SQL):', error.message)
    throw new Error(`Unable to fetch dining hall data: ${error.message}`)
  }
}

/**
 * Generate a healthy meal plan for a specific dining hall
 * @param {Object} hall - Dining hall object with foodItems
 * @param {string} userQuery - User's meal preferences (e.g., "balanced meal", "high protein", "vegetarian")
 * @param {string} meal - Meal type (default: 'Dinner')
 * @param {string} date - Date in format "MM/DD/YYYY" (default: today)
 * @returns {Promise<string>} - Meal plan recommendations as text
 */
export async function generateMealPlan(hall, userQuery, meal = 'Dinner', date = null) {
  try {
    console.log('Generating meal plan for:', hall.name, 'with query:', userQuery)
    
    // Get all food items for this hall
    const foodItems = hall.foodItems || []
    
    if (foodItems.length === 0) {
      throw new Error('No food items available for this dining hall')
    }

    // Create prompt for meal plan generation
    const foodItemsList = foodItems.map(item => {
      const itemInfo = {
        name: item.name || item,
        allergens: item.allergens || [],
        dietTags: item.dietTags || null,
        ingredients: item.ingredients || null,
      }
      return itemInfo
    })

    const prompt = `You are a nutritionist helping design a healthy meal plan at ${hall.name} for ${meal}.

User's preferences: "${userQuery}"

Available food items at this dining hall:
${JSON.stringify(foodItemsList, null, 2)}

Based on the user's preferences and the available food items, provide a meal plan in a structured format.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

1. First, create a section header based on the user's preference (e.g., "High Protein Foods:", "Vegetarian Options:", "Balanced Meal:")
2. List foods matching the user's preference with bullet points and macros
3. Then add: "To make this a balanced meal, eat:"
4. List complementary foods with bullet points and macros

Example format:
High Protein Foods:
• Grilled Chicken Breast - 1 serving (6 oz) - 280 cal, 54g protein, 0g carbs, 6g fat
• Salmon Fillet - 1 serving (5 oz) - 250 cal, 40g protein, 0g carbs, 10g fat

To make this a balanced meal, eat:
• Brown Rice - 1 cup - 220 cal, 5g protein, 45g carbs, 2g fat
• Steamed Broccoli - 1 cup - 55 cal, 4g protein, 11g carbs, 0g fat

CRITICAL REQUIREMENTS:
- Start with a section header matching the user's preference (e.g., "High Protein Foods:", "Low Calorie Options:", "Vegetarian Foods:")
- List preference-matching foods first with bullet points and macros
- Then add the sentence "To make this a balanced meal, eat:"
- List complementary foods (carbs, vegetables, healthy fats) with bullet points and macros
- Use bullet points (•) for each food item
- Include estimated macros for each item: calories, protein, carbs, fat
- NO other explanations, NO tips, NO extra text
- Only include foods that are actually available at this dining hall
- Keep it concise and structured`

    // Try Gemini first
    try {
      console.log('Trying Gemini API for meal plan...')
      const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('✅ Meal plan generated successfully')
      return text.trim()
    } catch (geminiError) {
      console.warn('Gemini API failed, trying OpenAI as backup:', geminiError.message)
      
      // Fallback to OpenAI
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful nutritionist that provides meal plan recommendations.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
        
        const text = completion.choices[0]?.message?.content || ''
        console.log('✅ Meal plan generated with OpenAI')
        return text.trim()
      } catch (openaiError) {
        console.error('OpenAI also failed:', openaiError)
        throw new Error('Failed to generate meal plan. Please try again.')
      }
    }
  } catch (error) {
    console.error('Error generating meal plan:', error)
    throw error
  }
}

/**
 * Search dining halls based on user query using Gemini AI
 * @param {string} query - User's search query (e.g., "I want chicken", "Rank based on beef"). If empty, ranks all halls.
 * @param {string} meal - Meal type (default: 'Dinner')
 * @param {string} date - Date in format "MM/DD/YYYY" (default: today)
 * @returns {Promise<Array>} - Array of ranked dining halls
 */
export async function searchDiningHalls(query = '', meal = 'Dinner', date = null) {
  try {
    console.log('Searching dining halls with query:', query || 'Show all dining halls')
    
    // Get dining hall data (real or mock)
    const diningHallsData = await getDiningHallsData(meal, date)
    
    // Create the prompt
    const prompt = query.trim() 
      ? createPrompt(query, diningHallsData)
      : createGeneralRankingPrompt(diningHallsData, meal)
    
    // Try Gemini first (primary)
    try {
      console.log('Trying Gemini API...')
      const rankedHalls = await tryGeminiAPI(prompt, diningHallsData)
      if (rankedHalls && rankedHalls.length > 0) {
        return rankedHalls
      }
    } catch (geminiError) {
      console.warn('Gemini API failed, trying OpenAI as backup:', geminiError.message)
    }
    
    // Fallback to OpenAI (backup)
    try {
      console.log('Trying OpenAI API (backup)...')
      const rankedHalls = await tryOpenAIAPI(prompt, diningHallsData)
      if (rankedHalls && rankedHalls.length > 0) {
        return rankedHalls
      }
    } catch (openaiError) {
      console.warn('OpenAI API also failed:', openaiError.message)
    }
    
    // If both APIs failed, throw error
    throw new Error('Both Gemini and OpenAI APIs failed')
  } catch (error) {
    console.error('API Error:', error)
    console.error('Error details:', error.message)
    
    // NO FALLBACK - throw error if AI ranking fails
    throw new Error(`Unable to rank dining halls: ${error.message}`)
  }
}

/**
 * Try Gemini API
 */
async function tryGeminiAPI(prompt, diningHallsData) {
  // Try different Gemini models in order of preference
  const modelsToTry = [
    'models/gemini-2.5-flash',      // Fast and efficient
    'models/gemini-pro-latest',     // Latest stable version
    'models/gemini-2.5-flash-lite', // Lightweight option
    'models/gemini-2.0-flash'       // Alternative
  ]
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini model: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      
      // Generate content
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('Gemini response received')
      
      // Parse the JSON response
      const rankedHalls = await parseGeminiResponse(text, diningHallsData)
      
      if (rankedHalls && rankedHalls.length > 0) {
        console.log('✅ Gemini API successful')
        return rankedHalls
      }
    } catch (error) {
      console.warn(`Gemini model ${modelName} failed:`, error.message)
      // Continue to next model
      continue
    }
  }
  
  throw new Error('All Gemini models failed')
}

/**
 * Try OpenAI API (backup)
 */
async function tryOpenAIAPI(prompt, diningHallsData) {
  try {
    console.log('Trying OpenAI model: gpt-3.5-turbo')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that returns JSON responses. Always return valid JSON only, no markdown code blocks, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
    
    const text = completion.choices[0]?.message?.content
    if (!text) {
      throw new Error('No response from OpenAI')
    }
    
    console.log('OpenAI response received')
    
    // Parse the JSON response (same format as Gemini)
    const rankedHalls = await parseGeminiResponse(text, diningHallsData)
    
    if (rankedHalls && rankedHalls.length > 0) {
      console.log('✅ OpenAI API successful')
      return rankedHalls
    }
    
    throw new Error('Failed to parse OpenAI response')
  } catch (error) {
    console.error('OpenAI API error:', error.message)
    throw error
  }
}

/**
 * Create a prompt for Gemini to rank dining halls based on user query
 */
function createPrompt(userQuery, diningHalls) {
  const diningHallsJSON = JSON.stringify(diningHalls, null, 2)
  
  return `You are a helpful assistant that ranks Stanford dining halls based on user preferences.

User query: "${userQuery}"

Available dining halls and their current menu items:
${diningHallsJSON}

Please analyze the user's query and rank the dining halls from best to worst match. For each dining hall, provide:
1. A relevance score from 1-10
2. A brief reason explaining why it matches (or doesn't match) the user's query
3. Rank the food items within each dining hall from most relevant to least relevant
4. Filter the food items to only show items that are relevant to the user's query

Return your response as a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      {"name": "Food Item Name", "allergens": ["allergen1", "allergen2"], "relevanceScore": 9}
    ],
    "score": 9,
    "reason": "Brief explanation of why this dining hall matches the query",
    "bestFoodItem": "Name of the best/most relevant food item for display"
  }
]

Important instructions:
- Only include dining halls that have at least one relevant food item
- Rank them from highest score (best match) to lowest score
- Within each dining hall, rank food items by relevance (most relevant first)
- Add a "relevanceScore" (1-10) to each food item indicating how relevant it is to the query
- Only include food items that are relevant to the user's query
- Return ONLY valid JSON, no markdown code blocks, no explanations before or after
- The JSON must be parseable by JSON.parse()`
}

/**
 * Create a prompt for Gemini to rank all dining halls generally (no specific query)
 */
function createGeneralRankingPrompt(diningHalls, meal) {
  const diningHallsJSON = JSON.stringify(diningHalls, null, 2)
  
  return `You are a helpful assistant that ranks Stanford dining halls based on their overall quality, variety, and appeal.

Meal: ${meal}

Available dining halls and their current menu items:
${diningHallsJSON}

Please rank all dining halls from best to worst based on:
1. Variety and quality of food options
2. Appeal and popularity of menu items
3. Overall dining experience
4. Any standout or unique items

For each dining hall, provide:
1. A quality score from 1-10
2. A brief reason explaining why it ranks at this position
3. Rank the food items within each dining hall from most appealing/popular to least
4. Show all food items available (don't filter)

Return your response as a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      {"name": "Food Item Name", "allergens": ["allergen1", "allergen2"], "relevanceScore": 9}
    ],
    "score": 9,
    "reason": "Brief explanation of why this dining hall ranks well (e.g., great variety, popular items, etc.)",
    "bestFoodItem": "Name of the best/most appealing food item for display"
  }
]

Important instructions:
- Include ALL dining halls that have menu items
- Rank them from highest score (best overall) to lowest score
- Show ALL food items for each dining hall (don't filter)
- Return ONLY valid JSON, no markdown code blocks, no explanations before or after
- The JSON must be parseable by JSON.parse()`
}

/**
 * Parse Gemini's response and extract the ranked dining halls
 */
async function parseGeminiResponse(text, originalHalls) {
  try {
    // Try to extract JSON from the response
    // Remove markdown code blocks if present
    let jsonText = text.trim()
    
    // Remove markdown code blocks
    jsonText = jsonText.replace(/```json\n?/gi, '').replace(/```\n?/g, '')
    
    // Try to find JSON array
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      jsonText = arrayMatch[0]
    } else {
      // If no array found, try to find JSON object and wrap in array
      const objectMatch = jsonText.match(/\{[\s\S]*\}/)
      if (objectMatch) {
        jsonText = `[${objectMatch[0]}]`
      } else {
        // Try to extract anything that looks like JSON
        const jsonMatch = jsonText.match(/\[[\s\S]*\]|\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
          if (!jsonText.startsWith('[')) {
            jsonText = `[${jsonText}]`
          }
        }
      }
    }
    
    // Clean up any trailing text
    jsonText = jsonText.trim()
    
    // Try to parse
    let rankedHalls
    try {
      rankedHalls = JSON.parse(jsonText)
    } catch (parseError) {
      // If parsing fails, try to fix common issues
      // Remove any text before first [ or {
      jsonText = jsonText.replace(/^[^\[\{]*/, '')
      // Remove any text after last ] or }
      jsonText = jsonText.replace(/[^\]\}]*$/, '')
      
      // Try again
      rankedHalls = JSON.parse(jsonText)
    }
    
    // Ensure it's an array
    if (!Array.isArray(rankedHalls)) {
      rankedHalls = [rankedHalls]
    }
    
    // Validate and ensure all required fields are present
    const parsedHalls = await Promise.all(rankedHalls.map(async (hall) => {
      // Find matching original hall to get food items if needed
      const originalHall = originalHalls.find(h => 
        h.name === hall.name || 
        h.name.toLowerCase().includes(hall.name?.toLowerCase() || '') ||
        (hall.name && h.name.toLowerCase().includes(hall.name.toLowerCase()))
      )
      
      // Get best food item name
      const bestFoodItemName = hall.bestFoodItem || 
                               hall.foodItems?.[0]?.name || 
                               originalHall?.foodItems?.[0]?.name || 
                               null
      
      // Get image for the best food item
      const imageUrl = await getFoodImageWithFallback(bestFoodItemName, hall.name || originalHall?.name)
      
      // Preserve food items with their relevanceScore if available
      // Use AI's foodItems if provided, otherwise use original hall's items
      // Deduplicate by item name to prevent duplicates
      const aiFoodItems = hall.foodItems || []
      const originalFoodItems = originalHall?.foodItems || []
      
      // If AI provided foodItems, use those (they're already ranked/filtered)
      // Otherwise, use original hall's items
      // But merge AI items with original items to preserve dietTags and other metadata
      const sourceFoodItems = aiFoodItems.length > 0 ? aiFoodItems : originalFoodItems
      
      // Create a map of original items by name for merging metadata
      const originalItemsMap = new Map()
      originalFoodItems.forEach(item => {
        const itemName = item.name || item
        if (itemName) {
          originalItemsMap.set(itemName.toLowerCase(), item)
        }
      })
      
      // Deduplicate by name to prevent any duplicates
      const seenNames = new Set()
      const foodItems = sourceFoodItems
        .filter(item => {
          const itemName = item.name || item
          if (seenNames.has(itemName)) {
            return false // Skip duplicate
          }
          seenNames.add(itemName)
          return true
        })
        .map(item => {
          const itemName = item.name || item
          const originalItem = originalItemsMap.get(itemName.toLowerCase())
          
          // Merge AI item with original item to preserve dietTags, allergens, ingredients, etc.
          return {
            ...(originalItem || {}), // Start with original item (has all metadata) if it exists
            ...item, // Override with AI item (has relevanceScore, etc.)
            // Ensure dietTags is preserved from original if not in AI item
            dietTags: item.dietTags || originalItem?.dietTags || null,
            // Ensure allergens is preserved from original if not in AI item
            allergens: item.allergens || originalItem?.allergens || [],
            // Ensure ingredients is preserved from original if not in AI item
            ingredients: item.ingredients || originalItem?.ingredients || null,
            // Preserve relevanceScore if provided by AI, otherwise use 0
            relevanceScore: item.relevanceScore || 0
          }
        })
      
      return {
        name: hall.name || originalHall?.name || 'Unknown',
        foodItems: foodItems,
        score: typeof hall.score === 'number' ? Math.max(1, Math.min(10, hall.score)) : (originalHall ? 7 : 5),
        reason: hall.reason || 'Relevant to your query',
        image: imageUrl,
        bestFoodItem: bestFoodItemName,
      }
    }))
    
    // If we got valid results, return them
    if (parsedHalls.length > 0 && parsedHalls.some(h => h.name && h.name !== 'Unknown')) {
      return parsedHalls
    }
    
    // If parsing failed but we have some structure, try to salvage it
    throw new Error('Parsed but invalid structure')
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('Response text (first 500 chars):', text.substring(0, 500))
    
    // Instead of showing "Unable to parse", return original halls with reasonable defaults
    // This way users still see results even if AI parsing fails
    const fallbackHalls = await Promise.all(originalHalls.map(async (hall, index) => {
      const bestFoodItem = hall.foodItems?.[0]?.name || null
      const imageUrl = await getFoodImageWithFallback(bestFoodItem, hall.name)

      // Deduplicate food items by name
      const seenNames = new Set()
      const uniqueFoodItems = (hall.foodItems || []).filter(item => {
        const itemName = item.name || item
        if (seenNames.has(itemName)) {
          return false
        }
        seenNames.add(itemName)
        return true
      })

      return {
        name: hall.name,
        foodItems: uniqueFoodItems,
        score: 7 - (index * 0.5), // Give a slight ranking based on order
        reason: 'Available options',
        image: imageUrl,
        bestFoodItem: bestFoodItem,
      }
    }))
    
    return fallbackHalls
  }
}

