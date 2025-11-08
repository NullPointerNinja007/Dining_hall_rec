import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import LandingPage from './components/LandingPage'
import ResultsPage from './components/ResultsPage'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
