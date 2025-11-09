import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import FeedbackModal from './FeedbackModal'
import { getEtasWithStatus } from '../services/etaService'
import { TRANSPORT_KEY } from './SettingsModal'

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

// Diet tag badge component
const DietTagBadge = ({ tag }) => {
  // Normalize tag to uppercase and handle variations
  const normalizedTag = tag.trim().toUpperCase()
  
  // Map common variations to standard display
  const tagMap = {
    'GF': 'GF',
    'GLUTEN-FREE': 'GF',
    'V': 'V',
    'VEGETARIAN': 'V',
    'VG': 'VG',
    'VGN': 'VG',
    'VEGAN': 'VG',
    'HALAL': 'Halal',
  }
  
  const displayTag = tagMap[normalizedTag] || normalizedTag
  
  const colors = {
    'GF': 'bg-purple-500',
    'V': 'bg-green-600',
    'VG': 'bg-emerald-500',
    'HALAL': 'bg-indigo-500',
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${colors[displayTag] || 'bg-gray-600'}`}>
      {displayTag}
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
      <div className="flex-1 relative z-10">
        <span className={hasIngredients ? "cursor-help underline decoration-dotted decoration-red-400/50" : ""}>{item.name || item}</span>
        <div className="flex flex-wrap gap-1 ml-2 mt-1">
          {item.allergens && item.allergens.length > 0 && (
            item.allergens.map((allergen, aIdx) => (
              <AllergenBadge key={`allergen-${aIdx}`} allergen={allergen} />
            ))
          )}
          {item.dietTags && (() => {
            // Parse diet tags from string (e.g., "GF, VGN, Halal" or "V, Halal")
            let dietTagsArray = []
            if (typeof item.dietTags === 'string') {
              dietTagsArray = item.dietTags
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
            } else if (Array.isArray(item.dietTags)) {
              dietTagsArray = item.dietTags
            }
            return dietTagsArray.map((tag, tIdx) => (
              <DietTagBadge key={`diet-${tIdx}`} tag={tag} />
            ))
          })()}
        </div>
        
        {/* Ingredients Tooltip */}
        {hasIngredients && showTooltip && (
          <div 
            className="absolute left-0 bottom-full mb-2 z-[100] w-80 p-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 animate-fade-in pointer-events-auto"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ 
              transform: 'translateX(0)',
              maxWidth: 'calc(100vw - 2rem)',
              minWidth: '200px'
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
const DiningHallCard = ({ hall, rank, etas, transportMode, etaLoading }) => {
  const [imageError, setImageError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  // Sort food items by relevanceScore if available, otherwise keep original order
  const sortedFoodItems = [...(hall.foodItems || [])].sort((a, b) => {
    const scoreA = a.relevanceScore || 0
    const scoreB = b.relevanceScore || 0
    return scoreB - scoreA // Higher score first
  })
  
  // Show top 5 initially, or all if expanded
  const visibleFoodItems = expanded ? sortedFoodItems : sortedFoodItems.slice(0, 5)
  const hasMoreItems = sortedFoodItems.length > 5
  
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
          <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">
            Menu Items {sortedFoodItems.length > 0 && `(${sortedFoodItems.length})`}
          </h3>
          <ul className="space-y-2">
            {visibleFoodItems.length > 0 ? (
              visibleFoodItems.map((item, idx) => (
                <FoodItem key={idx} item={item} />
              ))
            ) : (
              <li className="text-gray-400 italic">No items listed</li>
            )}
          </ul>
          {hasMoreItems && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-sm text-red-400 hover:text-red-500 font-semibold transition-colors duration-200 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Show Less
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show All ({sortedFoodItems.length - 5} more)
                </>
              )}
            </button>
          )}
        </div>

        {/* Location/Distance Info */}
        {(() => {
          // Show loading state
          if (etaLoading) {
            return (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading location...</span>
                </div>
              </div>
            )
          }
          
          if (!etas || etas.length === 0) return null
          
          // Try to find matching ETA data by exact match first, then partial match
          let etaData = etas.find(e => e.hall === hall.name)
          if (!etaData) {
            etaData = etas.find(e => 
              e.hall.toLowerCase().includes(hall.name.toLowerCase()) || 
              hall.name.toLowerCase().includes(e.hall.toLowerCase())
            )
          }
          
          if (!etaData) {
            console.log(`No ETA data found for hall: ${hall.name}`, { etas, hallName: hall.name })
            return null
          }
          
          const distanceMiles = etaData.distance_km ? (etaData.distance_km * 0.621371).toFixed(2) : null
          const etaMinutes = transportMode === 'walking' ? etaData.walk_min : etaData.bike_min
          
          // Only show if we have at least distance or ETA
          if (!distanceMiles && !etaMinutes) {
            return null
          }
          
          return (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4 text-sm">
                {distanceMiles && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-300">{distanceMiles} mi</span>
                  </div>
                )}
                {etaMinutes && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-300">{Math.round(etaMinutes)} min {transportMode === 'walking' ? 'walk' : 'bike'}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

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
  const [etas, setEtas] = useState([])
  const [transportMode, setTransportMode] = useState('walking')
  const [etaLoading, setEtaLoading] = useState(false)

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

  // Load transport preference
  useEffect(() => {
    const saved = localStorage.getItem(TRANSPORT_KEY)
    if (saved === 'walking' || saved === 'biking') {
      setTransportMode(saved)
    }
  }, [])

  // Fetch ETAs when results are loaded
  useEffect(() => {
    if (results && results.length > 0) {
      console.log('Results loaded, fetching ETAs...', results.length)
      fetchEtas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  const fetchEtas = async () => {
    setEtaLoading(true)
    try {
      console.log('Fetching ETAs...')
      const { data, status } = await getEtasWithStatus()
      console.log('ETA response:', { data, status })
      if (status === 200 && data.length > 0) {
        console.log('Setting ETAs:', data)
        setEtas(data)
      } else {
        console.warn('No ETA data received or status not 200:', { data, status })
      }
    } catch (error) {
      console.error('Error fetching ETAs:', error)
    } finally {
      setEtaLoading(false)
    }
  }

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
            <DiningHallCard key={index} hall={hall} rank={index + 1} etas={etas} transportMode={transportMode} etaLoading={etaLoading} />
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
