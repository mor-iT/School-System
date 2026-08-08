import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";
// تم تعديل الاستدعاء ليتناسب مع رفعك المسطح مباشرة على GitHub
import { SchoolData } from "./types";

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

// Initialize Firestore using the specific database ID from the config and force long-polling for high reliability on mobile networks
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-schoolmanagement-6bf5f133-ba9c-44f4-94fb-6a28c0168cab");

// Default initial database structure
const INITIAL_SCHOOL_DATA: SchoolData = {
  settings: {
    school_name_ar: "مدرسة الإمامين الجوادين (عليهما السلام) الدينية للبراعم والأولاد",
    school_name_en: "Al-Imamain Al-Jawadain School",
    logo_path: "https://i.ibb.co/jvMw1KJQ/photo-2026-05-22-17-42-26.jpg",
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

const LOCAL_STORAGE_KEY = "school_data_fallback_db";

// Helper to get local storage fallback
function getLocalFallback(): SchoolData {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local) as SchoolData;
      const combined = {
        ...INITIAL_SCHOOL_DATA,
        ...parsed,
        students: parsed.students || [],
        teachers: parsed.teachers || [],
        directors: parsed.directors || [],
        classes: parsed.classes || [],
        assignments: parsed.assignments || [],
        announcements: parsed.announcements || [],
        attendance: parsed.attendance || [],
        grades: parsed.grades || [],
        classesList: parsed.classesList || [],
        subjectsList: parsed.subjectsList || [],
        settings: {
          ...INITIAL_SCHOOL_DATA.settings,
          ...(parsed.settings || {})
        }
      };
      if (combined.settings.school_name_ar === "مدرسة المتميزين النموذجية الذكية" || !combined.settings.school_name_ar) {
        combined.settings.school_name_ar = INITIAL_SCHOOL_DATA.settings.school_name_ar;
        combined.settings.school_name_en = INITIAL_SCHOOL_DATA.settings.school_name_en;
        combined.settings.logo_path = INITIAL_SCHOOL_DATA.settings.logo_path;
        combined.settings.logoPath = INITIAL_SCHOOL_DATA.settings.logo_path;
      }
      return combined;
    }
  } catch (e) {
    console.error("Failed to parse local fallback data:", e);
  }
  return INITIAL_SCHOOL_DATA;
}

// Helper to save to local storage
function saveLocalFallback(data: SchoolData) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to local storage:", e);
  }
}

/**
 * Fetches the school data from Firestore.
 * If the connection fails, it silently falls back to local storage (or default mock data).
 */
export async function getSchoolData(): Promise<SchoolData & { _isFromCloud?: boolean }> {
  try {
    const docSnap = await getDoc(schoolDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as SchoolData;
      const combined = {
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

      if (combined.settings.school_name_ar === "مدرسة المتميزين النموذجية الذكية" || !combined.settings.school_name_ar) {
        combined.settings.school_name_ar = INITIAL_SCHOOL_DATA.settings.school_name_ar;
        combined.settings.school_name_en = INITIAL_SCHOOL_DATA.settings.school_name_en;
        combined.settings.logo_path = INITIAL_SCHOOL_DATA.settings.logo_path;
        combined.settings.logoPath = INITIAL_SCHOOL_DATA.settings.logo_path;
        // Save the updated configuration to Firestore
        setDoc(schoolDocRef, combined).catch(console.error);
      }

      // Save local backup for future offline uses
      saveLocalFallback(combined);
      return {
        ...combined,
        _isFromCloud: true
      };
    } else {
      // Document does not exist, initialize it in Firestore & LocalStorage
      try {
        await setDoc(schoolDocRef, INITIAL_SCHOOL_DATA);
        saveLocalFallback(INITIAL_SCHOOL_DATA);
        return {
          ...INITIAL_SCHOOL_DATA,
          _isFromCloud: true
        };
      } catch (e) {
        console.warn("Failed to write initial document to Firestore, will use local storage only:", e);
        saveLocalFallback(INITIAL_SCHOOL_DATA);
        return {
          ...INITIAL_SCHOOL_DATA,
          _isFromCloud: false
        };
      }
    }
  } catch (error) {
    console.warn("Firestore connectivity failed. Falling back to Local Storage data. Error details:", error);
    // Return local storage fallback, or initial data if empty
    const local = getLocalFallback();
    return {
      ...local,
      _isFromCloud: false
    };
  }
}

/**
 * Saves the updated school data to Firestore.
 * If Firestore fails, saves it locally to guarantee the app remains functional.
 */
export async function saveSchoolData(newData: SchoolData): Promise<{ success: boolean; error?: string }> {
  // Always save locally first to guarantee persistence in fallback mode
  saveLocalFallback(newData);
  try {
    // Strip out any metadata properties before writing to firestore (e.g. _isFromCloud)
    const cleanedData = JSON.parse(JSON.stringify(newData));
    if (cleanedData._isFromCloud !== undefined) {
      delete cleanedData._isFromCloud;
    }
    await setDoc(schoolDocRef, cleanedData);
    return { success: true };
  } catch (error: any) {
    console.warn("Firestore update failed. Data saved locally to browser. Error details:", error);
    return { success: false, error: error?.message || String(error) };
  }
}
