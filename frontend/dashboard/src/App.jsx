import { Routes, Route } from "react-router-dom";
import SingleEventDetailPage from "../pages/SingleEventDetailPage.jsx";
import FeedbackPage from "../pages/FeedbackPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="/events/:id" element={<SingleEventDetailPage />} />
            <Route path="/events/:eventId/feedback" element={<FeedbackPage />} />
        </Routes>
    );
}
