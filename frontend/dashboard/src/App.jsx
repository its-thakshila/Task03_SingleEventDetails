import { useState } from 'react'
import Eventcard   from "../components/eventcard.jsx";
import './App.css'
import FeedbackCard from "../components/feedbackcard.jsx";

function App() {
  const [count, setCount] = useState(0)

  return(
    <div className="App">
      <h1 className="text-3xl font-bold underline">
      </h1>
      <Eventcard event={{name: "Sample Event", description: "This is a sample event description.", date: "2024-06-01", image: "https://via.placeholder.com/400x200"}} />
        <FeedbackCard></FeedbackCard>
    </div>
  )
}

export default App
