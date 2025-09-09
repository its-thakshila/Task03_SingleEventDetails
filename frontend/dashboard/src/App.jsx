import { useState } from 'react'
import EventsScreen from './EventsScreen'
import RecommendedEvents from './pages/RecommendedEvents'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('recommended') // 'recommended' | 'all'

  return (
    <div className="App">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded ${activeTab === 'recommended' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            All Events
          </button>
        </div>
      </div>

      {activeTab === 'recommended' ? <RecommendedEvents /> : <EventsScreen />}
    </div>
  )
}

export default App

