import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database helper functions
export const db = {
  // Users/Authentication
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Patients
  async getPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('id', { ascending: false })
    return { data, error }
  },

  async addPatient(patient) {
    // Only include fields that exist in the simplified patients table
    const cleanData = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      date: patient.date,
      doctor: patient.doctor
    };
    const { data, error } = await supabase
      .from('patients')
      .insert([cleanData])
      .select()
    return { data, error }
  },

  async updatePatient(id, updates) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deletePatient(id) {
    const { data, error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Doctor Schedules
  async getScheduleSlots(date, doctorName) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select('*')
      .eq('date', date)
      .eq('doctor_name', doctorName)
      .order('slot_time')
    return { data, error }
  },

  async bookSlot(slotData) {
    // Include doctor_name field for doctor-specific schedules
    const cleanData = {
      slot_time: slotData.slot_time,
      patient_name: slotData.patient_name,
      patient_phone: slotData.patient_phone,
      date: slotData.date,
      doctor_name: slotData.doctor_name
    };
    const { data, error } = await supabase
      .from('schedule_slots')
      .insert([cleanData])
      .select()
    return { data, error }
  },

  async updateSlot(id, updates) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async deleteSlot(id) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}
