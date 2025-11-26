import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import BookingPage from './pages/BookingPage'

// -------------------- Protected Route --------------------
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// -------------------- Admin-Only Route --------------------
const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  return user && user.role === 'admin'
    ? children
    : <Navigate to="/dashboard" replace />
}

// -------------------- APP COMPONENT --------------------
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <main className="pt-4">
            <Routes>

              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* User Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Protected */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
