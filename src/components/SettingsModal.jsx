import { useState, useEffect } from 'react'

export const TRANSPORT_KEY = 'dining_hall_transport_preference'

function SettingsModal({ isOpen, onClose }) {
  const [transportMode, setTransportMode] = useState('walking')

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TRANSPORT_KEY)
    if (saved === 'walking' || saved === 'biking') {
      setTransportMode(saved)
    }
  }, [])

  // Save preference to localStorage when changed
  const handleTransportChange = (mode) => {
    setTransportMode(mode)
    localStorage.setItem(TRANSPORT_KEY, mode)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-200 text-sm font-medium mb-3">
              Primary Mode of Transport
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors duration-200">
                <input
                  type="radio"
                  name="transport"
                  value="walking"
                  checked={transportMode === 'walking'}
                  onChange={(e) => handleTransportChange(e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-600 bg-gray-800"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-200 font-medium">Walking</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Get walking time estimates</p>
                </div>
              </label>

              <label className="flex items-center p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors duration-200">
                <input
                  type="radio"
                  name="transport"
                  value="biking"
                  checked={transportMode === 'biking'}
                  onChange={(e) => handleTransportChange(e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 focus:ring-2 border-gray-600 bg-gray-800"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-200 font-medium">Biking</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Get biking time estimates</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Your location will be used to calculate distances and travel times to each dining hall.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal

