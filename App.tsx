/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { SchoolData, Student, Teacher, Director, ClassSession, Assignment, Announcement, AttendanceRecord, GradeRecord, SchoolSettings } from "./types";
import LoginPortal from "./LoginPortal";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import DirectorDashboard from "./DirectorDashboard";
import GamesPortal from "./GamesPortal";
import { getSchoolData, saveSchoolData, resetSchoolData } from "./firebase";

// Recalculate ranks based on gamePoints
function recalculateRanks(students: Student[]): Student[] {
  const sorted = [...students].sort((a, b) => b.gamePoints - a.gamePoints);
  return students.map(student => {
    const idx = sorted.findIndex(s => s.id === student.id);
    return {
      ...student,
      currentRank: idx + 1
    };
  });
}

export default function App() {
  // Session authentication state (stored in memory/localStorage for robustness)
  const [userRole, setUserRole] = useState<"student" | "teacher" | "director" | null>(() => {
    const saved = localStorage.getItem("school_role");
    return saved ? (saved as any) : null;
  });
  
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem("school_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [data, setData] = useState<SchoolData | null>(null);
  const [viewingGames, setViewingGames] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  // Load school data on mount
  useEffect(() => {
    fetchSchoolData();
  }, []);

  const fetchSchoolData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const freshData = await getSchoolData();
      setData(freshData);
      
      // Keep local session user in sync with latest DB modifications if logged in
      if (currentUser && userRole) {
        if (userRole === "student") {
          const fresh = freshData.students.find((s: Student) => s.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        } else if (userRole === "teacher") {
          const fresh = freshData.teachers.find((t: Teacher) => t.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        } else if (userRole === "director") {
          const fresh = freshData.directors.find((d: Director) => d.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        }
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات من قاعدة بيانات Firebase السحابية.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const triggerFlashMessage = (msg: string) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(null), 3000);
  };

  const handleLoginSuccess = (role: "student" | "teacher" | "director", user: any, schoolData: SchoolData) => {
    setUserRole(role);
    setCurrentUser(user);
    setData(schoolData);
    
    localStorage.setItem("school_role", role);
    localStorage.setItem("school_user", JSON.stringify(user));
    
    triggerFlashMessage(`أهلاً بك! تم تسجيل الدخول بنجاح بصفتك: ${role === "student" ? "طالب" : role === "teacher" ? "أستاذ" : "مدير"}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setViewingGames(false);
    localStorage.removeItem("school_role");
    localStorage.removeItem("school_user");
  };

  // Full Stack API Calls using direct Firebase Firestore Updates

  const handleToggleTask = async (id: string) => {
    if (!data) return;
    try {
      const updatedAssignments = data.assignments.map(a => 
        a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
      );
      const updatedData = { ...data, assignments: updatedAssignments };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم تحديث حالة تسليم الواجب بنجاح");
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleSaveGrade = async (grade: { studentId: string; subjectId: string; examType: "daily" | "monthly" | "final" | "course_work"; score: number }) => {
    if (!data) return;
    try {
      const newGradeRecord: GradeRecord = {
        id: "g-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        ...grade
      };
      const updatedGrades = [...data.grades, newGradeRecord];
      const updatedData = { ...data, grades: updatedGrades };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم رصد وحفظ درجة الطالب الأكاديمية بنجاح");
    } catch (err) {
      console.error("Error saving grade:", err);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!data) return;
    try {
      const updatedGrades = data.grades.filter(g => g.id !== id);
      const updatedData = { ...data, grades: updatedGrades };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم حذف الدرجة بنجاح");
    } catch (err) {
      console.error("Error deleting grade:", err);
    }
  };

  const handleSaveAttendance = async (att: { studentId: string; subjectId: string; date: string; status: "present" | "late" | "absent"; teacherName: string }) => {
    if (!data) return;
    try {
      const newAttRecord: AttendanceRecord = {
        id: "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        ...att
      };
      const updatedAttendance = [...data.attendance, newAttRecord];
      
      // Recalculate attendance stats for this student
      const updatedStudents = data.students.map(s => {
        if (s.id === att.studentId) {
          const studentAtts = updatedAttendance.filter(a => a.studentId === s.id);
          const absentCount = studentAtts.filter(a => a.status === "absent").length;
          const totalRecords = studentAtts.length || 1;
          const presentCount = studentAtts.filter(a => a.status === "present" || a.status === "late").length;
          return {
            ...s,
            absentDaysCount: absentCount,
            attendancePercentage: Math.round((presentCount / totalRecords) * 100)
          };
        }
        return s;
      });

      const updatedData = { ...data, attendance: updatedAttendance, students: updatedStudents };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم تسجيل وحفظ الغياب بنجاح");
    } catch (err) {
      console.error("Error saving attendance:", err);
    }
  };

  const handleAddStudent = async (student: any) => {
    if (!data) return;
    try {
      const newStudent: Student = {
        id: "student-" + Date.now(),
        name: student.name,
        nickname: student.nickname || "",
        email: student.email,
        password: student.password || "123",
        gradeLevel: student.gradeLevel || "الصف العاشر",
        avatar: student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        gender: student.gender || "male",
        birthDate: student.birthDate || "2010-01-01",
        phoneNumber: student.phoneNumber || "",
        region: student.region || "",
        alley: student.alley || "",
        street: student.street || "",
        houseNumber: student.houseNumber || "",
        gamePoints: 0,
        gameLevel: 1,
        currentRank: data.students.length + 1
      };
      
      let updatedStudents = [...data.students, newStudent];
      updatedStudents = recalculateRanks(updatedStudents);

      const updatedData = { ...data, students: updatedStudents };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تمت إضافة حساب الطالب بنجاح");
    } catch (err) {
      console.error("Error adding student:", err);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!data) return;
    try {
      let updatedStudents = data.students.filter(s => s.id !== id);
      const updatedAttendance = data.attendance.filter(a => a.studentId !== id);
      const updatedGrades = data.grades.filter(g => g.studentId !== id);
      updatedStudents = recalculateRanks(updatedStudents);

      const updatedData = { 
        ...data, 
        students: updatedStudents, 
        attendance: updatedAttendance, 
        grades: updatedGrades 
      };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم حذف حساب الطالب بنجاح");
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleAddTeacher = async (teacher: any) => {
    if (!data) return;
    try {
      let finalSubjectsList = teacher.subjectsList || [];
      let finalSubjectString = teacher.subject || "";

      if (Array.isArray(teacher.subjectsList) && teacher.subjectsList.length > 0) {
        const subNames = teacher.subjectsList.map((sid: string) => {
          const found = data.subjectsList?.find(s => s.id === sid);
          if (found) {
            const cls = data.classesList?.find(c => c.id === found.classId);
            const clsSuffix = cls ? ` (${cls.name})` : "";
            return found.name + clsSuffix;
          }
          return sid;
        });
        finalSubjectString = subNames.join("، ");
      }

      const newTeacher: Teacher = {
        id: "teacher-" + Date.now(),
        name: teacher.name,
        email: teacher.email,
        password: teacher.password || "123",
        subject: finalSubjectString,
        avatar: teacher.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        assignedClasses: [],
        subjectsList: finalSubjectsList
      };

      const updatedTeachers = [...data.teachers, newTeacher];
      const updatedData = { ...data, teachers: updatedTeachers };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تمت إضافة حساب الأستاذ بنجاح");
    } catch (err) {
      console.error("Error adding teacher:", err);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!data) return;
    try {
      const updatedTeachers = data.teachers.filter(t => t.id !== id);
      const updatedData = { ...data, teachers: updatedTeachers };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم حذف حساب الأستاذ بنجاح");
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const handleEditStudent = async (id: string, student: any) => {
    if (!data) return;
    try {
      const updatedStudents = data.students.map(s => {
        if (s.id === id) {
          return {
            ...s,
            name: student.name || s.name,
            nickname: student.nickname !== undefined ? student.nickname : s.nickname,
            email: student.email || s.email,
            password: student.password || s.password,
            gender: student.gender || s.gender,
            birthDate: student.birthDate !== undefined ? student.birthDate : s.birthDate,
            phoneNumber: student.phoneNumber !== undefined ? student.phoneNumber : s.phoneNumber,
            region: student.region !== undefined ? student.region : s.region,
            alley: student.alley !== undefined ? student.alley : s.alley,
            street: student.street !== undefined ? student.street : s.street,
            houseNumber: student.houseNumber !== undefined ? student.houseNumber : s.houseNumber,
            gradeLevel: student.gradeLevel || s.gradeLevel,
            avatar: student.avatar || s.avatar
          };
        }
        return s;
      });

      const updatedData = { ...data, students: updatedStudents };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم تحديث بيانات الطالب بنجاح");
    } catch (err) {
      console.error("Error editing student:", err);
    }
  };

  const handleAddClass = async (classObj: any) => {
    if (!data) return;
    try {
      const newClass = {
        id: "class-entity-" + Date.now(),
        name: classObj.name,
        gender: classObj.gender
      };

      const classesList = data.classesList || [];
      const updatedClassesList = [...classesList, newClass];
      const updatedData = { ...data, classesList: updatedClassesList };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تمت إضافة الصف الدراسي بنجاح");
    } catch (err) {
      console.error("Error adding class:", err);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!data) return;
    try {
      const classesList = data.classesList || [];
      const subjectsList = data.subjectsList || [];
      const updatedClassesList = classesList.filter(c => c.id !== id);
      const updatedSubjectsList = subjectsList.filter(s => s.classId !== id);

      const updatedData = { 
        ...data, 
        classesList: updatedClassesList, 
        subjectsList: updatedSubjectsList 
      };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم حذف الصف الدراسي بنجاح");
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  const handleAddSubject = async (subjectObj: any) => {
    if (!data) return;
    try {
      const newSubject = {
        id: "subject-entity-" + Date.now(),
        name: subjectObj.name,
        classId: subjectObj.classId
      };

      const subjectsList = data.subjectsList || [];
      const updatedSubjectsList = [...subjectsList, newSubject];
      const updatedData = { ...data, subjectsList: updatedSubjectsList };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تمت إضافة المادة الدراسية بنجاح");
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!data) return;
    try {
      const subjectsList = data.subjectsList || [];
      const updatedSubjectsList = subjectsList.filter(s => s.id !== id);

      const updatedData = { ...data, subjectsList: updatedSubjectsList };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم حذف المادة الدراسية بنجاح");
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  const handleAddAssignment = async (assignment: any) => {
    if (!data) return;
    try {
      const newAssignment: Assignment = {
        id: "task-" + Date.now(),
        title: assignment.title,
        subject: assignment.subject,
        subjectId: assignment.subjectId || "math",
        dueDate: assignment.dueDate || "قريباً",
        isCompleted: false,
        colorType: assignment.colorType || "blue"
      };

      const updatedAssignments = [newAssignment, ...data.assignments];
      const updatedData = { ...data, assignments: updatedAssignments };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم نشر وإعلان الواجب الدراسي بنجاح");
    } catch (err) {
      console.error("Error adding assignment:", err);
    }
  };

  const handleAddAnnouncement = async (announcement: any) => {
    if (!data) return;
    try {
      const newAnnouncement: Announcement = {
        id: "ann-" + Date.now(),
        title: announcement.title,
        content: announcement.content,
        date: "الآن",
        sender: announcement.sender || "الإدارة",
        classId: announcement.classId,
        subjectId: announcement.subjectId
      };

      const updatedAnnouncements = [newAnnouncement, ...data.announcements];
      const updatedData = { ...data, announcements: updatedAnnouncements };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم تعميم الإعلان الإداري بنجاح");
    } catch (err) {
      console.error("Error adding announcement:", err);
    }
  };

  const handleSaveSettings = async (settings: SchoolSettings) => {
    if (!data) return;
    try {
      const updatedData = { ...data, settings };
      await saveSchoolData(updatedData);
      setData(updatedData);
      triggerFlashMessage("تم تحديث ثوابت وإعدادات المدرسة بنجاح");
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handlePointsEarned = async (points: number) => {
    if (!currentUser || !data) return;
    try {
      const updatedStudents = data.students.map(s => {
        if (s.id === currentUser.id) {
          const newPoints = s.gamePoints + points;
          return {
            ...s,
            gamePoints: newPoints,
            gameLevel: Math.max(1, Math.floor(newPoints / 120))
          };
        }
        return s;
      });

      const sortedStudents = recalculateRanks(updatedStudents);
      const updatedData = { ...data, students: sortedStudents };
      await saveSchoolData(updatedData);
      setData(updatedData);

      // Keep currentUser in sync
      const freshUser = sortedStudents.find(s => s.id === currentUser.id);
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem("school_user", JSON.stringify(freshUser));
      }

      triggerFlashMessage(`عمل رائع! كسبت ${points} نقطة إضافية في رصيدك`);
    } catch (err) {
      console.error("Error adding game points:", err);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين البيانات وحذف كافة الإضافات التجريبية؟")) {
      try {
        const freshData = await resetSchoolData();
        setData(freshData);
        handleLogout();
        triggerFlashMessage("تمت إعادة تعيين قاعدة البيانات بنجاح!");
      } catch (err) {
        console.error("Error resetting database:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-700">جاري تحميل المنصة والمزامنة...</h2>
        <p className="text-xs text-slate-400 mt-1">يرجى الانتظار ثوانٍ معدودة لبناء قنوات المزامنة المتكاملة</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h2 className="text-lg font-bold text-slate-800">حدث خطأ في الاتصال بالخادم</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{error || "لا يمكن استرداد البيانات حالياً."}</p>
        <button 
          onClick={() => fetchSchoolData()} 
          className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow transition"
        >
          إعادة الاتصال بالشبكة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="app-root">
      
      {/* Global persistent Simulation Controller Bar (RTL-oriented, high contrast slate gray) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm overflow-hidden shrink-0 border border-slate-700">
  <img 
    src={data.settings?.logoPath || data.settings?.school_logo} 
    alt="شعار المدرسة" 
    className="w-full h-full object-cover"
  />
</div>     <div className="text-right">
              <h1 className="text-xs font-black text-white">{data.settings.school_name_ar}</h1>
              <p className="text-[9px] text-slate-400 mt-0.5">البوابة الأكاديمية والتربوية الشاملة والموحدة</p>
            </div>
          </div>

          {/* User Profile Status & Logout Shortcut */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800 py-1 px-3 rounded-lg border border-slate-700">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-600">
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">
                  {currentUser.name} ({userRole === "student" ? "طالب" : userRole === "teacher" ? "أستاذ" : "مدير"})
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] text-red-400 hover:text-red-300 font-bold border-r border-slate-700 pr-2 mr-2"
                >
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">يرجى تسجيل الدخول للوصول لبوابتك</span>
            )}

            {isRefreshing && <span className="text-[9px] text-slate-500 animate-pulse font-semibold">تحديث...</span>}
            <button
              onClick={handleResetDatabase}
              className="text-[10px] text-slate-400 hover:text-red-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-1 transition"
              title="إعادة تعيين البيانات للمصنع"
            >
              <RotateCcw className="w-3 h-3" />
              إعادة تهيئة
            </button>
          </div>

        </div>
      </header>

      {/* Database sync success indicator toast */}
      {flashMsg && (
        <div className="bg-slate-900 border-b border-indigo-500 text-indigo-400 text-center font-bold text-xs py-2 animate-pulse print:hidden">
          {flashMsg}
        </div>
      )}

      {/* Interactive App Screen Render engine */}
      <div className="flex-grow">
        {userRole === null ? (
          /* Force authentication login page initially */
          <LoginPortal schoolData={data} onLoginSuccess={handleLoginSuccess} />
        ) : viewingGames ? (
          /* Games Portal is shown over the student dashboard */
          <GamesPortal 
            currentStudent={currentUser}
            onPointsEarned={handlePointsEarned}
            onBackToDashboard={() => setViewingGames(false)}
          />
        ) : (
          /* Standard dashboard based on logged-in user Role */
          <>
            {userRole === "student" && (
              <StudentDashboard 
                student={currentUser}
                classes={data.classes}
                assignments={data.assignments}
                announcements={data.announcements}
                attendance={data.attendance}
                grades={data.grades}
                settings={data.settings}
                classesList={data.classesList || []}
                subjectsList={data.subjectsList || []}
                onToggleTask={handleToggleTask}
                onOpenGames={() => setViewingGames(true)}
                onLogout={handleLogout}
              />
            )}

            {userRole === "teacher" && (
              <TeacherDashboard 
                teacher={currentUser}
                students={data.students}
                classes={data.classes}
                assignments={data.assignments}
                announcements={data.announcements}
                attendance={data.attendance}
                grades={data.grades}
                settings={data.settings}
                classesList={data.classesList || []}
                subjectsList={data.subjectsList || []}
                onAddAssignment={handleAddAssignment}
                onAddAnnouncement={handleAddAnnouncement}
                onSaveGrade={handleSaveGrade}
                onDeleteGrade={handleDeleteGrade}
                onSaveAttendance={handleSaveAttendance}
                onLogout={handleLogout}
              />
            )}

            {userRole === "director" && (
              <DirectorDashboard 
                director={currentUser}
                students={data.students}
                teachers={data.teachers}
                classes={data.classes}
                announcements={data.announcements}
                attendance={data.attendance}
                grades={data.grades}
                settings={data.settings}
                classesList={data.classesList || []}
                subjectsList={data.subjectsList || []}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onEditStudent={handleEditStudent}
                onAddTeacher={handleAddTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onAddClass={handleAddClass}
                onDeleteClass={handleDeleteClass}
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                onAddAnnouncement={handleAddAnnouncement}
                onSaveSettings={handleSaveSettings}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </div>

    </div>
  );
}
