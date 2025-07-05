# How to Clear All Patient Data

## Method 1: Using the Clear All Data Button (Recommended)
1. Go to the Doctor Schedule page in your application
2. Look for the red "🗑️ Clear All Data" button next to the Add Patient form
3. Click the button and confirm when prompted
4. All patient data will be cleared and the page will refresh

## Method 2: Using Browser Console
1. Open your browser's Developer Tools (Press F12)
2. Go to the Console tab
3. Run this command:
   ```javascript
   localStorage.clear(); 
   window.location.reload();
   ```
4. Press Enter and the page will refresh with all data cleared

## Method 3: Manual localStorage Cleanup
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Click on Local Storage → http://localhost:5173
4. Delete these keys manually:
   - `patients`
   - `doctorScheduleNewPatients_Aditi_Mam`
   - `doctorScheduleNewPatients_Chaitanya_Sir`
   - Any other keys starting with `doctorScheduleNewPatients_`
5. Refresh the page

## What Data Gets Cleared
- ✅ All general patient records
- ✅ All doctor schedule appointments
- ✅ All slot bookings
- ❌ User login information (preserved)

## Data Validation Added
The application now includes validation to prevent invalid data:
- ✅ Names must be at least 2 characters
- ✅ Names can only contain letters, spaces, dots, and hyphens
- ✅ Phone numbers must be at least 10 digits
- ✅ Test data like "dfdlk" is automatically rejected
- ✅ Search results filter out invalid/test data

## Prevention Measures
- Input validation prevents saving invalid patient names
- Search functionality filters out test data
- Clear data button for easy cleanup
- Better error messages for invalid inputs
