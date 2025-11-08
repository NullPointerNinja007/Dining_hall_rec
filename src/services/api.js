import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { fetchAllDiningHalls, getTodayDate, DINING_HALLS } from './diningHallData.js'
import diningHallData from '../data/diningHallData.json'
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
let cachedDiningHallsData = null
let cacheTimestamp = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

// Hardcoded dining hall data - Update this file with real data from the website
// File: src/data/diningHallData.json
const HARDCODED_DINING_HALLS = diningHallData

// Legacy mock data - kept for reference/fallback
const MOCK_DINING_HALLS = HARDCODED_DINING_HALLS

/**
 * Get dining hall data (either from backend API, Stanford website, or hardcoded data)
 * @param {string} meal - Meal type (default: 'Dinner')
 * @param {string} date - Date in format "MM/DD/YYYY" (default: today)
 * @returns {Promise<Array>} - Array of dining halls with menu items
 */
async function getDiningHallsData(meal = 'Dinner', date = null) {
  const cacheKey = `${meal}-${date || 'today'}`
  const now = Date.now()
  
  // Check if we have cached data that's still fresh
  if (cachedDiningHallsData && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log('Using cached dining hall data')
    return cachedDiningHallsData
  }
  
  const targetDate = date || getTodayDate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  
  // Try to fetch from backend API first (database)
  try {
    console.log(`Attempting to fetch from backend API for ${meal} on ${targetDate}...`)
    const response = await fetch(`${API_BASE_URL}/api/menu?date=${encodeURIComponent(targetDate)}&meal=${encodeURIComponent(meal)}`)
    
    if (response.ok) {
      const realData = await response.json()
      if (realData && realData.length > 0 && realData.some(hall => hall.foodItems && hall.foodItems.length > 0)) {
        console.log(`✅ Successfully fetched data from database for ${realData.length} dining halls`)
        cachedDiningHallsData = realData
        cacheTimestamp = now
        return realData
      } else {
        console.log('Backend API returned empty data')
      }
    } else {
      console.warn(`Backend API returned status ${response.status}`)
    }
  } catch (error) {
    console.warn('Failed to fetch from backend API, trying alternative sources:', error.message)
  }
  
  // Fallback: Try to fetch real data from Stanford's website
  // Note: This may fail due to CORS restrictions in the browser
  try {
    console.log(`Attempting to fetch from Stanford website for ${meal} on ${targetDate}...`)
    const realData = await fetchAllDiningHalls(meal, targetDate)
    
    if (realData && realData.length > 0 && realData.some(hall => hall.foodItems.length > 0)) {
      console.log(`✅ Successfully fetched data from website for ${realData.length} dining halls`)
      cachedDiningHallsData = realData
      cacheTimestamp = now
      return realData
    } else {
      console.log('Website fetch returned empty data')
    }
  } catch (error) {
    console.warn('Failed to fetch from Stanford website (likely CORS issue):', error.message)
  }
  
  // Final fallback: Use hardcoded data from diningHallData.json
  console.log(`Using hardcoded dining hall data from diningHallData.json`)
  return HARDCODED_DINING_HALLS
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
    
    // Fallback to mock data if both APIs fail
    console.warn('Falling back to mock data')
    return getMockResults(query)
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
3. Filter the food items to only show items that are relevant to the user's query

Return your response as a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      {"name": "Food Item Name", "allergens": ["allergen1", "allergen2"]}
    ],
    "score": 9,
    "reason": "Brief explanation of why this dining hall matches the query",
    "bestFoodItem": "Name of the best/most relevant food item for display"
  }
]

Important instructions:
- Only include dining halls that have at least one relevant food item
- Rank them from highest score (best match) to lowest score
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
3. Show all food items available (don't filter)

Return your response as a valid JSON array in this exact format (no markdown, no code blocks, just pure JSON):
[
  {
    "name": "Dining Hall Name",
    "foodItems": [
      {"name": "Food Item Name", "allergens": ["allergen1", "allergen2"]}
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
      
      return {
        name: hall.name || originalHall?.name || 'Unknown',
        foodItems: hall.foodItems || originalHall?.foodItems || [],
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
      
      return {
        name: hall.name,
        foodItems: hall.foodItems || [],
        score: 7 - (index * 0.5), // Give a slight ranking based on order
        reason: 'Available options',
        image: imageUrl,
        bestFoodItem: bestFoodItem,
      }
    }))
    
    return fallbackHalls
  }
}

/**
 * Fallback mock data if Gemini API fails
 */
function getMockResults(query) {
  const queryLower = query.toLowerCase()
  
  // Simple keyword-based ranking
  const results = MOCK_DINING_HALLS.map(hall => {
    let score = 5
    let relevantItems = hall.foodItems
    let reason = 'Has some options available'
    
    // Filter items based on query
    if (queryLower.includes('chicken')) {
      relevantItems = hall.foodItems.filter(item => 
        item.name.toLowerCase().includes('chicken')
      )
      score = relevantItems.length > 0 ? 7 + relevantItems.length : 3
      reason = relevantItems.length > 0 
        ? `Has ${relevantItems.length} chicken option(s)` 
        : 'Limited chicken options'
    } else if (queryLower.includes('beef')) {
      relevantItems = hall.foodItems.filter(item => 
        item.name.toLowerCase().includes('beef')
      )
      score = relevantItems.length > 0 ? 7 + relevantItems.length : 3
      reason = relevantItems.length > 0 
        ? `Has ${relevantItems.length} beef option(s)` 
        : 'Limited beef options'
    } else if (queryLower.includes('vegetarian') || queryLower.includes('veggie')) {
      relevantItems = hall.foodItems.filter(item => 
        item.name.toLowerCase().includes('vegetarian') || 
        item.name.toLowerCase().includes('veggie')
      )
      score = relevantItems.length > 0 ? 7 + relevantItems.length : 3
      reason = relevantItems.length > 0 
        ? `Has ${relevantItems.length} vegetarian option(s)` 
        : 'Limited vegetarian options'
    } else if (queryLower.includes('fish')) {
      relevantItems = hall.foodItems.filter(item => 
        item.name.toLowerCase().includes('fish') || 
        item.name.toLowerCase().includes('salmon')
      )
      score = relevantItems.length > 0 ? 7 + relevantItems.length : 3
      reason = relevantItems.length > 0 
        ? `Has ${relevantItems.length} fish option(s)` 
        : 'Limited fish options'
    }
    
    return {
      name: hall.name,
      foodItems: relevantItems.length > 0 ? relevantItems : hall.foodItems,
      score: Math.min(score, 10),
      reason,
      image: null,
    }
  })
  
  // Sort by score and filter out halls with no relevant items
  return results
    .filter(hall => hall.foodItems.length > 0)
    .sort((a, b) => b.score - a.score)
}
