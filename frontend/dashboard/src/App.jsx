import { Routes, Route, Link } from "react-router-dom";
import FeedbackPage from "../pages/FeedbackPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* home or other team routes */}
      <Route path="/" element={
        <div className="p-6">
          <h1 className="text-xl font-bold">Home</h1>
          <Link
            to="/feedback/2"
            className="text-blue-600 underline"
          >
            Go to feedback for sample event
          </Link>
        </div>
      } />

      {/* ✅ feedback page */}
      <Route path="/feedback/:eventId" element={<FeedbackPage />} />
    </Routes>
  );
}