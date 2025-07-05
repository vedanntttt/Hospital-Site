import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/react.svg';
import { usePatients } from '../contexts/SupabasePatientContext.jsx';

// Helper to format date as DD-MM-YYYY
function formatDateIndian(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

function DashboardPage() {
  // Get user data from localStorage (set by AuthWrapper)
  const user = {
    name: localStorage.getItem('hospitalUser'),
    username: localStorage.getItem('hospitalUsername')
  };

  const { patients, scheduleSlots, addPatient, updatePatient, deletePatient, loading, error } = usePatients();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '', date: '', contact: '', doctor: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', age: '', doctor: '', date: '', contact: '' });
  const navigate = useNavigate();

  const filtered = patients.filter(p => {
    const searchVal = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchVal) ||
      p.id.toString().includes(searchVal) ||
      (p.age && p.age.toString().includes(searchVal)) ||
      (p.doctor && p.doctor.toLowerCase().includes(searchVal)) ||
      (p.date && p.date.toLowerCase().includes(searchVal)) ||
      (p.contact && p.contact.toLowerCase().includes(searchVal))
    );
  });

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.gender || !form.date || !form.contact) {
      setFormError('All fields are required.');
      setFormSuccess(false);
      return;
    }

    try {
      const newPatient = {
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        date: form.date,
        contact: form.contact,
        doctor: form.doctor || '' // Optional doctor field
      };

      const result = await addPatient(newPatient);

      if (result.success) {
        setForm({ id: '', name: '', age: '', gender: '', date: '', contact: '', doctor: '' });
        setFormError('');
        setFormSuccess(true);
        setTimeout(() => setFormSuccess(false), 2000);
        setShowForm(false);
      } else {
        setFormError(`Error: ${result.error}`);
        setFormSuccess(false);
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      setFormError('Error: Failed to add patient');
      setFormSuccess(false);
    }
  };

  const handleEdit = (patient) => {
    setEditId(patient.id);
    setEditForm({
      name: patient.name,
      age: patient.age,
      doctor: patient.doctor,
      date: patient.date,
      contact: patient.contact,
    });
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    if (!window.confirm('Are you sure you want to save changes to this patient?')) return;

    try {
      const result = await updatePatient(editId, editForm);
      if (result.success) {
        setEditId(null);
      } else {
        alert(`Error updating patient: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Error: Failed to update patient');
    }
  };

  // Add delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    try {
      const result = await deletePatient(id);
      if (!result.success) {
        alert(`Error deleting patient: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Error: Failed to delete patient');
    }
  };

  // Debug info
  console.log('Dashboard - patients:', patients);
  console.log('Dashboard - scheduleSlots:', scheduleSlots);
  console.log('Dashboard - loading:', loading);
  console.log('Dashboard - error:', error);



  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src={logo} alt="Hospital Logo" width="40" height="40" className="me-2" />
            <span className="fw-bold fs-4">Narayana Superspeciality Hospital</span>
          </a>
          <span className="text-white ms-auto">Logged in as: <b>{user.name}</b></span>
        </div>
      </nav>
      <div className="container py-5">
        {/* Debug info */}
        {loading && <div className="alert alert-info">Loading patients...</div>}
        {error && <div className="alert alert-danger">Error: {error}</div>}
        {!loading && !error && patients.length === 0 && (
          <div className="alert alert-warning">No patients found. Add some patients or check Supabase connection.</div>
        )}
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-info btn-lg" onClick={() => navigate('/doctor-schedule/aditi')}>Aditi Mam</button>
          <button className="btn btn-info btn-lg" onClick={() => navigate('/doctor-schedule/chaitanya')}>Chaitanya Sir</button>
        </div>



        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Patient Records</h3>
          <div>
            <button className="btn btn-success" onClick={() => setShowForm(true)}>
              Add Patient
            </button>
          </div>
        </div>
        <div className="mb-3 d-flex justify-content-end">
          <input
            className="form-control w-25"
            type="text"
            placeholder="Search by any field..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="table table-bordered table-hover bg-white">
          <thead className="table-light">
            <tr>
              <th>Sr. No.</th>
              <th>ID</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Contact</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.id}>
                <td>{idx + 1}</td>
                <td>{p.id}</td>
                <td>{editId === p.id ? (
                  <input name="name" className="form-control" value={editForm.name} onChange={handleEditChange} />
                ) : p.name}</td>
                <td>{editId === p.id ? (
                  <input name="age" className="form-control" value={editForm.age} onChange={handleEditChange} />
                ) : p.age}</td>
                <td>{editId === p.id ? (
                  <select name="gender" className="form-select" value={editForm.gender || ''} onChange={handleEditChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (p.gender || '')}</td>
                <td>{editId === p.id ? (
                  <input name="contact" className="form-control" value={editForm.contact} onChange={handleEditChange} />
                ) : p.contact}</td>
                <td>{editId === p.id ? (
                  <input name="date" type="date" className="form-control" value={editForm.date || ''} onChange={handleEditChange} />
                ) : formatDateIndian(p.date)}</td>
                <td>{editId === p.id ? (
                  <button className="btn btn-success btn-sm" onClick={handleEditSave}>Save</button>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {showForm && (
          <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Patient</h5>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Patient ID</label>
                      <input type="text" className="form-control" name="id" value={form.id} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" name="name" value={form.name} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Age</label>
                      <input type="number" className="form-control" name="age" value={form.age} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Gender</label>
                      <select className="form-select" name="gender" value={form.gender} onChange={handleFormChange} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Date of Latest Visit</label>
                      <input type="date" className="form-control" name="date" value={form.date} onChange={handleFormChange} required />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Contact Number</label>
                      <input type="text" className="form-control" name="contact" value={form.contact} onChange={handleFormChange} required />
                    </div>
                    {formError && <div className="alert alert-danger py-2">{formError}</div>}
                    {formSuccess && <div className="alert alert-success py-2">Patient added successfully!</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
