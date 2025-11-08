/**
 * Get food image URL from Unsplash API
 * @param {string} foodName - Name of the food item
 * @returns {Promise<string|null>} - Image URL or null if not found
 */
export async function getFoodImage(foodName) {
  if (!foodName) return null
  
  try {
    // Clean up food name for better search results
    const cleanName = foodName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .split(/\s+/)
      .slice(0, 3) // Take first 3 words
      .join(' ')
    
    const searchQuery = encodeURIComponent(cleanName)
    
    // Use Unsplash Source API with food keyword
    // This provides a curated image based on the search term
    const unsplashUrl = `https://source.unsplash.com/featured/400x300/?${searchQuery},food,meal`
    
    // Return the URL (image will load asynchronously)
    return unsplashUrl
  } catch (error) {
    console.error('Error getting food image:', error)
    return null
  }
}

/**
 * Get food image URL with fallback
 * @param {string} foodName - Name of the food item
 * @param {string} diningHallName - Name of the dining hall (for fallback)
 * @returns {Promise<string|null>} - Image URL or null
 */
export async function getFoodImageWithFallback(foodName, diningHallName = '') {
  if (!foodName) {
    // If no food name, try dining hall name
    if (diningHallName) {
      return getFoodImage(diningHallName)
    }
    return null
  }
  
  return getFoodImage(foodName)
}

