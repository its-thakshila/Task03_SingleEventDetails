import { Routes, Route, Link } from 'react-router-dom'
import SingleEventDetailPage from '../pages/SingleEventDetailPage.jsx'
import './App.css'

function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Home</h1>
      <Link to="/event">
        <button style={{ padding: '10px 16px', border: '1px solid #333' }}>
          Go to Event Detail
        </button>
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event" element={<SingleEventDetailPage />} />
      </Routes>
    </div>
  )
}
