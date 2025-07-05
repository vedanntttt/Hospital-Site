import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/react.svg'; // Placeholder logo

function LoginPage({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get all user credentials from environment variables
  const users = [
    {
      name: import.meta.env.VITE_USER1_NAME,
      username: import.meta.env.VITE_USER1_USERNAME,
      password: import.meta.env.VITE_USER1_PASSWORD
    },
    {
      name: import.meta.env.VITE_USER2_NAME,
      username: import.meta.env.VITE_USER2_USERNAME,
      password: import.meta.env.VITE_USER2_PASSWORD
    },
    {
      name: import.meta.env.VITE_USER3_NAME,
      username: import.meta.env.VITE_USER3_USERNAME,
      password: import.meta.env.VITE_USER3_PASSWORD
    },
    {
      name: import.meta.env.VITE_USER4_NAME,
      username: import.meta.env.VITE_USER4_USERNAME,
      password: import.meta.env.VITE_USER4_PASSWORD
    },
    {
      name: import.meta.env.VITE_USER5_NAME,
      username: import.meta.env.VITE_USER5_USERNAME,
      password: import.meta.env.VITE_USER5_PASSWORD
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Check if credentials match any user
    const validUser = users.find(user =>
      user.username === username && user.password === password
    );

    if (validUser) {
      // Store login status and user info in localStorage
      localStorage.setItem('hospitalAuth', 'true');
      localStorage.setItem('hospitalUser', validUser.name);
      localStorage.setItem('hospitalUsername', validUser.username);

      // Set user for the app
      setUser({ name: validUser.name, username: validUser.username });

      // Redirect to dashboard
      navigate('/');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', height: '100vh' }}>
      <div className="card shadow p-4" style={{ minWidth: 350, maxWidth: 400 }}>
        <div className="text-center mb-3">
          <img src={logo} alt="Hospital Logo" width="48" height="48" className="mb-2" />
          <h4 className="fw-bold">Narayana Superspeciality Hospital</h4>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
