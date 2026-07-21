/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  LayoutDashboard, Star, ClipboardList, Gamepad2, Rocket, Play, 
  CheckCircle, Circle, Award, BookOpen, Clock, MapPin, 
  CheckCircle2, LogOut, Menu, X, Printer, Calendar, Search, Filter, ShieldCheck
} from "lucide-react";
import { Student, ClassSession, Assignment, Announcement, AttendanceRecord, GradeRecord, SchoolSettings, ClassEntity, SubjectEntity } from "../types";

interface StudentDashboardProps {
  student: Student;
  classes: ClassSession[];
  assignments: Assignment[];
  announcements: Announcement[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  settings: SchoolSettings;
  classesList: ClassEntity[];
  subjectsList: SubjectEntity[];
  onToggleTask: (id: string) => void;
  onOpenGames: () => void;
  onLogout?: () => void;
}

export default function StudentDashboard({
  student,
  classes,
  assignments,
  announcements,
  attendance,
  grades,
  settings,
  classesList,
  subjectsList,
  onToggleTask,
  onOpenGames,
  onLogout
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "grades" | "tasks" | "attendance">("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Filters for attendance log
  const [filterDate, setFilterDate] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Calculate stats based on assignments
  const studentSubjectIds = subjectsList && subjectsList.length > 0
    ? subjectsList.filter(s => s.classId === student.gradeLevel).map(s => s.id)
    : [];

  const filteredAssignments = studentSubjectIds.length > 0
    ? assignments.filter(a => studentSubjectIds.includes(a.subjectId))
    : assignments;

  const totalTasks = filteredAssignments.length;
  const completedTasks = filteredAssignments.filter(a => a.isCompleted).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter announcements for this student (global or specifically for their class)
  const filteredAnnouncements = announcements.filter(ann => !ann.classId || ann.classId === student.gradeLevel);

  // Active or upcoming classes
  const activeClass = classes.find(c => c.isActive);

  // Helper to resolve badge colors
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "red": return "bg-red-500";
      case "yellow": return "bg-amber-500";
      case "blue": return "bg-blue-500";
      default: return "bg-slate-400";
    }
  };

  const studentClassName = classesList && classesList.find(c => c.id === student.gradeLevel)?.name || student.gradeLevel;

  // 1. Calculate Bologna Warnings per subject for this student
  // We filter student attendance records
  const studentAtt = attendance.filter(a => a.studentId === student.id);
  
  // Unique subjects that belong to this student's class or fallback
  const uniqueSubjects = subjectsList && subjectsList.length > 0
    ? subjectsList.filter(s => s.classId === student.gradeLevel).map(s => ({ id: s.id, name: s.name }))
    : classes.map(c => ({ id: c.subjectId, name: c.subject }));
  
  const bolognaAlerts = uniqueSubjects.map(sub => {
    const records = studentAtt.filter(a => a.subjectId === sub.id);
    const totalRecords = records.length;
    const absentRecords = records.filter(a => a.status === "absent").length;
    const absentPercentage = totalRecords > 0 ? Math.round((absentRecords / totalRecords) * 100) : 0;

    let alertType: "none" | "yellow" | "orange" | "red" = "none";
    if (absentPercentage >= settings.alert_percent_3) {
      alertType = "red";
    } else if (absentPercentage >= settings.alert_percent_2) {
      alertType = "orange";
    } else if (absentPercentage >= settings.alert_percent_1) {
      alertType = "yellow";
    }

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      totalRecords,
      absentRecords,
      absentPercentage,
      alertType
    };
  }).filter(alert => alert.alertType !== "none");

  // 2. Fetch Grades for Student and calculate transcript numbers
  const getGradeSum = (subjId: string, type: "daily" | "monthly" | "final") => {
    const matched = grades.filter(g => g.studentId === student.id && g.subjectId === subjId && g.examType === type);
    return matched.reduce((acc, curr) => acc + curr.score, 0);
  };

  const getSubjectTranscript = (subjId: string, subjName: string) => {
    const directCourseWork = grades.find(g => g.studentId === student.id && g.subjectId === subjId && g.examType === "course_work");
    const dailyRecords = grades.filter(g => g.studentId === student.id && g.subjectId === subjId && g.examType === "daily");
    const monthlyRecords = grades.filter(g => g.studentId === student.id && g.subjectId === subjId && g.examType === "monthly");
    
    let strive = 0;
    let hasStrive = false;
    let dailyVal: string | number = "-";
    let monthlyVal: string | number = "-";

    if (directCourseWork !== undefined) {
      strive = directCourseWork.score;
      hasStrive = true;
      dailyVal = "سعي مباشر";
      monthlyVal = "سعي مباشر";
    } else if (dailyRecords.length > 0 || monthlyRecords.length > 0) {
      const dailySum = dailyRecords.reduce((acc, curr) => acc + curr.score, 0);
      const monthlySum = monthlyRecords.reduce((acc, curr) => acc + curr.score, 0);
      strive = dailySum + monthlySum;
      hasStrive = true;
      dailyVal = dailySum;
      monthlyVal = monthlySum;
    }

    // Check if final score is recorded
    const finalRecord = grades.find(g => g.studentId === student.id && g.subjectId === subjId && g.examType === "final");
    const finalScore = finalRecord ? finalRecord.score : undefined;
    const hasFinal = finalScore !== undefined;

    // Cumulative average = 50% strive + 50% final exam, or final exam directly if no strive is entered
    let average: number | undefined = undefined;
    if (hasFinal) {
      if (hasStrive) {
        average = Math.round((strive * 0.5) + (finalScore! * 0.5));
      } else {
        average = finalScore;
      }
    }

    let resultStatus = "قيد التقييم";
    if (hasFinal) {
      resultStatus = average! >= 50 ? "ناجح 🎉" : "راسب ❌";
    }

    return {
      subjectId: subjId,
      subjectName: subjName,
      daily: dailyVal,
      monthly: monthlyVal,
      strive: hasStrive ? strive : "-",
      finalScore,
      average,
      hasFinal,
      resultStatus
    };
  };

  const subjectsTranscripts = uniqueSubjects.map(sub => getSubjectTranscript(sub.id, sub.name));

  // Filter attendance logs
  const filteredAttendance = studentAtt.filter(record => {
    const matchesDate = filterDate ? record.date === filterDate : true;
    const matchesSubject = filterSubject ? record.subjectId === filterSubject : true;
    return matchesDate && matchesSubject;
  });

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative" id="student-portal-root">
      
      {/* Printable Certificate Overlaid Panel */}
      {showCertificate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full border border-slate-200 shadow-2xl relative print:border-0 print:shadow-none">
            {/* Close Button */}
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print trigger button */}
            <button
              onClick={printCertificate}
              className="absolute top-4 left-16 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الشهادة الآن</span>
            </button>

            {/* Transcript Certificate Design (Fully RTL Arabized & Print Optimized) */}
            <div className="border-[3px] border-slate-900 p-8 rounded-2xl outline outline-1 outline-slate-900 outline-offset-4 text-slate-950 text-right print:p-2 print:border-2">
              <div className="flex justify-between items-center border-b border-slate-300 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{settings.school_name_ar}</h2>
                  <p className="text-xs text-slate-500 font-mono" dir="ltr">{settings.school_name_en}</p>
                </div>
                <img src={settings.logo_path} className="h-16 w-16 object-contain" alt="School Logo" />
              </div>

              <h1 className="text-2xl font-black text-center mb-8 tracking-tight text-slate-900">
                📜 الشهادة الأكاديمية وكشف الدرجات النهائي
              </h1>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">اسم الطالب المعتمد:</span>
                  <strong className="text-slate-800 text-base">{student.name} ({student.nickname || "-"})</strong>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 block mb-1">الصف الدراسي:</span>
                  <strong className="text-blue-700 text-base">{studentClassName}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-3 text-right">المقرر الدراسي</th>
                      <th className="p-3">أعمال اليومي (50)</th>
                      <th className="p-3">التقييم الشهري (50)</th>
                      <th className="p-3">معدل السعي (100)</th>
                      <th className="p-3">الامتحان النهائي (100)</th>
                      <th className="p-3">المعدل التراكمي (%)</th>
                      <th className="p-3">النتيجة النهائية</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-900">
                    {subjectsTranscripts.map((sub, idx) => (
                      <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/50">
                        <td className="p-3 text-right text-slate-800">{sub.subjectName}</td>
                        <td className="p-3">{sub.daily}</td>
                        <td className="p-3">{sub.monthly}</td>
                        <td className="p-3 bg-slate-50 text-blue-700">{sub.strive}</td>
                        <td className="p-3">{sub.hasFinal ? sub.finalScore : "-"}</td>
                        <td className="p-3 bg-slate-50 text-indigo-700 font-black text-sm">{sub.hasFinal ? `${sub.average}%` : "-"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            !sub.hasFinal ? "bg-slate-100 text-slate-500" :
                            sub.average! >= 50 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {sub.resultStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200 text-slate-400 text-xs font-bold">
                <div>توقيع مقرر اللجنة الإمتحانية: ...........................</div>
                <div>ختم وتوقيع إدارة المدرسة: ...........................</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header (RTL-oriented) */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden">
            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{student.name}</h2>
            <p className="text-[10px] text-slate-400">{studentClassName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Side Navigation - Responsive */}
      <aside className={`
        fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-100 flex flex-col justify-between p-6 z-40 transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        <div>
          {/* Logo Brand */}
          <div className="mb-10 text-right pr-2">
            <h1 className="text-xl font-black text-blue-800 tracking-tight" id="sidebar-logo">{settings.school_name_ar.split(" ")[0]}</h1>
            <p className="text-xs text-slate-400 mt-1">البوابة الطلابية الموحدة</p>
          </div>

          {/* Nav Items */}
          <nav className="space-y-2">
            <button
              onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 ${
                activeTab === "dashboard" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التحكم الرئيسية</span>
            </button>

            <button
              onClick={() => { setActiveTab("grades"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 ${
                activeTab === "grades" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>الدرجات ومسار السعي</span>
            </button>

            <button
              onClick={() => { setActiveTab("attendance"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 ${
                activeTab === "attendance" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>سجل الحضور والغياب</span>
            </button>

            <button
              onClick={() => { setActiveTab("tasks"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition duration-200 ${
                activeTab === "tasks" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>المهام والواجبات</span>
            </button>

            <button
              onClick={() => { onOpenGames(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition duration-200"
            >
              <Gamepad2 className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">بوابة الألعاب التعليمية</span>
            </button>
          </nav>
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-white flex-shrink-0">
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="text-right overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate" id="student-name">{student.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{studentClassName}</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج الموحد</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Top Welcome Banner */}
            <div className="bg-blue-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="z-10 max-w-xl text-right">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-2" id="welcome-banner-title">
                  مرحباً بك، {student.name}! 👋
                </h2>
                <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                  لديك اليوم {classes.length} حصص دراسية مجدولة، بالإضافة إلى {assignments.filter(a => !a.isCompleted).length} واجبات بحاجة للتسليم المباشر. بالتوفيق لك دائماً!
                </p>
              </div>
              <button 
                onClick={() => setActiveTab("tasks")}
                className="z-10 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 shrink-0 text-sm animate-pulse"
              >
                <Rocket className="w-4 h-4 fill-white" />
                تصفح الواجبات الحالية
              </button>
              
              <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl transform -translate-x-12 -translate-y-12"></div>
              <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-blue-700/30 rounded-full blur-3xl"></div>
            </div>

            {/* Bologna Warnings Alert Banner System (Copied dynamically from PHP logic) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>مؤشرات الالتزام ونسب الغياب (مسار نظام بولونيا)</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold">تحديث لحظي</span>
              </div>

              {bolognaAlerts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {bolognaAlerts.map((alert, idx) => {
                    if (alert.alertType === "red") {
                      return (
                        <div key={idx} className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                          <div>
                            <h4 className="text-xs font-black mb-1">⚠️ تحذير تجاوز الحد الأقصى للغياب والحرمان - {alert.subjectName}</h4>
                            <p className="text-[11px] text-red-700 leading-relaxed">وصلت نسبة غيابك إلى مستوى الحرمان النهائي ({alert.absentPercentage}%). يرجى تقديم تبرير رسمي لإدارة المدرسة لتفادي الحظر الأكاديمي.</p>
                          </div>
                          <span className="bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shrink-0">نسبة الغياب: {alert.absentPercentage}%</span>
                        </div>
                      );
                    } else if (alert.alertType === "orange") {
                      return (
                        <div key={idx} className="bg-orange-50 border border-orange-200 text-orange-900 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                          <div>
                            <h4 className="text-xs font-black mb-1">⚠️ الإنذار الثاني للغياب - {alert.subjectName}</h4>
                            <p className="text-[11px] text-orange-700 leading-relaxed">تجاوزت نسبة غيابك الإنذار الثاني المسموح به برمجياً. نوصيك بضرورة حضور المحاضرة القادمة تفادياً للوصول للحد الأقصى.</p>
                          </div>
                          <span className="bg-orange-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shrink-0">نسبة الغياب: {alert.absentPercentage}%</span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
                          <div>
                            <h4 className="text-xs font-black mb-1">⚠️ الإنذار الأول للغياب - {alert.subjectName}</h4>
                            <p className="text-[11px] text-amber-800 leading-relaxed">وصلت نسبة غيابك إلى مستوى الإنذار الأول المجدول ({alert.absentPercentage}%). يرجى الانتباه والالتزام بالحضور الدائم.</p>
                          </div>
                          <span className="bg-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shrink-0">نسبة الغياب: {alert.absentPercentage}%</span>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold py-4 px-6 rounded-2xl text-center">
                  🟢 موقفك الأكاديمي والقانوني سليم تماماً! لم تتجاوز أي من نسب الغياب التحذيرية في كافة المقررات.
                </div>
              )}
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Game Portal Interactive Card */}
              <div className="lg:col-span-7 bg-slate-900 rounded-3xl overflow-hidden relative shadow-md group border border-slate-800 flex flex-col justify-between h-72">
                <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                <div className="z-10 p-6 md:p-8 text-right">
                  <span className="bg-orange-500/90 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                    مسار الألعاب والمنطق الذكي
                  </span>
                  <h3 className="text-3xl font-black text-white mt-1 mb-2 tracking-tight">بوابة الألعاب التعليمية</h3>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                    اختبر معلوماتك الدراسية بطريقة ممتعة، راكم النقاط وتصدر قائمة الشرف في الترتيب الأسبوعي لتكريم المتميزين!
                  </p>
                </div>

                <div className="z-10 p-6 md:p-8 pt-0">
                  <button 
                    onClick={onOpenGames}
                    className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl transition duration-300 transform group-hover:scale-105 flex items-center gap-2 text-xs shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    دخول البوابة وتحدي زملاء الصف
                  </button>
                </div>
              </div>

              {/* Grades Summary Card */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-slate-800">معدلات ونسب النجاح بالسعي</h3>
                    <button 
                      onClick={() => setActiveTab("grades")} 
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      عرض التفاصيل الكلية
                    </button>
                  </div>

                  {/* Dynamic transcript-based overview */}
                  <div className="space-y-4">
                    {subjectsTranscripts.map((sub, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                          <span className="text-slate-700">{sub.subjectName}</span>
                          <span className="text-blue-600">{sub.strive} / 100</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${sub.strive}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 text-center">
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    تحضير وطباعة الشهادة الرسمية للدرجات
                  </button>
                </div>
              </div>

            </div>

            {/* School Schedule Section */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="mb-6 text-right">
                <h3 className="text-base font-bold text-slate-800">الجدول الدراسي الأسبوعي</h3>
                <p className="text-xs text-slate-400 mt-0.5">الحصص المقررة واليوم الدراسي الحالي للطلاب</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  if (cls.isActive) {
                    return (
                      <div 
                        key={cls.id}
                        className="bg-blue-600 text-white rounded-2xl p-5 shadow-md flex items-center justify-between border-2 border-blue-500 relative overflow-hidden text-right"
                      >
                        <div className="z-10">
                          <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block">
                            جارية الآن ⚡
                          </span>
                          <h4 className="text-base font-bold">{cls.subject}</h4>
                          <p className="text-xs text-blue-100 mt-1">المعلم: {cls.teacherName}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-blue-50">
                            <span className="bg-blue-700/60 px-2 py-1 rounded flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {cls.room}
                            </span>
                            <span className="bg-blue-700/60 px-2 py-1 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {cls.durationMinutes} دقيقة
                            </span>
                          </div>
                        </div>
                        <div className="z-10 text-left font-mono">
                          <span className="text-lg font-extrabold block">{cls.startTime}</span>
                        </div>
                        <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-blue-500/20 rounded-full"></div>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={cls.id}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center justify-between hover:bg-slate-100/50 transition duration-150 text-right"
                      >
                        <div>
                          <h4 className="text-sm font-bold text-slate-700">{cls.subject}</h4>
                          <p className="text-xs text-slate-400 mt-1">المعلم: {cls.teacherName}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                            <span className="bg-slate-200/60 px-2 py-1 rounded flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> {cls.room}
                            </span>
                            <span className="bg-slate-200/60 px-2 py-1 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> {cls.durationMinutes} دقيقة
                            </span>
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <span className="text-base font-bold text-slate-500 block">{cls.startTime}</span>
                          <span className="text-[9px] text-slate-400">مقررة</span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Bottom Panel containing: Assignments (Checklist), Curriculum Progress, Honor Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Checklist of Assignments */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">المهام والواجبات المطلوبة</h3>
                  <p className="text-xs text-slate-400 mb-4">اضغط على المربع لتأكيد تسليم الواجب بنجاح</p>
                  
                  <div className="space-y-3">
                    {filteredAssignments.slice(0, 3).map((task) => (
                      <div 
                        key={task.id}
                        onClick={() => onToggleTask(task.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer hover:bg-slate-50 ${
                          task.isCompleted ? "border-slate-100 bg-slate-50/50 opacity-75" : "border-slate-100 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-slate-400 hover:text-blue-600 transition shrink-0">
                            {task.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300" />
                            )}
                          </button>
                          <div className="text-right">
                            <h4 className={`text-xs font-bold ${task.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}>
                              {task.title}
                            </h4>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">{task.subject}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-6 rounded-full ${getBadgeColor(task.colorType)}`}></span>
                          <span className="text-[9px] font-bold text-slate-400 leading-none whitespace-nowrap">{task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                    {filteredAssignments.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">لا توجد واجبات حالياً. 🎉</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => setActiveTab("tasks")} 
                    className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    عرض جميع المهام ({filteredAssignments.length})
                  </button>
                </div>
              </div>

              {/* Card 2: Curriculum Completion SVG Circular Progress */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-base font-bold text-slate-800 mb-1">اكتمال المنهج الأسبوعي</h3>
                <p className="text-xs text-slate-400 mb-6">معدل تتبع الواجبات المنجزة</p>

                {/* SVG Progress Circle */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke="#f1f5f9" 
                      strokeWidth="10" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="54" 
                      stroke="#10b981" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray={339.29}
                      strokeDashoffset={339.29 - (339.29 * completionPercentage) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800" id="curriculum-percent">
                      {completionPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">مكتمل</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
                  أنت تسير بخطى ممتازة! لقد أتممت وتسلمت <span className="text-emerald-600 font-bold">{completedTasks} من أصل {totalTasks}</span> واجب دراسي.
                </p>
              </div>

              {/* Card 3: Honor Board Rank Current Status */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <h3 className="text-base font-bold text-slate-800 mb-1">الترتيب ولوحة الشرف</h3>
                <p className="text-xs text-slate-400 mb-6">ترتيبك التنافسي العام في المدرسة</p>

                <div className="bg-amber-50 p-4 rounded-full mb-4 animate-pulse">
                  <Award className="w-12 h-12 text-amber-500" />
                </div>

                <h4 className="text-lg font-black text-slate-800" id="current-rank-label">
                  المركز {student.currentRank}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                  أنت في <span className="font-bold text-slate-700">المركز {student.currentRank}</span> في لوحة شرف المتميزين. اجمع نقاطاً إضافية في التحديات لتتصدر!
                </p>

                <button 
                  onClick={onOpenGames}
                  className="mt-5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  العب لزيادة نقاطك
                </button>
              </div>

            </div>

            {/* Announcements notification Board */}
            {filteredAnnouncements.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-800">إعلانات وتنبيهات الإدارة</h3>
                  <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-full">تنبيهات هامة 🔔</span>
                </div>
                <div className="space-y-3">
                  {filteredAnnouncements.slice(0, 2).map((ann) => (
                    <div key={ann.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                        <span className="text-[9px] text-slate-400">{ann.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{ann.content}</p>
                      <span className="text-[9px] font-bold text-blue-600 mt-2 block">المرسل: {ann.sender}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Detailed Grades Transcript view */}
        {activeTab === "grades" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right">
              <div>
                <h2 className="text-lg font-bold text-slate-800">كشف الدرجات الأكاديمية وكشوف السعي</h2>
                <p className="text-xs text-slate-400 mt-1">كشف تفصيلي معتمد ومحدث من اللجنة الامتحانية بالكامل</p>
              </div>
              <button
                onClick={() => setShowCertificate(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة كشف الدرجات للشهادة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjectsTranscripts.map((sub, idx) => (
                <div key={idx} className="border border-slate-100 rounded-2xl p-5 bg-blue-50/20 text-right relative flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl">📘</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">سعي: {sub.strive} / 100</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2">{sub.subjectName}</h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-white/60 p-3 rounded-xl border border-slate-100">
                      <div>أعمال اليومي: <strong className="text-slate-800">{sub.daily}</strong></div>
                      <div>الامتحان الشهري: <strong className="text-slate-800">{sub.monthly}</strong></div>
                      <div className="col-span-2 pt-1 border-t border-slate-100 mt-1 flex justify-between">
                        <span>الامتحان النهائي:</span>
                        <strong className="text-indigo-600">{sub.hasFinal ? sub.finalScore : "معلق"}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                      <span className="text-[10px] font-bold text-slate-500">المعدل التراكمي:</span>
                      <strong className="text-slate-800 text-sm">{sub.hasFinal ? `${sub.average}%` : "تحت التقييم"}</strong>
                    </div>
                    <div className="mt-2 text-left">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        !sub.hasFinal ? "bg-slate-100 text-slate-500" :
                        sub.average! >= 50 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {sub.resultStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Homework assignments list view */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 text-right">
              <h2 className="text-lg font-bold text-slate-800">قائمة الواجبات والمهام التعليمية</h2>
              <p className="text-xs text-slate-400 mt-1">اضغط على المربع لتأكيد إتمام وتسليم واجبك المدرسي في الحال</p>
            </div>

            <div className="space-y-3">
              {filteredAssignments.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer hover:bg-slate-50 ${
                    task.isCompleted ? "border-slate-100 bg-slate-50/50 opacity-75" : "border-slate-100 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-blue-600 transition shrink-0">
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300" />
                      )}
                    </button>
                    <div className="text-right">
                      <h4 className={`text-sm font-bold ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">المادة: {task.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{task.dueDate}</span>
                    <span className={`w-2 h-8 rounded-full ${getBadgeColor(task.colorType)}`}></span>
                  </div>
                </div>
              ))}
              {filteredAssignments.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-10">رائع! لا توجد مهام حالياً. 🎉</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Attendance Log Tab (Copied from PHP student_dashboard) */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 text-right">
              <h2 className="text-lg font-bold text-slate-800">سجل تتبع الحضور وغلق الغيابات المفلتر</h2>
              <p className="text-xs text-slate-400 mt-1">تصفح سجل حضورك الكامل بالتفصيل واستخدم الفلترة للبحث السريع</p>
            </div>

            {/* Filtering Box (From PHP design) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">تصفية بالتاريخ واليوم:</label>
                <div className="relative">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">تصفية بالمادة المقررة:</label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                >
                  <option value="">-- كل المواد الدراسية --</option>
                  {uniqueSubjects.map((sub, idx) => (
                    <option key={idx} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => { setFilterDate(""); setFilterSubject(""); }}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition"
                >
                  إعادة تعيين الفلتر
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                    <th className="p-3 text-right">التاريخ واليوم</th>
                    <th className="p-3">المادة الدراسية</th>
                    <th className="p-3">الأستاذ الموجه</th>
                    <th className="p-3">الموقف وحالة الحضور</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-800">
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record, idx) => (
                      <tr key={idx} className="border-b border-slate-150 hover:bg-slate-50/50">
                        <td className="p-3 text-right">{record.date}</td>
                        <td className="p-3 text-blue-700">{uniqueSubjects.find(s => s.id === record.subjectId)?.name || record.subjectId}</td>
                        <td className="p-3 text-slate-500">{record.teacherName || "المنصة"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] ${
                            record.status === "present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            record.status === "late" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            "bg-red-50 text-red-700 border border-red-100"
                          }`}>
                            {record.status === "present" ? "✅ حاضر" : record.status === "late" ? "⚠️ متأخر" : "❌ غائب"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-normal">
                        لا توجد سجلات حضور مطابقة للتصفية الحالية.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
