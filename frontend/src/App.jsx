import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Doctors from './pages/Doctors'
import SMSMonitor from './pages/SMSMonitor'
import Scheduler from './pages/Scheduler'
import Alerts from './pages/Alerts'
import CheckInPublic from './pages/CheckInPublic'

function PrivateRoute({ children }) {
  return localStorage.getItem('access_token') ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/checkin/:token"  element={<CheckInPublic />} />
        <Route path="/"                element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/patients"   element={<PrivateRoute><Layout><Patients /></Layout></PrivateRoute>} />
        <Route path="/patients/:id" element={<PrivateRoute><Layout><PatientDetail /></Layout></PrivateRoute>} />
        <Route path="/doctors"    element={<PrivateRoute><Layout><Doctors /></Layout></PrivateRoute>} />
        <Route path="/sms"        element={<PrivateRoute><Layout><SMSMonitor /></Layout></PrivateRoute>} />
        <Route path="/scheduler"  element={<PrivateRoute><Layout><Scheduler /></Layout></PrivateRoute>} />
        <Route path="/alerts"     element={<PrivateRoute><Layout><Alerts /></Layout></PrivateRoute>} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
