import React, { useState, useEffect } from 'react';
import LoginPage from '../pages/LoginPage';

function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const authStatus = localStorage.getItem('hospitalAuth');
    const userName = localStorage.getItem('hospitalUser');
    const userUsername = localStorage.getItem('hospitalUsername');

    if (authStatus === 'true' && userName && userUsername) {
      setIsAuthenticated(true);
      setUser({ name: userName, username: userUsername });
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hospitalAuth');
    localStorage.removeItem('hospitalUser');
    localStorage.removeItem('hospitalUsername');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage setUser={(userData) => {
      setUser(userData);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div>
      {/* Header with user info and logout */}
      <nav className="navbar navbar-light bg-light border-bottom d-print-none">
        <div className="container-fluid">
          <span className="navbar-text">
            Welcome, <strong>{user?.name}</strong>
          </span>
          <button 
            className="btn btn-outline-danger btn-sm"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
      
      {/* Main content */}
      {children}
    </div>
  );
}

export default AuthWrapper;
