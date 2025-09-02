import { useState } from 'react'
import Eventcard   from "../components/eventcard.jsx";
import EventsScreen from './EventsScreen'; // added 
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return(
    <div className="App">
      <h1 className="text-3xl font-bold underline">
      </h1>

      {/* Add new EventsScreen component */}
      <EventsScreen/>
    </div>
  )
}

export default App

