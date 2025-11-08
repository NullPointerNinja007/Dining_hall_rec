/**
 * Service to fetch dining hall menu data from Stanford's website
 * https://rdeapps.stanford.edu/dininghallmenu/
 */

// Stanford Dining Hall names (from the website)
export const DINING_HALLS = [
  'Arrillaga Family Dining Commons',
  'Branner Dining',
  'EVGR Dining',
  'Florence Moore Dining',
  'Gerhard Casper Dining',
  'Lakeside Dining',
  'Ricker Dining',
  'Stern Dining',
  'Wilbur Dining'
]

/**
 * Fetch menu data for a specific dining hall, day, and meal
 * @param {string} diningHall - Name of the dining hall
 * @param {string} day - Date in format "MM/DD/YYYY"
 * @param {string} meal - Meal type: "Breakfast", "Lunch", "Dinner", "Brunch"
 * @returns {Promise<Array>} - Array of food items with allergens
 */
export async function fetchMenuData(diningHall, day, meal = 'Dinner') {
  try {
    // The website uses ASP.NET forms, so we need to make a POST request
    // First, get the initial page to extract ViewState
    const initialResponse = await fetch('https://rdeapps.stanford.edu/dininghallmenu/')
    const initialHtml = await initialResponse.text()
    
    // Extract ViewState from the HTML (needed for ASP.NET forms)
    const viewStateMatch = initialHtml.match(/name="__VIEWSTATE" value="([^"]+)"/)
    const viewState = viewStateMatch ? viewStateMatch[1] : ''
    
    const viewStateGenMatch = initialHtml.match(/name="__VIEWSTATEGENERATOR" value="([^"]+)"/)
    const viewStateGen = viewStateGenMatch ? viewStateGenMatch[1] : '5ABBD323'
    
    const eventValidationMatch = initialHtml.match(/name="__EVENTVALIDATION" value="([^"]+)"/)
    const eventValidation = eventValidationMatch ? eventValidationMatch[1] : ''
    
    // Create form data
    const formData = new URLSearchParams()
    formData.append('__VIEWSTATE', viewState)
    formData.append('__VIEWSTATEGENERATOR', viewStateGen)
    formData.append('__EVENTVALIDATION', eventValidation)
    formData.append('diningHall', diningHall)
    formData.append('day', day)
    formData.append('meal', meal)
    
    // Make POST request to get menu data
    const response = await fetch('https://rdeapps.stanford.edu/dininghallmenu/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
    
    const html = await response.text()
    
    // Parse the HTML to extract food items
    return parseMenuHTML(html)
  } catch (error) {
    console.error(`Error fetching menu for ${diningHall}:`, error)
    return []
  }
}

/**
 * Parse HTML to extract food items and allergens
 * @param {string} html - HTML content from the menu page
 * @returns {Array} - Array of food items with allergens
 */
function parseMenuHTML(html) {
  const foodItems = []
  
  try {
    // The Stanford website uses ASP.NET and likely has menu items in specific structures
    // Look for common patterns in the HTML structure
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Strategy 1: Look for elements with class containing "menu" or "item"
    const menuSelectors = [
      '.clsMenuItem',
      '.menu-item',
      '.food-item',
      '[class*="MenuItem"]',
      '[class*="menuItem"]',
      'table.menu-table tr',
      'table tbody tr',
      '.menu-container li',
      '.menu-list li'
    ]
    
    let foundItems = false
    for (const selector of menuSelectors) {
      const elements = doc.querySelectorAll(selector)
      if (elements.length > 0) {
        foundItems = true
        elements.forEach(element => {
          const item = extractFoodItemFromElement(element)
          if (item) {
            foodItems.push(item)
          }
        })
        break // Use the first selector that finds items
      }
    }
    
    // Strategy 2: If no specific menu elements found, look for table cells with food-like content
    if (!foundItems) {
      const tableCells = doc.querySelectorAll('td')
      tableCells.forEach(cell => {
        const text = cell.textContent.trim()
        // Look for text that looks like food items (not headers, not empty, reasonable length)
        if (text && text.length > 3 && text.length < 100) {
          // Skip common non-food text
          if (!text.match(/^(Dining Hall|Menu|Day|Meal|Filter|Select|Date|Time|Allergen|Ingredient)/i)) {
            const item = extractFoodItemFromText(text)
            if (item && !foodItems.some(fi => fi.name === item.name)) {
              foodItems.push(item)
            }
          }
        }
      })
    }
  } catch (error) {
    console.error('Error parsing HTML with DOM:', error)
  }
  
  // Strategy 3: Fallback to regex parsing if DOM parsing didn't work
  if (foodItems.length === 0) {
    return parseMenuWithRegex(html)
  }
  
  // Remove duplicates and clean up
  return deduplicateFoodItems(foodItems)
}

/**
 * Extract food item from a DOM element
 */
function extractFoodItemFromElement(element) {
  const text = element.textContent.trim()
  if (!text || text.length < 3) return null
  
  // Skip headers and navigation
  if (text.match(/^(Dining Hall|Menu|Day|Meal|Filter|Select)/i)) return null
  
  return extractFoodItemFromText(text)
}

/**
 * Extract food item from text
 */
function extractFoodItemFromText(text) {
  // Extract allergens first
  const allergens = extractAllergens(text)
  
  // Clean up the food name
  let foodName = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // Remove common non-food suffixes/prefixes
  foodName = foodName.replace(/^(Menu|Item|Food):\s*/i, '')
  foodName = foodName.replace(/\s*\([^)]*allergen[^)]*\)/gi, '')
  
  // Don't include items that are clearly not food
  if (foodName.length < 3 || foodName.length > 80) return null
  if (foodName.match(/^(Select|Choose|Filter|Date|Time|Allergen)/i)) return null
  
  return {
    name: foodName,
    allergens: allergens
  }
}

/**
 * Remove duplicate food items
 */
function deduplicateFoodItems(items) {
  const seen = new Set()
  return items.filter(item => {
    const key = item.name.toLowerCase().trim()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Parse menu using regex as fallback
 */
function parseMenuWithRegex(html) {
  const foodItems = []
  
  // Look for common patterns in the HTML
  // This is a simplified parser - may need adjustment based on actual HTML structure
  const foodPatterns = [
    /<td[^>]*>([^<]+)<\/td>/gi,
    /<li[^>]*>([^<]+)<\/li>/gi,
    /class="[^"]*food[^"]*"[^>]*>([^<]+)</gi
  ]
  
  foodPatterns.forEach(pattern => {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const text = match[1].trim()
      if (text && text.length > 3 && !text.match(/^(Dining Hall|Menu|Day|Meal|Filter)/i)) {
        const allergens = extractAllergens(text)
        foodItems.push({
          name: text,
          allergens: allergens
        })
      }
    }
  })
  
  return foodItems
}

/**
 * Extract allergens from text
 * @param {string} text - Text containing food name and allergen info
 * @returns {Array} - Array of allergen names
 */
function extractAllergens(text) {
  const allergens = []
  const allergenMap = {
    'gluten': 'gluten',
    'dairy': 'dairy',
    'milk': 'dairy',
    'cheese': 'dairy',
    'nuts': 'nuts',
    'peanut': 'nuts',
    'eggs': 'eggs',
    'egg': 'eggs',
    'soy': 'soy',
    'fish': 'fish',
    'salmon': 'fish',
    'shellfish': 'shellfish',
    'shrimp': 'shellfish',
    'crab': 'shellfish',
    'lobster': 'shellfish'
  }
  
  const textLower = text.toLowerCase()
  Object.keys(allergenMap).forEach(key => {
    if (textLower.includes(key)) {
      const allergen = allergenMap[key]
      if (!allergens.includes(allergen)) {
        allergens.push(allergen)
      }
    }
  })
  
  return allergens
}

/**
 * Get today's date in the format expected by the website (MM/DD/YYYY)
 * @returns {string}
 */
export function getTodayDate() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  return `${month}/${day}/${year}`
}

/**
 * Fetch menus for all dining halls for the specified meal and date
 * @param {string} meal - Meal type (default: 'Dinner')
 * @param {string} date - Date in format "MM/DD/YYYY" (default: today)
 * @returns {Promise<Array>} - Array of dining halls with their menu items
 */
export async function fetchAllDiningHalls(meal = 'Dinner', date = null) {
  const targetDate = date || getTodayDate()
  const diningHallsData = []
  
  // Fetch data for each dining hall
  for (const hall of DINING_HALLS) {
    try {
      const menuItems = await fetchMenuData(hall, targetDate, meal)
      if (menuItems.length > 0) {
        diningHallsData.push({
          name: hall,
          foodItems: menuItems
        })
      }
    } catch (error) {
      console.error(`Error fetching data for ${hall}:`, error)
      // Continue with other dining halls even if one fails
    }
  }
  
  return diningHallsData
}

