// Major Indian government holidays for 2024 and 2025 (add/update as needed)
const fixedHolidays = {
  '-01-01': "New Year's Day",
  '-01-26': 'Republic Day',
  '-08-15': 'Independence Day',
  '-10-02': 'Gandhi Jayanti',
  '-12-25': 'Christmas',
};
// Variable-date holidays for 2024 and 2025 (update yearly as needed)
const variableHolidays = {
  // 2024
  '2024-03-08': 'Maha Shivratri',
  '2024-03-25': 'Holi',
  '2024-03-29': 'Good Friday',
  '2024-04-09': 'Gudi Padwa/Ugadi',
  '2024-04-11': 'Eid-ul-Fitr',
  '2024-06-17': 'Eid-ul-Adha',
  '2024-08-19': 'Raksha Bandhan',
  '2024-10-12': 'Dussehra',
  '2024-10-31': 'Diwali',
  '2024-11-01': 'Diwali',
  '2024-11-02': 'Diwali',
  '2024-11-03': 'Diwali',
  '2024-11-04': 'Diwali',
  // 2025
  '2025-02-26': 'Maha Shivratri',
  '2025-03-14': 'Holi',
  '2025-04-18': 'Good Friday',
  '2025-03-30': 'Gudi Padwa/Ugadi',
  '2025-03-31': 'Eid-ul-Fitr',
  '2025-06-07': 'Eid-ul-Adha',
  '2025-08-08': 'Raksha Bandhan',
  '2025-10-02': 'Gandhi Jayanti / Dussehra',
  '2025-10-20': 'Diwali',
  '2025-10-21': 'Diwali',
  '2025-10-22': 'Diwali',
  '2025-10-23': 'Diwali',
};

function getHolidayName(dateStr) {
  // Check variable holidays first (full date)
  if (variableHolidays[dateStr]) return variableHolidays[dateStr];
  // Then check fixed holidays (by suffix)
  for (const suffix in fixedHolidays) {
    if (dateStr.endsWith(suffix)) return fixedHolidays[suffix];
  }
  return null;
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePatientData, sanitizePatientData, isTestData, clearAllPatientData } from '../utils/dataCleanup';
import { usePatients } from '../contexts/SupabasePatientContext.jsx';
import logo from '../assets/react.svg';

// Removed unused constants

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

function getAvailableSlotsForDate(dateStr, doctorName, scheduleSlots, slotsPerDay = 70) {
  const doctorScheduleKey = `${dateStr}-${doctorName}`;
  const scheduled = (scheduleSlots[doctorScheduleKey] || []).length;
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

function DoctorSchedulePage({ doctorName = "Aditi Mam" }) {
  console.log('🏥 DoctorSchedulePage loaded for:', doctorName);

  // Use Supabase context for data management
  const { scheduleSlots, loadScheduleSlots, bookSlot, updateSlot, deleteSlot } = usePatients();

  // Local state for UI management
  const [newPatients, setNewPatients] = useState({});

  // Load schedule data from Supabase when component mounts or doctor changes
  useEffect(() => {
    // Load existing schedule slots for this doctor
    const loadDoctorSchedule = async () => {
      // For now, we'll keep the localStorage structure but add Supabase integration
      const storageKey = `doctorScheduleNewPatients_${doctorName.replace(/\s/g, '_')}`;
      const saved = localStorage.getItem(storageKey);
      setNewPatients(saved ? JSON.parse(saved) : {});
    };
    loadDoctorSchedule();
  }, [doctorName]);

  // Save to localStorage when newPatients changes (temporary bridge solution)
  useEffect(() => {
    const storageKey = `doctorScheduleNewPatients_${doctorName.replace(/\s/g, '_')}`;
    localStorage.setItem(storageKey, JSON.stringify(newPatients));
  }, [newPatients, doctorName]);

  const [form, setForm] = useState({ name: '', phone: '' });
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', date: '', time: '' });
  const [searchEditId, setSearchEditId] = useState(null);
  const [searchEditForm, setSearchEditForm] = useState({ name: '', phone: '', date: '' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(formatDateLocal(new Date())); // Use local date
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const recheckupSlots = generateRecheckupSlots();

  // Calculate available slots using Supabase data
  const availableSlots = React.useMemo(
    () => {
      const doctorScheduleKey = `${selectedDate}-${doctorName}`;
      return recheckupSlots
        .map(s => s.slot)
        .filter(slot => !(scheduleSlots[doctorScheduleKey] || []).some(p => p.slot_time === slot));
    },
    [recheckupSlots, scheduleSlots, selectedDate, doctorName]
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
    return allPatients.filter(p => {
      // Filter out test data and invalid entries
      if (isTestData(p.name, p.phone)) return false;
      if (!p.name || !p.phone) return false;

      // Check if search matches
      return (p.name && p.name.toLowerCase().includes(s)) ||
             (p.phone && p.phone.includes(s));
    });
  }, [allPatients, search]);

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add patient to first available slot
  const handleAddPatient = async (e) => {
    e.preventDefault();

    // Debug: Check if bookSlot function exists
    console.log('bookSlot function:', bookSlot);

    // Sanitize input data
    const sanitized = sanitizePatientData(form.name, form.phone);

    // Validate input data
    const validation = validatePatientData(sanitized.name, sanitized.phone);
    if (!validation.isValid) {
      setSuccess(`Error: ${validation.errors.join(', ')}`);
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    // Check for test data
    if (isTestData(sanitized.name, sanitized.phone)) {
      setSuccess('Error: Please enter a valid patient name (no test data allowed)');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    // Find first available slot for the selected date and doctor
    console.log('🔍 Looking for available slots on:', selectedDate, 'for doctor:', doctorName);
    const doctorScheduleKey = `${selectedDate}-${doctorName}`;
    console.log('📊 Current schedule slots:', scheduleSlots[doctorScheduleKey]);

    const availableSlot = availableSlots.find(slot => {
      const existingPatient = (scheduleSlots[doctorScheduleKey] || []).find(p => p.slot_time === slot);
      console.log(`🔍 Checking slot ${slot}:`, existingPatient ? 'OCCUPIED' : 'AVAILABLE');
      return !existingPatient; // Return true if no existing patient in this slot
    });

    if (!availableSlot) {
      setSuccess('No available slots for this date. All slots are booked.');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    console.log('✅ Found available slot:', availableSlot);

    try {
      // Book slot in Supabase with doctor name
      const slotData = {
        slot_time: availableSlot,
        patient_name: sanitized.name,
        patient_phone: sanitized.phone,
        date: selectedDate,
        doctor_name: doctorName
      };

      console.log('Booking slot with data:', slotData);
      const result = await bookSlot(slotData);
      console.log('Booking result:', result);

      if (result.success) {
        console.log('✅ Patient booked successfully in slot:', availableSlot);

        // Reload schedule data to show the new booking
        await loadScheduleSlots(selectedDate, doctorName);

        // Clear form and show success message
        setForm({ name: '', phone: '' });
        setSuccess(`Patient booked successfully in slot ${availableSlot}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('❌ Failed to book patient:', result.error);
        setSuccess(`Error: ${result.error}`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error booking slot:', err);
      setSuccess('Error: Failed to book appointment');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  // Add patient to specific slot
  const handleSlotAdd = (slot, idx) => {
    console.log('🎯 Adding patient to slot:', slot.slot);
    setEditId(idx);
    setEditForm({
      name: '',
      phone: '',
      date: selectedDate,
      time: slot.slot.split(' - ')[0],
      isNewBooking: true, // Flag to indicate this is a new booking
    });
  };

  // Edit existing patient in slot
  const handleEdit = (slot, idx) => {
    console.log('✏️ Editing patient in slot:', slot.slot);
    console.log('📊 Current scheduleSlots:', scheduleSlots);
    console.log('📅 Selected date:', selectedDate);
    console.log('🔍 Looking for slot_time:', slot.slot);

    // Find the patient for this slot from Supabase data using doctor-specific key
    const doctorScheduleKey = `${selectedDate}-${doctorName}`;
    const existingSlot = (scheduleSlots[doctorScheduleKey] || []).find(s => s.slot_time === slot.slot);
    console.log('🎯 Found existing slot:', existingSlot);

    setEditId(idx);
    const formData = {
      name: existingSlot ? existingSlot.patient_name : '',
      phone: existingSlot ? existingSlot.patient_phone : '',
      date: selectedDate,
      time: slot.slot.split(' - ')[0],
      isNewBooking: false, // Flag to indicate this is editing existing
    };
    console.log('📝 Setting edit form data:', formData);
    setEditForm(formData);
  };

  const handleEditChange = e => {
    console.log('📝 Form field changed:', e.target.name, '=', e.target.value);
    const updatedForm = { ...editForm, [e.target.name]: e.target.value };
    console.log('📝 Updated form state:', updatedForm);
    setEditForm(updatedForm);
  };

  const handleEditSave = async (idx) => {
    console.log('💾 Saving slot booking...');

    // Sanitize input data
    const sanitized = sanitizePatientData(editForm.name, editForm.phone);

    // Validate input data
    const validation = validatePatientData(sanitized.name, sanitized.phone);
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`);
      return;
    }

    // Check for test data
    if (isTestData(sanitized.name, sanitized.phone)) {
      alert('Error: Please enter a valid patient name (no test data allowed)');
      return;
    }

    // Find the slot being edited
    const slot = recheckupSlots[idx].slot;

    // Use the flag to determine if this is a new booking or editing existing
    const isNewBooking = editForm.isNewBooking !== false; // Default to true if undefined
    console.log('📝 Is new booking?', isNewBooking, 'editForm.isNewBooking:', editForm.isNewBooking);

    // Find existing slot data using doctor-specific key
    const doctorScheduleKey = `${selectedDate}-${doctorName}`;
    const existingSlot = (scheduleSlots[doctorScheduleKey] || []).find(s => s.slot_time === slot);
    console.log('🔍 Existing slot found:', existingSlot);

    try {
      if (!isNewBooking && existingSlot) {
        // Update existing booking
        console.log('🔄 Updating existing booking:', existingSlot.id);
        const result = await updateSlot(existingSlot.id, {
          patient_name: sanitized.name,
          patient_phone: sanitized.phone,
          date: editForm.date
        });

        if (result.success) {
          console.log('✅ Booking updated successfully');
          setSuccess('Patient updated successfully!');
        } else {
          console.error('❌ Failed to update booking:', result.error);
          alert(`Error updating booking: ${result.error}`);
          return; // Don't clear form on error
        }
      } else {
        // Create new booking
        console.log('➕ Creating new booking for slot:', slot);
        const slotData = {
          slot_time: slot,
          patient_name: sanitized.name,
          patient_phone: sanitized.phone,
          date: editForm.date,
          doctor_name: doctorName
        };

        const result = await bookSlot(slotData);

        if (result.success) {
          console.log('✅ Booking created successfully');
          setSuccess('Patient booked successfully!');
        } else {
          console.error('❌ Failed to create booking:', result.error);
          alert(`Error booking slot: ${result.error}`);
          return; // Don't clear form on error
        }
      }

      // Reload schedule data to reflect changes
      console.log('🔄 Reloading schedule data for date:', selectedDate, 'doctor:', doctorName);
      const reloadResult = await loadScheduleSlots(selectedDate, doctorName);
      console.log('📊 Reload result:', reloadResult);
      console.log('📊 Updated scheduleSlots after reload:', scheduleSlots);

      // Clear form only after successful save
      console.log('✨ Clearing edit form');
      setEditId(null);
      setEditForm({ name: '', phone: '', date: '', time: '' });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('❌ Error in handleEditSave:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Delete patient from slot
  const handleDeletePatient = async (slot) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    console.log('🗑️ Deleting patient from slot:', slot);

    // Find the existing slot in Supabase data using doctor-specific key
    const doctorScheduleKey = `${selectedDate}-${doctorName}`;
    const existingSlot = (scheduleSlots[doctorScheduleKey] || []).find(s => s.slot_time === slot);

    if (!existingSlot) {
      console.error('❌ No slot found to delete');
      alert('Error: Could not find booking to delete');
      return;
    }

    try {
      const result = await deleteSlot(existingSlot.id);

      if (result.success) {
        console.log('✅ Booking deleted successfully');
        setSuccess('Patient deleted successfully!');

        // Reload schedule data to reflect changes
        await loadScheduleSlots(selectedDate, doctorName);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('❌ Failed to delete booking:', result.error);
        alert(`Error deleting booking: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error in handleDeletePatient:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Clear all patient data
  const handleClearAllData = () => {
    if (!window.confirm('Are you sure you want to clear ALL patient data? This action cannot be undone!')) return;
    const clearedCount = clearAllPatientData();
    setNewPatients({});
    setSuccess(`Cleared ${clearedCount} data entries from storage`);
    setTimeout(() => setSuccess(''), 3000);
    // Refresh the page to reload clean state
    window.location.reload();
  };

  // Search result edit handlers
  const handleSearchEdit = (patient) => {
    setSearchEditId(patient.id);
    setSearchEditForm({
      name: patient.name,
      phone: patient.phone,
      date: patient.date.split('-')[0] // Extract date part from key
    });
  };

  const handleSearchEditChange = (e) => {
    setSearchEditForm({ ...searchEditForm, [e.target.name]: e.target.value });
  };

  const handleSearchEditSave = (patient) => {
    // Sanitize input data
    const sanitized = sanitizePatientData(searchEditForm.name, searchEditForm.phone);

    // Validate input data
    const validation = validatePatientData(sanitized.name, sanitized.phone);
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`);
      return;
    }

    // Check for test data
    if (isTestData(sanitized.name, sanitized.phone)) {
      alert('Error: Please enter a valid patient name (no test data allowed)');
      return;
    }

    if (!window.confirm('Are you sure you want to save changes to this patient?')) return;

    const oldKey = patient.date;
    const newKey = searchEditForm.date + '-' + doctorName;

    setNewPatients(prev => {
      const updated = { ...prev };

      // Remove from old location
      updated[oldKey] = (updated[oldKey] || []).filter(p => p.id !== patient.id);

      // Add to new location (or same location with updated data)
      if (!updated[newKey]) updated[newKey] = [];

      // Check if slot is available at new date
      const slotTaken = updated[newKey].some(p => p.slot === patient.slot && p.id !== patient.id);
      if (slotTaken) {
        alert('This slot is already taken on the selected date');
        return prev;
      }

      updated[newKey].push({
        id: patient.id,
        name: sanitized.name,
        phone: sanitized.phone,
        slot: patient.slot
      });

      return updated;
    });

    setSearchEditId(null);
    setSuccess('Patient updated successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSearchEditCancel = () => {
    setSearchEditId(null);
    setSearchEditForm({ name: '', phone: '', date: '' });
  };

  const handleSearchDelete = (patient) => {
    if (!window.confirm(`Are you sure you want to delete ${patient.name}?`)) return;

    setNewPatients(prev => {
      const updated = { ...prev };
      const key = patient.date;
      updated[key] = (updated[key] || []).filter(p => p.id !== patient.id);
      return updated;
    });

    setSuccess('Patient deleted successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Remove all search edit/delete handlers and state

  // Calculate available slots for each day in selected month
  // daysInMonth and monthDates calculation removed as they were unused

  // When month/year changes, reset selectedDate to first of month
  useEffect(() => {
    const firstDay = formatDateLocal(new Date(selectedYear, selectedMonth, 1));
    setSelectedDate(firstDay);
  }, [selectedMonth, selectedYear]);

  // Load schedule data when selected date or doctor changes
  useEffect(() => {
    console.log('📅 Loading schedule data for date:', selectedDate, 'doctor:', doctorName);
    loadScheduleSlots(selectedDate, doctorName);
  }, [selectedDate, doctorName]); // Include doctorName to reload when switching doctors

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
        {/* REMOVE doctor navigation buttons from schedule page */}
        <div className="d-flex justify-content-end align-items-center mb-3 d-print-none">
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/dashboard')}>
            &larr; Back to Dashboard
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>Print Patient List
          </button>
        </div>
        <h3>Doctor Schedule</h3>
        {/* Search input for recheckup patients */}
        <div className="mb-3 d-flex justify-content-end d-print-none">
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
            <h5>Search Results ({searchResults.length} found)</h5>
            <div className="print-patient-list">
            {searchResults.length === 0 ? (
              <div className="alert alert-warning">
                <i className="bi bi-search me-2"></i>
                No patients found matching "{search}". Try a different search term.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover bg-white">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th width="120">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {searchResults.map((p) => {
                    const isSearchEditing = searchEditId === p.id;
                    return (
                      <tr key={p.id + '-' + p.date + '-' + p.slot}>
                        <td>
                          {isSearchEditing ? (
                            <input
                              name="name"
                              className="form-control form-control-sm"
                              value={searchEditForm.name}
                              onChange={handleSearchEditChange}
                              required
                              autoFocus
                            />
                          ) : (
                            p.name
                          )}
                        </td>
                        <td>
                          {isSearchEditing ? (
                            <input
                              name="phone"
                              className="form-control form-control-sm"
                              value={searchEditForm.phone}
                              onChange={handleSearchEditChange}
                              required
                            />
                          ) : (
                            p.phone
                          )}
                        </td>
                        <td>
                          {isSearchEditing ? (
                            <input
                              name="date"
                              type="date"
                              className="form-control form-control-sm"
                              value={searchEditForm.date}
                              onChange={handleSearchEditChange}
                              required
                            />
                          ) : (
                            formatDateIndian(p.date.split('-')[0])
                          )}
                        </td>
                        <td>{p.slot}</td>
                        <td>
                          {isSearchEditing ? (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleSearchEditSave(p)}
                                title="Save changes"
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={handleSearchEditCancel}
                                title="Cancel editing"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSearchEdit(p)}
                                title="Edit patient"
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleSearchDelete(p)}
                                title="Delete patient"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        )}

        {!search.trim() && <>
          {/* Month buttons row with available slots */}
          <div className="mb-4 d-print-none">
            <div className="d-flex flex-row flex-wrap gap-2 justify-content-center">
              {Array.from({ length: 12 }, (_, m) => {
                const daysInMonth = getDaysInMonth(selectedYear, m);
                let totalAvailable = 0;
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateObj = new Date(selectedYear, m, d);
                  const dateStr = formatDateLocal(dateObj);
                  if (!isSunday(dateStr)) {
                    totalAvailable += getAvailableSlotsForDate(dateStr, doctorName, scheduleSlots, 70);
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
          <div className="mb-4 d-print-none">
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
                          const holidayName = getHolidayName(dateStr);
                          const isHol = !!holidayName;
                          // Paint both Sundays and holidays red
                          const isRed = isSun || isHol;
                          week.push(
                            <td key={d} style={{ minWidth: 80, padding: 0 }}>
                              <button
                                className={`btn btn-outline-dark btn-sm w-100${selectedDate === dateStr ? ' active' : ''}`}
                                onClick={() => setSelectedDate(dateStr)}
                                style={{
                                  fontSize: '1.5rem',
                                  padding: '1.25rem 0',
                                  ...(isRed ? { background: '#ffcccc', color: '#b30000', borderColor: '#b30000' } : {})
                                }}
                              >
                                <div className="fw-bold">{day}</div>
                                <div className={`small ${isRed ? 'text-danger' : 'text-success'}`}
                                  style={{ minHeight: 18 }}>
                                  {isSun || isHol ? 'Closed' : `${getAvailableSlotsForDate(dateStr, doctorName, scheduleSlots)} slots`}
                                </div>
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
          {/* Allow adding patients on any day, but show a warning for Sundays/holidays */}
          {(isSunday(selectedDate) || getHolidayName(selectedDate)) && (
            <div className="alert alert-warning">{isSunday(selectedDate) ? 'Sunday (Closed):' : `Holiday (Closed): ${getHolidayName(selectedDate)}`} You can still add patients if the doctor is available.</div>
          )}
          <div className="row mb-4 d-print-none">
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
            <div className="col-md-6 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleClearAllData}
                title="Clear all patient data from storage"
              >
                🗑️ Clear All Data
              </button>
            </div>
          </div>
          <h5 className="d-print-none">All Scheduled Patients for {formatDateIndian(selectedDate)}</h5>
          <div className="print-patient-list">
            <h2 style={{margin: '16px 0'}}>Patient List for {formatDateIndian(selectedDate)}</h2>
            <table className="table table-bordered bg-white">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Time Slot</th>
                  <th>Patient Name</th>
                  <th>Phone</th>
                  <th>Appointment Date</th>
                  <th className="d-print-none">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recheckupSlots.map((slot, idx) => {
                  // Get patient data from Supabase using doctor-specific key
                  const doctorScheduleKey = `${selectedDate}-${doctorName}`;
                  const supabaseSlot = (scheduleSlots[doctorScheduleKey] || []).find(s => s.slot_time === slot.slot);
                  const newPatient = supabaseSlot ? {
                    name: supabaseSlot.patient_name,
                    phone: supabaseSlot.patient_phone,
                    slot: supabaseSlot.slot_time
                  } : null;
                  const isEditing = editId === idx;
                  return (
                    <tr key={slot.slot}>
                      <td>{idx + 1}</td>
                      <td>{slot.slot}</td>
                      <td>
                        {isEditing ? (
                          <input
                            name="name"
                            className="form-control"
                            value={editForm.name}
                            onChange={handleEditChange}
                            required
                            autoFocus
                          />
                        ) : newPatient ? newPatient.name : <span className="text-muted">(Empty)</span>}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="phone"
                            className="form-control"
                            value={editForm.phone}
                            onChange={handleEditChange}
                            required
                          />
                        ) : newPatient ? newPatient.phone : ''}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            name="date"
                            type="date"
                            className="form-control"
                            value={editForm.date}
                            onChange={handleEditChange}
                            required
                          />
                        ) : (
                          formatDateIndian(selectedDate)
                        )}
                      </td>
                      <td className="d-print-none">
                        {isEditing ? (
                          <>
                            <button className="btn btn-success btn-sm me-2" onClick={() => handleEditSave(idx)}>Save</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            {!newPatient && (
                              <button className="btn btn-primary btn-sm me-2" onClick={() => handleSlotAdd(slot, idx)}>
                                Add
                              </button>
                            )}
                            {newPatient && !isEditing && (
                              <>
                                <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(slot, idx)}>
                                  Edit
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeletePatient(slot.slot)}>
                                  Delete
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>}
      </div>
    </div>
  );
}

export default DoctorSchedulePage;
