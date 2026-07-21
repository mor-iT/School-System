/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolSettings {
  school_name_ar: string;
  school_name_en: string;
  logo_path: string;
  alert_percent_1: number; // Warning 1
  alert_percent_2: number; // Warning 2
  alert_percent_3: number; // Exclusion Warning
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string; // e.g., "math", "english", "science"
  date: string;      // YYYY-MM-DD
  status: "present" | "late" | "absent";
  teacherName?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string; // e.g., "math", "english", "science"
  examType: "daily" | "monthly" | "final" | "course_work";
  score: number;     // score out of 50 or 100
}

export interface Student {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  password?: string; // plain text for testing credentials
  gradeLevel: string;
  avatar: string;
  gender: "male" | "female";
  birthDate?: string;
  phoneNumber?: string;
  region?: string;
  alley?: string;
  street?: string;
  houseNumber?: string;
  gamePoints: number;
  gameLevel: number;
  currentRank: number;
  attendancePercentage?: number;
  absentDaysCount?: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  password?: string;
  subject: string;
  avatar: string;
  assignedClasses: string[]; // Class IDs
  subjectsList?: string[];   // Assigned subject IDs (supports multiple subjects)
}

export interface Director {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
}

export interface ClassSession {
  id: string;
  subject: string;
  subjectId: string; // e.g. "math", "english", "science"
  teacherName: string;
  room: string;
  startTime: string;
  durationMinutes: number;
  day: string; // e.g. "Tuesday"
  isActive: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectId: string; // links to subjectId
  dueDate: string;
  isCompleted: boolean;
  colorType: 'red' | 'yellow' | 'blue'; // for sidebar badge color
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  sender: string;
  classId?: string;
  subjectId?: string;
}

export interface ClassEntity {
  id: string;
  name: string;
  gender: "boys" | "girls";
}

export interface SubjectEntity {
  id: string;
  name: string;
  classId: string;
}

export interface SchoolData {
  students: Student[];
  teachers: Teacher[];
  directors: Director[];
  classes: ClassSession[];
  assignments: Assignment[];
  announcements: Announcement[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  settings: SchoolSettings;
  classesList?: ClassEntity[];
  subjectsList?: SubjectEntity[];
}
