/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { SchoolData, Student, Teacher, Director, ClassSession, Assignment, Announcement, AttendanceRecord, GradeRecord, SchoolSettings } from "./types";
import LoginPortal from "./components/LoginPortal";
import StudentDashboard from "./components/StudentDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import DirectorDashboard from "./components/DirectorDashboard";
import GamesPortal from "./components/GamesPortal";

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
      const response = await fetch("/api/data");
      if (!response.ok) {
        throw new Error("Failed to load school database");
      }
      const json = await response.json();
      setData(json);
      
      // Keep local session user in sync with latest DB modifications if logged in
      if (currentUser && userRole) {
        if (userRole === "student") {
          const fresh = json.students.find((s: Student) => s.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        } else if (userRole === "teacher") {
          const fresh = json.teachers.find((t: Teacher) => t.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        } else if (userRole === "director") {
          const fresh = json.directors.find((d: Director) => d.id === currentUser.id);
          if (fresh) {
            setCurrentUser(fresh);
            localStorage.setItem("school_user", JSON.stringify(fresh));
          }
        }
      }

      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات من خادم المدرسة الموحد.");
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

  // Full Stack API Calls & Mutation Refreshes

  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}/toggle`, { method: "POST" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم تحديث حالة تسليم الواجب بنجاح");
      }
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleSaveGrade = async (grade: { studentId: string; subjectId: string; examType: "daily" | "monthly" | "final" | "course_work"; score: number }) => {
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grade),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم رصد وحفظ درجة الطالب الأكاديمية بنجاح");
      }
    } catch (err) {
      console.error("Error saving grade:", err);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم حذف الدرجة بنجاح");
      }
    } catch (err) {
      console.error("Error deleting grade:", err);
    }
  };

  const handleSaveAttendance = async (att: { studentId: string; subjectId: string; date: string; status: "present" | "late" | "absent"; teacherName: string }) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(att),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم تسجيل وحفظ الغياب بنجاح");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
    }
  };

  const handleAddStudent = async (student: any) => {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تمت إضافة حساب الطالب بنجاح");
      }
    } catch (err) {
      console.error("Error adding student:", err);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم حذف حساب الطالب بنجاح");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };

  const handleAddTeacher = async (teacher: any) => {
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacher),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تمت إضافة حساب الأستاذ بنجاح");
      }
    } catch (err) {
      console.error("Error adding teacher:", err);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم حذف حساب الأستاذ بنجاح");
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const handleEditStudent = async (id: string, student: any) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم تحديث بيانات الطالب بنجاح");
      }
    } catch (err) {
      console.error("Error editing student:", err);
    }
  };

  const handleAddClass = async (classObj: any) => {
    try {
      const res = await fetch("/api/classes-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classObj),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تمت إضافة الصف الدراسي بنجاح");
      }
    } catch (err) {
      console.error("Error adding class:", err);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/classes-list/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم حذف الصف الدراسي بنجاح");
      }
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  const handleAddSubject = async (subjectObj: any) => {
    try {
      const res = await fetch("/api/subjects-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subjectObj),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تمت إضافة المادة الدراسية بنجاح");
      }
    } catch (err) {
      console.error("Error adding subject:", err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/subjects-list/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم حذف المادة الدراسية بنجاح");
      }
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  const handleAddAssignment = async (assignment: any) => {
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم نشر وإعلان الواجب الدراسي بنجاح");
      }
    } catch (err) {
      console.error("Error adding assignment:", err);
    }
  };

  const handleAddAnnouncement = async (announcement: any) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم تعميم الإعلان الإداري بنجاح");
      }
    } catch (err) {
      console.error("Error adding announcement:", err);
    }
  };

  const handleSaveSettings = async (settings: SchoolSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage("تم تحديث ثوابت وإعدادات المدرسة بنجاح");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handlePointsEarned = async (points: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/students/${currentUser.id}/game-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsEarned: points }),
      });
      if (res.ok) {
        await fetchSchoolData(true);
        triggerFlashMessage(`عمل رائع! كسبت ${points} نقطة إضافية في رصيدك`);
      }
    } catch (err) {
      console.error("Error adding game points:", err);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين البيانات وحذف كافة الإضافات التجريبية؟")) {
      try {
        const res = await fetch("/api/reset", { method: "POST" });
        if (res.ok) {
          const fresh = await res.json();
          setData(fresh.data);
          handleLogout();
          triggerFlashMessage("تمت إعادة تعيين قاعدة البيانات بنجاح!");
        }
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
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
              🏫
            </div>
            <div className="text-right">
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
          <LoginPortal onLoginSuccess={handleLoginSuccess} />
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
