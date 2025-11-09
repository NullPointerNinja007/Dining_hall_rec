import { useState } from 'react'
import { generateMealPlan } from '../services/api'

function MealPlanModal({ isOpen, onClose, hall, meal, date }) {
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || !hall) return

    setIsLoading(true)
    setError(null)
    setRecommendations(null)

    try {
      const mealPlan = await generateMealPlan(hall, query, meal, date)
      setRecommendations(mealPlan)
    } catch (err) {
      console.error('Error generating meal plan:', err)
      setError(err.message || 'Failed to generate meal plan. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setQuery('')
    setRecommendations(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">
            Design Your Meal Plan
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">
            Dining at <span className="font-semibold text-red-400">{hall?.name || 'Dining Hall'}</span>
            {meal && date && (
              <span className="text-gray-400"> • {meal} • {date}</span>
            )}
          </p>
          <p className="text-gray-400 text-sm">
            Tell us your preferences (e.g., "I want a balanced meal", "High protein", "Vegetarian", "Low calorie") and we'll recommend the best foods and portions for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What kind of meal are you looking for?"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg text-gray-200 placeholder:text-gray-500 bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim() || !hall}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Planning...
                </span>
              ) : (
                'Get Plan'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {recommendations && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Your Meal Plan</h3>
            <div className="text-gray-200 text-sm leading-relaxed">
              {recommendations.split('\n').map((line, idx) => {
                if (!line.trim()) return null
                
                const trimmedLine = line.trim()
                
                // Check if line is a section header (ends with colon and doesn't start with bullet)
                if (trimmedLine.endsWith(':') && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
                  return (
                    <div key={idx} className="mb-3 mt-4 first:mt-0">
                      <h4 className="text-red-400 font-semibold text-base">{trimmedLine}</h4>
                    </div>
                  )
                }
                
                // Check if line is the "To make this a balanced meal" sentence
                if (trimmedLine.toLowerCase().includes('to make this a balanced meal')) {
                  return (
                    <div key={idx} className="mb-3 mt-4 text-gray-300 italic">
                      {trimmedLine}
                    </div>
                  )
                }
                
                // Check if line starts with bullet point
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                  return (
                    <div key={idx} className="mb-2 flex items-start gap-2">
                      <span className="text-red-400 font-bold mt-0.5">•</span>
                      <span className="flex-1">{trimmedLine.replace(/^[•-]\s*/, '')}</span>
                    </div>
                  )
                }
                
                // Regular text line
                return (
                  <div key={idx} className="mb-2">{trimmedLine}</div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealPlanModal

