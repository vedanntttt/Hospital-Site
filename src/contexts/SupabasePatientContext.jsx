import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/supabase';

const SupabasePatientContext = createContext();

export const usePatients = () => {
  const context = useContext(SupabasePatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a SupabasePatientProvider');
  }
  return context;
};

export const SupabasePatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load patients from Supabase
  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.getPatients();
      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new patient
  const addPatient = async (patientData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.addPatient(patientData);
      if (error) throw error;

      // Update local state
      setPatients(prev => [data[0], ...prev]);
      return { success: true, data: data[0] };
    } catch (err) {
      setError(err.message);
      console.error('Error adding patient:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update patient
  const updatePatient = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.updatePatient(id, updates);
      if (error) throw error;

      // Update local state
      setPatients(prev => prev.map(p => p.id === id ? data[0] : p));
      return { success: true, data: data[0] };
    } catch (err) {
      setError(err.message);
      console.error('Error updating patient:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete patient
  const deletePatient = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await db.deletePatient(id);
      if (error) throw error;
      
      // Update local state
      setPatients(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting patient:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Load schedule slots for a specific date and doctor
  const loadScheduleSlots = async (date, doctorName) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.getScheduleSlots(date, doctorName);
      if (error) throw error;

      // Use doctor-specific key to separate schedules
      const key = `${date}-${doctorName}`;
      setScheduleSlots(prev => ({
        ...prev,
        [key]: data || []
      }));
      return { success: true, data: data || [] };
    } catch (err) {
      setError(err.message);
      console.error('Error loading schedule slots:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Book a slot
  const bookSlot = async (slotData) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.bookSlot(slotData);
      if (error) throw error;

      // Update local state
      const key = `${slotData.date}`;
      setScheduleSlots(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), data[0]]
      }));
      return { success: true, data: data[0] };
    } catch (err) {
      setError(err.message);
      console.error('Error booking slot:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update slot
  const updateSlot = async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.updateSlot(id, updates);
      if (error) throw error;

      // Update local state
      setScheduleSlots(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(slot =>
            slot.id === id ? data[0] : slot
          );
        });
        return updated;
      });
      return { success: true, data: data[0] };
    } catch (err) {
      setError(err.message);
      console.error('Error updating slot:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete slot
  const deleteSlot = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await db.deleteSlot(id);
      if (error) throw error;
      
      // Update local state
      setScheduleSlots(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].filter(slot => slot.id !== id);
        });
        return updated;
      });
      return { success: true };
    } catch (err) {
      setError(err.message);
      console.error('Error deleting slot:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadPatients();
  }, []);

  const value = {
    // Data
    patients,
    scheduleSlots,
    loading,
    error,
    
    // Patient methods
    loadPatients,
    addPatient,
    updatePatient,
    deletePatient,
    
    // Schedule methods
    loadScheduleSlots,
    bookSlot,
    updateSlot,
    deleteSlot,
    
    // Utility
    clearError: () => setError(null)
  };

  return (
    <SupabasePatientContext.Provider value={value}>
      {children}
    </SupabasePatientContext.Provider>
  );
};
