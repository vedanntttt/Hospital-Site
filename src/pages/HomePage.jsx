import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/react.svg';
import { PatientContext } from '../App';

function HomePage() {
  const navigate = useNavigate();
  const { patients, setPatients } = useContext(PatientContext);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '', contact: '', doctor: '', date: '' });

  const doctors = ['Dr. Mehta', 'Dr. Iyer', 'Dr. Patel'];

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toString() === search.trim()
  );

  const handleEdit = (patient) => {
    setEditId(patient.id);
    setEditForm({
      name: patient.name,
      age: patient.age,
      contact: patient.contact,
      doctor: patient.doctor || '',
      date: patient.date || '',
    });
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = () => {
    setPatients(patients.map(p =>
      p.id === editId ? { ...p, ...editForm } : p
    ));
    setEditId(null);
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src={logo} alt="Hospital Logo" width="40" height="40" className="me-2" />
            <span className="fw-bold fs-4">Narayana Superspeciality Hospital</span>
          </a>
          <div className="ms-auto d-flex gap-2">
            <button className="btn btn-light" onClick={() => navigate('/home')}>Home</button>
            <button className="btn btn-light" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button className="btn btn-light" onClick={() => navigate('/doctor-schedule')}>Doctor Schedule</button>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </nav>
      <div className="container py-4">
        <div className="mb-4 d-flex justify-content-center">
          <input
            className="form-control w-50"
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="table table-bordered bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Contact</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{editId === p.id ? (
                  <input name="name" className="form-control" value={editForm.name} onChange={handleEditChange} />
                ) : p.name}</td>
                <td>{editId === p.id ? (
                  <input name="age" className="form-control" value={editForm.age} onChange={handleEditChange} />
                ) : p.age}</td>
                <td>{editId === p.id ? (
                  <input name="contact" className="form-control" value={editForm.contact} onChange={handleEditChange} />
                ) : p.contact}</td>
                <td>{editId === p.id ? (
                  <select name="doctor" className="form-select" value={editForm.doctor} onChange={handleEditChange}>
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (p.doctor || '')}</td>
                <td>{editId === p.id ? (
                  <input name="date" type="date" className="form-control" value={editForm.date || ''} onChange={handleEditChange} />
                ) : (p.date || '')}</td>
                <td>{editId === p.id ? (
                  <button className="btn btn-success btn-sm" onClick={handleEditSave}>Save</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="d-flex justify-content-center mt-4">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
        <div className="text-secondary fs-5 text-center mt-3">
          Secure Patient Record System for Hospitals
        </div>
      </div>
    </div>
  );
}

export default HomePage;
