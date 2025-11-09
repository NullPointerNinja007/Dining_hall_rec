/**
 * ETA Service - Get travel times and distances to dining halls
 * Converted from TypeScript to JavaScript
 */

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

/**
 * Get current user position
 * @returns {Promise<GeolocationPosition>}
 */
function getCurrentPosition() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('geolocation_unavailable'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS)
  })
}

/**
 * Post ETA request to backend
 * @param {Object} origin - { lat: number, lon: number }
 * @returns {Promise<Array>} Array of ETA results
 */
async function postEtas(origin) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
  
  const response = await fetch(`${API_BASE_URL}/api/etas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin }),
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ error: 'unknown_error' }))
    const errorMessage =
      typeof errorPayload?.error === 'string'
        ? errorPayload.error
        : `request_failed_${response.status}`
    throw new Error(errorMessage)
  }

  const etas = await response.json()
  return etas
}

/**
 * Get ETAs for all dining halls from user's current location
 * @returns {Promise<Array>} Array of ETA results with hall, distance_km, walk_min, bike_min
 */
export async function getEtas() {
  const position = await getCurrentPosition()
  const origin = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  }

  return postEtas(origin)
}

/**
 * Get ETAs with error handling
 * @returns {Promise<Object>} { data: Array, status: number }
 */
export async function getEtasWithStatus() {
  try {
    const data = await getEtas()
    return { data, status: 200 }
  } catch (error) {
    return {
      data: [],
      status: error instanceof Error ? 500 : 520,
    }
  }
}

