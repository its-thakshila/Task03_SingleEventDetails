// App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import SingleEventDetailPage from '../pages/SingleEventDetailPage.jsx';
import EventsScreen from './EventsScreen'; // your dynamic events component
import './App.css';

function Home() {
    return (
        <div className="home-container p-6">

            {/* Add EventsScreen directly */}
            <EventsScreen />
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            {/* dynamic route for individual event details */}
            <Route path="/events/:id" element={<SingleEventDetailPage />} />
        </Routes>
    );
}
