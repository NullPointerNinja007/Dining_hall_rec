/**
 * Utilities for determining current meal and date selection
 * Based on Stanford Dining Hall hours: https://rde.stanford.edu/dining-hospitality/dining-locations-hours
 */

/**
 * Get the current/next meal based on current time
 * Returns the meal that is currently being served or the next upcoming meal
 * @returns {string} - 'Breakfast', 'Lunch', 'Dinner', or 'Brunch'
 */
export function getCurrentMeal() {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  // Weekday meal times (Monday-Friday)
  // Breakfast: 7:30-10:00 (some halls 7:30-9:00)
  // Lunch: 11:00-3:00 (most halls 11:00-1:30)
  // Dinner: 5:00-8:30 (most halls 5:00-8:00)
  
  // Weekend meal times (Saturday-Sunday)
  // Brunch: 9:30-1:30 (some halls 10:30-1:30)
  // Dinner: 5:00-8:00
  
  if (isWeekend) {
    // Weekend schedule
    if (hour >= 9 && hour < 14) {
      return 'Brunch' // Brunch/Lunch served 9:30-1:30
    } else if (hour >= 17 && hour < 20) {
      return 'Dinner' // Dinner served 5:00-8:00
    } else if (hour < 9) {
      return 'Brunch' // Before 9am, next meal is Brunch
    } else {
      return 'Dinner' // After 2pm and before 5pm, next meal is Dinner
    }
  } else {
    // Weekday schedule
    if (hour >= 7 && hour < 11) {
      return 'Breakfast' // Breakfast served 7:30-10:00
    } else if (hour >= 11 && hour < 15) {
      return 'Lunch' // Lunch served 11:00-3:00
    } else if (hour >= 17 && hour < 21) {
      return 'Dinner' // Dinner served 5:00-8:30
    } else if (hour < 7) {
      return 'Breakfast' // Before 7am, next meal is Breakfast
    } else if (hour >= 15 && hour < 17) {
      return 'Dinner' // Between 3pm and 5pm, next meal is Dinner
    } else {
      // After 9pm, next meal is tomorrow's Breakfast
      // But for simplicity, we'll show Dinner (last meal of the day)
      return 'Dinner'
    }
  }
}

/**
 * Get available meals for a given date
 * @param {Date} date - The date to check
 * @returns {Array<string>} - Array of available meals
 */
export function getAvailableMeals(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    // If invalid date, return all meals
    return ['Breakfast', 'Lunch', 'Dinner', 'Brunch']
  }
  
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  if (isWeekend) {
    return ['Brunch', 'Dinner']
  } else {
    return ['Breakfast', 'Lunch', 'Dinner']
  }
}

/**
 * Get the next 7 days as date objects
 * @returns {Array<{date: Date, label: string, value: string}>}
 */
export function getNext7Days() {
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    
    let label
    if (i === 0) {
      label = `Today (${dayName}, ${month}/${day})`
    } else if (i === 1) {
      label = `Tomorrow (${dayName}, ${month}/${day})`
    } else {
      label = `${dayName}, ${month}/${day}/${year}`
    }
    
    days.push({
      date,
      label,
      value: `${month}/${day}/${year}`,
      isToday: i === 0,
      isTomorrow: i === 1
    })
  }
  
  return days
}

/**
 * Format date for API (MM/DD/YYYY)
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDateForAPI(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

/**
 * Check if a meal is currently being served
 * @param {string} meal - Meal name
 * @returns {boolean}
 */
export function isMealCurrentlyServed(meal) {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  
  if (isWeekend) {
    if (meal === 'Brunch') {
      return hour >= 9 && hour < 14
    } else if (meal === 'Dinner') {
      return hour >= 17 && hour < 20
    }
  } else {
    if (meal === 'Breakfast') {
      return hour >= 7 && hour < 11
    } else if (meal === 'Lunch') {
      return hour >= 11 && hour < 15
    } else if (meal === 'Dinner') {
      return hour >= 17 && hour < 21
    }
  }
  
  return false
}

