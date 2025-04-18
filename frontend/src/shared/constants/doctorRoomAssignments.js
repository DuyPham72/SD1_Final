// src/shared/constants/doctorRoomAssignments.js
// Map each doctor to their assigned rooms

const DOCTOR_ROOM_ASSIGNMENTS = {
  // Dr. Smith (doctor1) is assigned to all rooms starting with 1
  "doctor1": { 
    pattern: "^1",  // Regex pattern to match rooms like 101A, 102B, etc.
    name: "Dr. Smith" 
  },
  
  // Dr. Johnson (doctor2) is assigned to all rooms starting with 2
  "doctor2": { 
    pattern: "^2", 
    name: "Dr. Johnson" 
  },
  
  // Dr. Williams (doctor3) is assigned to all rooms starting with 3
  "doctor3": { 
    pattern: "^3", 
    name: "Dr. Williams" 
  },
  
  // Dr. Davis (doctor4) is assigned to all rooms starting with 4
  "doctor4": { 
    pattern: "^4", 
    name: "Dr. Davis" 
  },
  
  // nurse1 and staff can see all patients
  "nurse1": { 
    pattern: ".*", // Match any room
    name: "Nurse Thompson" 
  },
  
  "staff": { 
    pattern: ".*", // Match any room
    name: "Staff Member" 
  }
};

export default DOCTOR_ROOM_ASSIGNMENTS; 