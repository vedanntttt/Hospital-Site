import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';

export const PatientContext = createContext();

function RedirectToLogin() {
  const location = useLocation();
  return <Navigate to="/login" state={{ from: location }} replace />;
}

function App() {
  // Persist user and patients in localStorage
  const [user, setUser] = React.useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [patients, setPatients] = React.useState(() => {
    const saved = localStorage.getItem('patients');
    return saved ? JSON.parse(saved) : [];
  });

  // Save user and patients to localStorage on change
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  React.useEffect(() => {
    localStorage.setItem('patients', JSON.stringify(patients));
  }, [patients]);

  return (
    <PatientContext.Provider value={{ patients, setPatients }}>
      <Router>
        <Routes>
          <Route path="/" element={<RedirectToLogin />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route
            path="/dashboard"
            element={
              user ? (
                <DashboardPage user={user} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/doctor-schedule"
            element={
              user ? (
                <DoctorSchedulePage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </Router>
    </PatientContext.Provider>
  );
}

export default App;
