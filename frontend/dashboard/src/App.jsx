import { Routes, Route, useParams } from "react-router-dom";
import FeedbackCard from "../components/feedbackcard.jsx";

function EventPage() {
  const { eventId } = useParams();            // <-- path param
  return <FeedbackCard eventId={eventId} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/event/:eventId" element={<EventPage />} />
      {/* optional: a default route */}
      <Route path="*" element={<div>Open /event/&lt;uuid&gt; to rate</div>} />
    </Routes>
  );
}
