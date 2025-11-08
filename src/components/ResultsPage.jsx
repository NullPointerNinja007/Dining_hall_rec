import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FeedbackModal from './FeedbackModal'

// Allergen badge component
const AllergenBadge = ({ allergen }) => {
  const colors = {
    'nuts': 'bg-amber-500',
    'dairy': 'bg-blue-500',
    'gluten': 'bg-yellow-600',
    'eggs': 'bg-orange-500',
    'soy': 'bg-green-500',
    'fish': 'bg-cyan-500',
    'shellfish': 'bg-red-600',
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${colors[allergen.toLowerCase()] || 'bg-gray-500'}`}>
      {allergen}
    </span>
  )
}

// Food item with hover tooltip for ingredients
const FoodItem = ({ item }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Check if item has ingredients to show
  const hasIngredients = item.ingredients && (
    (typeof item.ingredients === 'string' && item.ingredients.trim().length > 0) ||
    (Array.isArray(item.ingredients) && item.ingredients.length > 0)
  )
  
  return (
    <li 
      className="text-gray-200 flex items-start gap-2 relative group"
      onMouseEnter={() => {
        if (hasIngredients) {
          setShowTooltip(true)
        }
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-red-400 font-bold mt-1">•</span>
      <div className="flex-1 relative">
        <span className={hasIngredients ? "cursor-help" : ""}>{item.name || item}</span>
        {item.allergens && item.allergens.length > 0 && (
          <div className="flex gap-1 ml-2 mt-1">
            {item.allergens.map((allergen, aIdx) => (
              <AllergenBadge key={aIdx} allergen={allergen} />
            ))}
          </div>
        )}
        
        {/* Ingredients Tooltip */}
        {hasIngredients && showTooltip && (
          <div 
            className="absolute left-0 bottom-full mb-2 z-[100] w-80 p-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 animate-fade-in pointer-events-auto"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ 
              transform: 'translateX(0)',
              maxWidth: 'calc(100vw - 2rem)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ingredients</p>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed">
              {typeof item.ingredients === 'string' ? item.ingredients : item.ingredients.join(', ')}
            </p>
          </div>
        )}
      </div>
    </li>
  )
}

// Dining hall card component
const DiningHallCard = ({ hall, rank }) => {
  const [imageError, setImageError] = useState(false)
  
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700">
      {/* Image section */}
      <div className="relative h-48 bg-gradient-to-br from-red-700 via-red-600 to-red-800 overflow-hidden group">
        {hall.image && !imageError ? (
          <img 
            src={hall.image} 
            alt={hall.bestFoodItem || hall.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-700 via-red-600 to-red-800">
            <span className="text-6xl font-bold text-white/30">{hall.name.charAt(0)}</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        {/* Rank badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white/50">
          <span className="text-xl font-bold gradient-text">#{rank}</span>
        </div>
      </div>

      {/* Content section */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-3">{hall.name}</h2>
        
        {/* Food items */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">Menu Items</h3>
          <ul className="space-y-2">
            {hall.foodItems && hall.foodItems.length > 0 ? (
              hall.foodItems.map((item, idx) => (
                <FoodItem key={idx} item={item} />
              ))
            ) : (
              <li className="text-gray-400 italic">No items listed</li>
            )}
          </ul>
        </div>

        {/* Score/Reason */}
        {hall.score !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                <span className="font-semibold">Match Score: </span>
                <span className="text-red-400 font-bold">{hall.score}/10</span>
              </p>
              {/* Score bar */}
              <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-red-700 to-red-600 transition-all duration-500 shadow-sm"
                  style={{ width: `${(hall.score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {hall.reason && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 italic">{hall.reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [query, setQuery] = useState('')
  const [meal, setMeal] = useState('')
  const [date, setDate] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    if (location.state) {
      setResults(location.state.results)
      setQuery(location.state.query || '')
      setMeal(location.state.meal || '')
      setDate(location.state.date || '')
    } else {
      // If no state, redirect to home
      navigate('/')
    }
  }, [location, navigate])

  // Mock data for demonstration (will be replaced with actual API response)
  const mockResults = results || [
    {
      name: 'Arrillaga Family Dining Commons',
      foodItems: [
        { name: 'Grilled Chicken Breast', allergens: ['dairy'], ingredients: 'chicken breast, olive oil, garlic, herbs, salt, pepper' },
        { name: 'Beef Stir Fry', allergens: ['soy', 'gluten'], ingredients: 'beef strips, bell peppers, onions, soy sauce, ginger, garlic, rice noodles' },
        { name: 'Vegetarian Pasta', allergens: ['gluten', 'eggs'], ingredients: 'pasta, marinara sauce, mushrooms, bell peppers, onions, parmesan cheese' },
      ],
      score: 9,
      reason: 'Excellent variety of chicken and beef options',
      image: null,
    },
    {
      name: 'Ricker Dining',
      foodItems: [
        { name: 'Chicken Tacos', allergens: ['dairy', 'gluten'], ingredients: 'chicken, corn tortillas, lettuce, tomatoes, cheese, sour cream, salsa' },
        { name: 'Beef Burger', allergens: ['gluten', 'eggs'], ingredients: 'beef patty, brioche bun, lettuce, tomato, pickles, special sauce' },
      ],
      score: 8,
      reason: 'Good selection of meat-based dishes',
      image: null,
    },
    {
      name: 'Wilbur Dining',
      foodItems: [
        { name: 'Roasted Chicken', allergens: [], ingredients: 'whole chicken, rosemary, thyme, garlic, olive oil, salt, pepper' },
        { name: 'Beef Stew', allergens: ['gluten'], ingredients: 'beef chunks, carrots, potatoes, onions, celery, beef broth, flour, herbs' },
        { name: 'Beef Stroganoff', allergens: ['dairy', 'gluten'], ingredients: 'beef strips, mushrooms, onions, sour cream, beef broth, flour, egg noodles, butter' },
      ],
      score: 7,
      reason: 'Solid options available',
      image: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Feedback Button */}
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed top-4 right-4 z-50 w-12 h-12 bg-gray-800/90 hover:bg-gray-700 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-700"
        title="Feedback & Help"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Header */}
      <div className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="text-red-400 hover:text-red-500 font-semibold mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Dining Hall Rankings
          </h1>
          <div className="space-y-1">
            {meal && date && (
              <p className="text-gray-400">
                <span className="font-semibold text-gray-200">{meal}</span>
                {' • '}
                <span className="text-gray-400">
                  {(() => {
                    const today = new Date()
                    const [month, day, year] = date.split('/')
                    const selectedDate = new Date(year, month - 1, day)
                    const isToday = selectedDate.toDateString() === today.toDateString()
                    return isToday ? 'Today' : date
                  })()}
                </span>
              </p>
            )}
            {query && (
              <p className="text-gray-400">
                Results for: <span className="font-semibold text-gray-200">"{query}"</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockResults.map((hall, index) => (
            <DiningHallCard key={index} hall={hall} rank={index + 1} />
          ))}
        </div>

        {/* Empty state */}
        {mockResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No results found. Try a different search.</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  )
}

export default ResultsPage
