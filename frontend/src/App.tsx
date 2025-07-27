import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import TaskHistory from './pages/TaskHistory'
import Calendar from './pages/Calendar'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import PaymentPlans from './pages/PaymentPlans'
import './App.css'

// Component to handle intended path restoration
const IntendedPathHandler = () => {
  const location = useLocation()
  
  // Save current path if it's not a login/register page
  React.useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem('intendedPath', location.pathname)
    }
  }, [location.pathname])
  
  return null
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  // Don't render routes while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TaskManager...</p>
          <p className="text-sm text-gray-400 mt-2">This should only take a few seconds</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="task-history" element={<TaskHistory />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="payment-plans" element={<PaymentPlans />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 