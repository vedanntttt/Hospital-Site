import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DoctorSchedulePage from './pages/DoctorSchedulePage';
import { SupabasePatientProvider } from './contexts/SupabasePatientContext.jsx';
import AuthWrapper from './components/AuthWrapper';

function App() {

  return (
    <SupabasePatientProvider>
      <Router>
        <AuthWrapper>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/doctor-schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor-schedule/aditi" element={<DoctorSchedulePage doctorName="Aditi Mam" />} />
            <Route path="/doctor-schedule/chaitanya" element={<DoctorSchedulePage doctorName="Chaitanya Sir" />} />
            <Route path="/home" element={<HomePage />} />
          </Routes>
        </AuthWrapper>
      </Router>
    </SupabasePatientProvider>
  );
}

export default App;
