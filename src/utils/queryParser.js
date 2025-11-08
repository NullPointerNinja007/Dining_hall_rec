/**
 * Parse user query to extract date and meal information
 */

/**
 * Extract date from query string
 * @param {string} query - User query
 * @returns {string|null} - Date in format "MM/DD/YYYY" or null
 */
export function extractDateFromQuery(query) {
  if (!query) return null
  
  // Patterns to match dates: MM/DD/YYYY, MM/DD, M/D/YYYY, etc.
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,  // MM/DD/YYYY
    /(\d{1,2})\/(\d{1,2})/g,            // MM/DD (assume current year)
  ]
  
  for (const pattern of datePatterns) {
    const matches = query.match(pattern)
    if (matches && matches.length > 0) {
      const dateStr = matches[0]
      const parts = dateStr.split('/')
      
      if (parts.length === 3) {
        // MM/DD/YYYY
        return dateStr
      } else if (parts.length === 2) {
        // MM/DD - add current year
        const today = new Date()
        const year = today.getFullYear()
        return `${parts[0]}/${parts[1]}/${year}`
      }
    }
  }
  
  // Check for relative dates
  const lowerQuery = query.toLowerCase()
  if (lowerQuery.includes('today')) {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const year = today.getFullYear()
    return `${month}/${day}/${year}`
  }
  
  if (lowerQuery.includes('tomorrow')) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
    const day = String(tomorrow.getDate()).padStart(2, '0')
    const year = tomorrow.getFullYear()
    return `${month}/${day}/${year}`
  }
  
  return null
}

/**
 * Extract meal from query string
 * @param {string} query - User query
 * @returns {string|null} - Meal type ("Breakfast", "Lunch", "Dinner", "Brunch") or null
 */
export function extractMealFromQuery(query) {
  if (!query) return null
  
  const lowerQuery = query.toLowerCase()
  
  // Check for explicit meal mentions
  if (lowerQuery.includes('breakfast')) {
    return 'Breakfast'
  }
  if (lowerQuery.includes('lunch')) {
    return 'Lunch'
  }
  if (lowerQuery.includes('dinner')) {
    return 'Dinner'
  }
  if (lowerQuery.includes('brunch')) {
    return 'Brunch'
  }
  
  // Check for meal abbreviations
  if (lowerQuery.match(/\b(breakfast|brkfst|morning)\b/)) {
    return 'Breakfast'
  }
  if (lowerQuery.match(/\b(lunch|noon|midday)\b/)) {
    return 'Lunch'
  }
  if (lowerQuery.match(/\b(dinner|evening|night|supper)\b/)) {
    return 'Dinner'
  }
  
  return null
}

/**
 * Parse query to extract date and meal, with fallbacks
 * @param {string} query - User query
 * @param {string} defaultMeal - Default meal if not found in query
 * @param {string} defaultDate - Default date if not found in query
 * @returns {{meal: string, date: string}} - Extracted meal and date
 */
export function parseQuery(query, defaultMeal = 'Dinner', defaultDate = null) {
  const extractedDate = extractDateFromQuery(query)
  const extractedMeal = extractMealFromQuery(query)
  
  return {
    meal: extractedMeal || defaultMeal,
    date: extractedDate || defaultDate,
  }
}

