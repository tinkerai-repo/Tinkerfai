import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Project from "./Project";
import Dashboard from "./components/Dashboard";

// ProtectedRoute component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? children : <Navigate to="/login" replace />;
}

function App() {
  // return <Login />;
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            localStorage.getItem("accessToken") ? (
              <Navigate to="/profile" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Updated: Dynamic project route with projectId parameter */}
        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Project />
            </ProtectedRoute>
          }
        />
        {/* Optional: Redirect /project to profile if no projectId */}
        <Route path="/project" element={<Navigate to="/profile" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
