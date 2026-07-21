import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { SchoolData } from "../types";

// Firebase Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAePRWslI69xvM65Z67UgC4Ds2qrULF_7k",
  authDomain: "high-practice-1pt51.firebaseapp.com",
  projectId: "high-practice-1pt51",
  storageBucket: "high-practice-1pt51.firebasestorage.app",
  messagingSenderId: "878791808421",
  appId: "1:878791808421:web:c5574cac40e1c2ba4a844c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specific database ID from the config
const db = initializeFirestore(app, {}, "ai-studio-schoolmanagement-6bf5f133-ba9c-44f4-94fb-6a28c0168cab");

// Default initial database structure
const INITIAL_SCHOOL_DATA: SchoolData = {
  settings: {
    school_name_ar: "مدرسة المتميزين النموذجية الذكية",
    school_name_en: "Al-Motamayizeen Model Smart School",
    logo_path: "https://cdn-icons-png.flaticon.com/512/807/807478.png",
    alert_percent_1: 5,
    alert_percent_2: 10,
    alert_percent_3: 15
  },
  students: [],
  teachers: [],
  directors: [
    {
      id: "director-1",
      name: "المدير العام",
      email: "director@school.com",
      password: "director2026",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200"
    }
  ],
  classes: [],
  assignments: [],
  announcements: [],
  attendance: [],
  grades: [],
  classesList: [],
  subjectsList: []
};

// Document reference for main school data
const schoolDocRef = doc(db, "school_data", "main");

/**
 * Fetches the school data from Firestore.
 * If the document does not exist, it creates it with initial default values.
 */
export async function getSchoolData(): Promise<SchoolData> {
  try {
    const docSnap = await getDoc(schoolDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SchoolData;
      // Ensure all arrays are initialized to prevent undefined errors
      return {
        ...INITIAL_SCHOOL_DATA,
        ...data,
        students: data.students || [],
        teachers: data.teachers || [],
        directors: data.directors || [],
        classes: data.classes || [],
        assignments: data.assignments || [],
        announcements: data.announcements || [],
        attendance: data.attendance || [],
        grades: data.grades || [],
        classesList: data.classesList || [],
        subjectsList: data.subjectsList || [],
        settings: {
          ...INITIAL_SCHOOL_DATA.settings,
          ...(data.settings || {})
        }
      };
    } else {
      // Document does not exist, initialize it
      await setDoc(schoolDocRef, INITIAL_SCHOOL_DATA);
      return INITIAL_SCHOOL_DATA;
    }
  } catch (error) {
    console.error("Error fetching school data from Firestore:", error);
    throw error;
  }
}

/**
 * Saves the updated school data to Firestore.
 */
export async function saveSchoolData(newData: SchoolData): Promise<void> {
  try {
    await setDoc(schoolDocRef, newData);
  } catch (error) {
    console.error("Error saving school data to Firestore:", error);
    throw error;
  }
}

/**
 * Resets the school data to the default clean state.
 */
export async function resetSchoolData(): Promise<SchoolData> {
  try {
    await setDoc(schoolDocRef, INITIAL_SCHOOL_DATA);
    return INITIAL_SCHOOL_DATA;
  } catch (error) {
    console.error("Error resetting school data in Firestore:", error);
    throw error;
  }
}
