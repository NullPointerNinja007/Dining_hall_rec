import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchDiningHalls } from '../services/api'
import { getCurrentMeal, getNext7Days, getAvailableMeals, formatDateForAPI } from '../utils/mealUtils'
import { parseQuery } from '../utils/queryParser'
import FeedbackModal from './FeedbackModal'
import SettingsModal from './SettingsModal'

function LandingPage() {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()

  // Initialize date and meal selections
  useEffect(() => {
    const days = getNext7Days()
    setSelectedDate(days[0].value) // Default to today
    
    const currentMeal = getCurrentMeal()
    setSelectedMeal(currentMeal)
  }, [])

  // Get available meals for selected date
  const availableMeals = selectedDate 
    ? (() => {
        const [month, day, year] = selectedDate.split('/')
        return getAvailableMeals(new Date(year, month - 1, day))
      })()
    : ['Breakfast', 'Lunch', 'Dinner', 'Brunch']

  const days = getNext7Days()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    try {
      // Parse query to extract date and meal if mentioned
      const { meal: extractedMeal, date: extractedDate } = parseQuery(query, selectedMeal, selectedDate)
      
      // Use extracted values if found, otherwise use dropdown values
      const mealToUse = extractedMeal || selectedMeal
      const dateToUse = extractedDate || selectedDate
      
      const results = await searchDiningHalls(query, mealToUse, dateToUse)
      // Navigate to results page with the data
      navigate('/results', { state: { results, query, meal: mealToUse, date: dateToUse } })
    } catch (error) {
      console.error('Error searching dining halls:', error)
      alert('Error searching dining halls. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShowAll = async () => {
    setIsLoading(true)
    try {
      const results = await searchDiningHalls('', selectedMeal, selectedDate)
      // Navigate to results page with the data
      navigate('/results', { 
        state: { 
          results, 
          query: `Show me what the dining halls have for ${selectedMeal}`, 
          meal: selectedMeal,
          date: selectedDate
        } 
      })
    } catch (error) {
      console.error('Error fetching dining halls:', error)
      alert('Error fetching dining halls. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Update meal when date changes (if current meal not available for new date)
  useEffect(() => {
    if (selectedDate && selectedMeal) {
      const [month, day, year] = selectedDate.split('/')
      const dateObj = new Date(year, month - 1, day)
      const meals = getAvailableMeals(dateObj)
      if (!meals.includes(selectedMeal)) {
        // If current meal not available, set to first available meal
        setSelectedMeal(meals[0] || 'Dinner')
      }
    }
  }, [selectedDate, selectedMeal])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Feedback and Settings Buttons */}
      <div className="fixed top-4 right-4 z-50 flex gap-3">
        <button
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700"
          title="Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={() => setShowFeedback(true)}
          className="w-12 h-12 bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700"
          title="Feedback & Help"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Animated background elements - subtle red accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-800/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/8 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="w-full max-w-3xl animate-fade-in relative z-10">
        {/* Greeting */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
            Hello!
          </h1>
          <p className="text-xl md:text-2xl text-gray-200">
            Welcome to Stanford Dining Hall Ranking
          </p>
        </div>

        {/* Date and Meal Selectors */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Date Dropdown */}
            <div className="flex-1">
              <label className="block text-gray-200 text-sm mb-2 font-medium">Date</label>
              <select
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl text-gray-200 bg-gray-800/90 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-sm"
              >
                {days.map((day) => (
                  <option key={day.value} value={day.value} className="bg-gray-800 text-gray-200">
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Meal Dropdown */}
            <div className="flex-1">
              <label className="block text-gray-200 text-sm mb-2 font-medium">Meal</label>
              <select
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl text-gray-200 bg-gray-800/90 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-sm"
              >
                {availableMeals.map((meal) => (
                  <option key={meal} value={meal} className="bg-gray-800 text-gray-200">
                    {meal}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Show All Button */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={handleShowAll}
            disabled={isLoading || !selectedDate || !selectedMeal}
            className="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-[1.02] border border-red-500/30 text-lg relative z-10"
            style={{ filter: 'none' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              `Show me what the dining halls have for ${selectedMeal}`
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-gray-400">or search for something specific</span>
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to eat?"
              disabled={isLoading}
              className="w-full px-6 py-4 text-lg rounded-2xl text-gray-200 placeholder:text-gray-500 placeholder:font-light focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-gray-800/95 focus:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 bg-gray-800/90 backdrop-blur-sm shadow-lg"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-red-500/30"
              style={{ filter: 'none' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {/* Example queries */}
        <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-gray-400 text-sm mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["I want chicken", "Rank based on beef", "Show me vegetarian options"].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-sm rounded-full transition-all duration-300 backdrop-blur-sm border border-gray-700 hover:border-red-500 shadow-sm hover:shadow-md"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      
      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default LandingPage
