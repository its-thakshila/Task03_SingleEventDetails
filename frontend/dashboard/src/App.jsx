import { useState } from 'react'
import Eventcard   from "../components/eventcard.jsx";
import EventsScreen from './EventsScreen'; // added by samadhini
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return(
    <div className="App">
      <h1 className="text-3xl font-bold underline">
      </h1>
      <Eventcard event={{name: "Sample Event", description: "This is a sample event description.", date: "2024-06-01", image: "https://via.placeholder.com/400x200"}} />

      {/* Add new EventsScreen component by samadhini */}
      <EventsScreen />
    </div>
  )
}

export default App

