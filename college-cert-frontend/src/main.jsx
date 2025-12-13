import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EventsList from "./pages/EventsList.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";
import StudentCertPage from "./pages/StudentCertPage.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/events" element={<EventsList />} />
        <Route path="/admin/events/:id" element={<EventDetail />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:code" element={<VerifyPage />} />
        <Route path="/student/:token" element={<StudentCertPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
