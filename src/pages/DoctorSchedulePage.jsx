import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/react.svg';

const doctor = 'Dr. Mehta';
const assistant = 'Assistant';
const slotsPerDay = 70;
const slotDuration = 10; // minutes
const startTime = { hour: 10, min: 30 };
const breakAfter = 7; // slots
const breakDuration = 60; // minutes

// Generate 70 slots from 10:30 AM to 7:00 PM with 2 breaks of 1 hour
function generateRecheckupSlots() {
  const slots = [];
  let hour = 10;
  let min = 30;
  // 70 slots, 6 min each, with 2 breaks after 23rd and 46th slot
  const slotDuration = 6; // minutes
  for (let i = 0; i < 70; i++) {
    // Insert a 1-hour break after 23rd and 46th slot (i.e., after slot 23 and 46)
    if (i === 23 || i === 46) {
      min += 60;
      hour += Math.floor(min / 60);
      min = min % 60;
    }
    const endMin = min + slotDuration;
    let endHour = hour + Math.floor(endMin / 60);
    let endMinute = endMin % 60;
    const slot = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    slots.push({ slot, type: 'recheckup', patient: '' });
    hour = endHour;
    min = endMinute;
  }
  return slots;
}

// Helper to format date as DD-MM-YYYY
function formatDateIndian(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

// Helper to get month name
const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getAvailableSlotsForDate(dateStr, newPatients, slotsPerDay = 70) {
  const scheduled = (newPatients[dateStr] || []).length;
  return slotsPerDay - scheduled;
}

// Helper to format date as YYYY-MM-DD in local time
function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if a date is Sunday
function isSunday(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.getDay() === 0;
}

function DoctorSchedulePage() {
  // Remove date state, use selectedDate everywhere
  // const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPatients, setNewPatients] = useState(() => {
    const saved = localStorage.getItem('doctorScheduleNewPatients');
    return saved ? JSON.parse(saved) : {};
  });
  const [form, setForm] = useState({ name: '', phone: '' });
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date())); // Use local date
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const recheckupSlots = generateRecheckupSlots();

  // Move these inside the render so they always use the latest selectedDate
  const key = selectedDate;
  const scheduledNew = React.useMemo(() => newPatients[key] || [], [newPatients, key]);
  const availableSlots = React.useMemo(
    () => recheckupSlots
      .map(s => s.slot)
      .filter(slot => !(newPatients[key] || []).some(p => p.slot === slot)),
    [recheckupSlots, newPatients, key]
  );

  // Helper to flatten all patients with date info
  const allPatients = React.useMemo(() => {
    let arr = [];
    Object.entries(newPatients).forEach(([date, patients]) => {
      patients.forEach(p => arr.push({ ...p, date }));
    });
    return arr;
  }, [newPatients]);
  const searchResults = React.useMemo(() => {
    if (!search.trim()) return [];
    const s = search.toLowerCase();
    return allPatients.filter(p =>
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.phone && p.phone.includes(s))
    );
  }, [allPatients, search]);

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPatient = e => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    // Assign the first available slot to the new patient
    const slot = availableSlots[0];
    if (!slot) {
      setSuccess('No available slots!');
      setTimeout(() => setSuccess(''), 1500);
      return;
    }
    setNewPatients(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { id: Date.now(), name: form.name, phone: form.phone, slot }],
    }));
    setForm({ name: '', phone: '' });
    setSuccess('New patient registered!');
    setTimeout(() => setSuccess(''), 1500);
  };

  const handleEdit = (slot, idx) => {
    // Find the patient for this slot
    const newPatient = scheduledNew.find(p => p.slot === slot.slot);
    setEditId(idx);
    setEditForm({
      name: newPatient ? newPatient.name : '',
      phone: newPatient ? newPatient.phone || '' : '',
      date: selectedDate, // Use selectedDate
      time: slot.slot.split(' - ')[0],
    });
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = idx => {
    if (!window.confirm('Are you sure you want to save changes to this patient?')) return;
    // Find the slot being edited
    const slot = recheckupSlots[idx].slot;
    const newDate = editForm.date;
    setNewPatients(prev => {
      const updated = { ...prev };
      // Remove from current date
      const filtered = (updated[key] || []).filter(p => p.slot !== slot);
      // If date changed, move to new date
      if (newDate !== key) {
        // Check if slot is already taken on new date
        const taken = (updated[newDate] || []).some(p => p.slot === slot);
        if (taken) {
          alert('This slot is already taken on the selected date.');
          return prev;
        }
        // Add to new date
        updated[key] = filtered;
        if (editForm.name.trim() && editForm.phone.trim()) {
          updated[newDate] = [
            ...(updated[newDate] || []),
            { id: Date.now(), name: editForm.name, phone: editForm.phone, slot }
          ];
        }
      } else {
        // If a name is provided, add/update the patient on the same date
        if (editForm.name.trim() && editForm.phone.trim()) {
          filtered.push({ id: Date.now(), name: editForm.name, phone: editForm.phone, slot });
        }
        updated[key] = filtered;
      }
      return updated;
    });
    setEditId(null);
  };

  // Add delete handler
  function handleDeletePatient(slot) {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    setNewPatients(prev => {
      const updated = { ...prev };
      updated[key] = (updated[key] || []).filter(p => p.slot !== slot);
      return updated;
    });
  }

  // Save to localStorage whenever newPatients changes
  useEffect(() => {
    localStorage.setItem('doctorScheduleNewPatients', JSON.stringify(newPatients));
  }, [newPatients]);

  // Calculate available slots for each day in selected month
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const dateObj = new Date(selectedYear, selectedMonth, i + 1);
    const dateStr = formatDateLocal(dateObj); // Use local date
    return {
      date: dateStr,
      day: i + 1,
      available: getAvailableSlotsForDate(dateStr, newPatients)
    };
  });

  // When month/year changes, reset selectedDate to first of month
  useEffect(() => {
    const firstDay = formatDateLocal(new Date(selectedYear, selectedMonth, 1));
    setSelectedDate(firstDay);
  }, [selectedMonth, selectedYear]);

  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src={logo} alt="Hospital Logo" width="40" height="40" className="me-2" />
            <span className="fw-bold fs-4">Narayana Superspeciality Hospital</span>
          </a>
        </div>
      </nav>
      <div className="container py-4">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>
          &larr; Back to Dashboard
        </button>
        <h3>Doctor Schedule</h3>
        {/* Search input for recheckup patients */}
        <div className="mb-3 d-flex justify-content-end">
          <input
            className="form-control fs-4 w-50 p-3"
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 500, minHeight: 56 }}
          />
        </div>

        {search.trim() && (
          <div className="mb-4">
            <h5>Search Results</h5>
            {searchResults.length === 0 ? (
              <div className="alert alert-warning">No patients found.</div>
            ) : (
              <table className="table table-bordered bg-white">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((p, idx) => (
                    <tr key={p.id + '-' + p.date + '-' + p.slot}>
                      <td>{p.name}</td>
                      <td>{p.phone}</td>
                      <td>{formatDateIndian(p.date)}</td>
                      <td>{p.slot}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!search.trim() && (
          <>
            {/* Month buttons row with available slots */}
            <div className="mb-4 d-flex flex-wrap gap-2 justify-content-between">
              <div className="d-flex flex-wrap gap-2">
                {Array.from({ length: 9 }, (_, m) => {
                  // Jan to Sep (left)
                  const daysInMonth = getDaysInMonth(selectedYear, m);
                  let totalAvailable = 0;
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateObj = new Date(selectedYear, m, d);
                    const dateStr = formatDateLocal(dateObj);
                    if (!isSunday(dateStr)) {
                      totalAvailable += getAvailableSlotsForDate(dateStr, newPatients);
                    }
                  }
                  return (
                    <button
                      key={m}
                      className={`btn btn-lg btn-outline-primary fw-bold px-4 py-3${selectedMonth === m ? ' active' : ''}`}
                      style={{ minWidth: 120, fontSize: '1.25rem' }}
                      onClick={() => setSelectedMonth(m)}
                    >
                      {monthNames[m]}<br />
                      <span className="small text-success">{totalAvailable} slots</span>
                    </button>
                  );
                })}
              </div>
              <div className="d-flex flex-wrap gap-2">
                {Array.from({ length: 3 }, (_, i) => {
                  // Oct, Nov, Dec (right)
                  const m = i + 9;
                  const daysInMonth = getDaysInMonth(selectedYear, m);
                  let totalAvailable = 0;
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateObj = new Date(selectedYear, m, d);
                    const dateStr = formatDateLocal(dateObj);
                    if (!isSunday(dateStr)) {
                      totalAvailable += getAvailableSlotsForDate(dateStr, newPatients);
                    }
                  }
                  return (
                    <button
                      key={m}
                      className={`btn btn-lg btn-outline-primary fw-bold px-4 py-3${selectedMonth === m ? ' active' : ''}`}
                      style={{ minWidth: 120, fontSize: '1.25rem' }}
                      onClick={() => setSelectedMonth(m)}
                    >
                      {monthNames[m]}<br />
                      <span className="small text-success">{totalAvailable} slots</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Calendar grid for selected month */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedYear(y => y - 1)}>&lt;</button>
                <span className="fw-bold" style={{ fontSize: '2rem' }}>{selectedYear}</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedYear(y => y + 1)}>&gt;</button>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered text-center bg-white">
                  <thead>
                    <tr>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Sun</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Mon</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Tue</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Wed</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Thu</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Fri</th>
                      <th style={{ fontSize: '1.25rem', padding: 12 }}>Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                      const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
                      const weeks = [];
                      let day = 1;
                      for (let w = 0; w < 6; w++) { // max 6 weeks in a month
                        const week = [];
                        for (let d = 0; d < 7; d++) {
                          if ((w === 0 && d < firstDay) || day > daysInMonth) {
                            week.push(<td key={d}></td>);
                          } else {
                            const dateObj = new Date(selectedYear, selectedMonth, day);
                            const dateStr = formatDateLocal(dateObj); // Use local date
                            const isSun = dateObj.getDay() === 0;
                            week.push(
                              <td key={d} style={{ minWidth: 80, padding: 0 }}>
                                <button
                                  className={`btn btn-outline-dark btn-sm w-100${selectedDate === dateStr ? ' active' : ''}`}
                                  onClick={() => !isSun && setSelectedDate(dateStr)}
                                  disabled={isSun}
                                  style={{
                                    fontSize: '1.5rem',
                                    padding: '1.25rem 0',
                                    ...(isSun ? { background: '#f8d7da', color: '#721c24', cursor: 'not-allowed' } : {})
                                  }}
                                >
                                  <div className="fw-bold">{day}</div>
                                  <div className={`small ${isSun ? 'text-danger' : 'text-success'}`}>{isSun ? 'Closed' : `${getAvailableSlotsForDate(dateStr, newPatients)} slots`}</div>
                                </button>
                              </td>
                            );
                            day++;
                          }
                        }
                        weeks.push(<tr key={w}>{week}</tr>);
                        if (day > daysInMonth) break;
                      }
                      return weeks;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Existing patient scheduling table and form... */}
            {isSunday(selectedDate) ? (
              <div className="alert alert-warning">No slots available on Sundays.</div>
            ) : (
              <>
                <div className="row mb-4">
                  <div className="col-md-6">
                    <form className="d-flex align-items-end gap-2" onSubmit={handleAddPatient}>
                      <div className="flex-grow-1">
                        <label className="form-label">Add New Patient to {formatDateIndian(selectedDate)}</label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          name="name"
                          placeholder="Enter patient name"
                          value={form.name}
                          onChange={handleFormChange}
                          required
                        />
                        <input
                          type="tel"
                          className="form-control"
                          name="phone"
                          placeholder="Enter phone number"
                          value={form.phone}
                          onChange={handleFormChange}
                          required
                          pattern="[0-9]{10,15}"
                          title="Enter a valid phone number"
                        />
                      </div>
                      <button type="submit" className="btn btn-success mb-1">Add</button>
                    </form>
                    {success && <div className="alert alert-info mt-2 py-1">{success}</div>}
                  </div>
                </div>
                <h5>All Scheduled Patients for {formatDateIndian(selectedDate)}</h5>
                <table className="table table-bordered bg-white">
                  <thead>
                    <tr>
                      <th>Time Slot</th>
                      <th>Patient Name</th>
                      <th>Phone</th>
                      <th>Type</th>
                      <th>Recheckup Date</th>
                      <th>Recheckup Time</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recheckupSlots.map((slot, idx) => {
                      let newPatient = scheduledNew.find(p => p.slot === slot.slot);
                      const hasPatient = !!newPatient;
                      return (
                        <tr key={slot.slot}>
                          <td>{slot.slot}</td>
                          <td>
                            {editId === idx ? (
                              <input name="name" className="form-control" value={editForm.name} onChange={handleEditChange} />
                            ) : (
                              hasPatient ? newPatient.name : <span className="text-muted">(empty)</span>
                            )}
                          </td>
                          <td>
                            {editId === idx ? (
                              <input name="phone" className="form-control" value={editForm.phone} onChange={handleEditChange} pattern="[0-9]{10,15}" title="Enter a valid phone number" />
                            ) : (
                              hasPatient ? newPatient.phone : <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{hasPatient ? 'New' : 'Recheckup'}</td>
                          <td>
                            {editId === idx ? (
                              <input type="date" name="date" className="form-control" value={editForm.date} onChange={handleEditChange} />
                            ) : (
                              formatDateIndian(selectedDate)
                            )}
                          </td>
                          <td>
                            {editId === idx ? (
                              <input type="time" name="time" className="form-control" value={editForm.time} onChange={handleEditChange} />
                            ) : (
                              slot.slot.split(' - ')[0]
                            )}
                          </td>
                          <td className="d-flex gap-1">
                            {editId === idx ? (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleEditSave(idx)}>Save</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-primary btn-sm me-1" onClick={() => handleEdit(slot, idx)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => hasPatient && handleDeletePatient(slot.slot)} disabled={!hasPatient}>
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorSchedulePage;
