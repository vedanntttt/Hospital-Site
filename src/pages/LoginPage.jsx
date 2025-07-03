import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/react.svg'; // Placeholder logo

const roles = ['Admin', 'Doctor', 'Nurse', 'Receptionist'];

function LoginPage({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setError('All fields are required.');
      return;
    }
    setUser({ email, role });
    navigate('/dashboard');
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
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)} required>
              <option value="">Select Role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
