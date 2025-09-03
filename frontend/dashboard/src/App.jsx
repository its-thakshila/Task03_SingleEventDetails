import { Routes, Route } from "react-router-dom";
import BoardPage from "./pages/BoardPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="*" element={<div className="p-6">Not found</div>} />
    </Routes>
  );
}