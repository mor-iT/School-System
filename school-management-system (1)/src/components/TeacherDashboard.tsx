/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, BookOpen, Clock, Calendar, Star, AlertCircle, PlusCircle, Check, 
  Trash2, LogOut, LayoutDashboard, Send, ClipboardList, ShieldAlert, CheckCircle2, Menu, X
} from "lucide-react";
import { Teacher, Student, ClassSession, Assignment, Announcement, AttendanceRecord, GradeRecord, SchoolSettings, ClassEntity, SubjectEntity } from "../types";

interface TeacherDashboardProps {
  teacher: Teacher;
  students: Student[];
  classes: ClassSession[];
  assignments: Assignment[];
  announcements: Announcement[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  settings: SchoolSettings;
  classesList: ClassEntity[];
  subjectsList: SubjectEntity[];
  onAddAssignment: (assignment: any) => void;
  onAddAnnouncement: (announcement: any) => void;
  onSaveGrade: (grade: { studentId: string; subjectId: string; examType: "daily" | "monthly" | "final" | "course_work"; score: number }) => void;
  onDeleteGrade: (id: string) => void;
  onSaveAttendance: (att: { studentId: string; subjectId: string; date: string; status: "present" | "late" | "absent"; teacherName: string }) => void;
  onLogout?: () => void;
}

export default function TeacherDashboard({
  teacher,
  students,
  classes,
  assignments,
  announcements,
  attendance,
  grades,
  settings,
  classesList,
  subjectsList,
  onAddAssignment,
  onAddAnnouncement,
  onSaveGrade,
  onDeleteGrade,
  onSaveAttendance,
  onLogout
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<"attendance" | "grades" | "assignments" | "announcements">("attendance");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for attendance submission
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, "present" | "late" | "absent">>({});
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  // State for grade scoring
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [examType, setExamType] = useState<"daily" | "monthly" | "final" | "course_work">("daily");
  const [gradeScore, setGradeScore] = useState<number | "">("");
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null);

  // State for assignment creation
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignColor, setAssignColor] = useState<"red" | "yellow" | "blue">("blue");

  // State for announcement creation
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Filter subjects assigned to this teacher
  const finalTeacherSubjects = subjectsList.filter(sub => {
    if (teacher.subjectsList && teacher.subjectsList.length > 0) {
      return teacher.subjectsList.includes(sub.id);
    }
    // Fallback: match by teacher's primary subject text if subjectsList is empty
    return sub.name.toLowerCase().includes(teacher.subject.toLowerCase()) || 
           teacher.subject.toLowerCase().includes(sub.name.toLowerCase());
  }).length > 0 ? subjectsList.filter(sub => {
    if (teacher.subjectsList && teacher.subjectsList.length > 0) {
      return teacher.subjectsList.includes(sub.id);
    }
    return sub.name.toLowerCase().includes(teacher.subject.toLowerCase()) || 
           teacher.subject.toLowerCase().includes(sub.name.toLowerCase());
  }) : subjectsList;

  // Selected Subject ID State
  const [selectedSubjectId, setSelectedSubjectIdState] = useState<string>(() => {
    return finalTeacherSubjects[0]?.id || "math";
  });

  const activeSubject = subjectsList.find(s => s.id === selectedSubjectId);
  const activeClass = activeSubject ? classesList.find(c => c.id === activeSubject.classId) : null;

  // Filter students based on current active class
  const filteredStudents = students.filter(student => student.gradeLevel === activeClass?.id);

  const currentSubjectId = selectedSubjectId;

  // Filter classes taught by this teacher
  const teacherClasses = classes.filter(c => c.subjectId === currentSubjectId);

  // Handle saving attendance for a student
  const handleAttendanceChange = (studentId: string, status: "present" | "late" | "absent") => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAllAttendance = () => {
    filteredStudents.forEach(student => {
      const status = attendanceStatus[student.id] || "present"; // default to present
      onSaveAttendance({
        studentId: student.id,
        subjectId: currentSubjectId,
        date: attendanceDate,
        status,
        teacherName: teacher.name
      });
    });

    setAttendanceSuccess("تم حفظ كشف الغياب والحضور بالكامل بنجاح للفصل الدراسي!");
    setTimeout(() => setAttendanceSuccess(null), 4000);
  };

  // Handle grade submission
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || gradeScore === "") return;

    onSaveGrade({
      studentId: selectedStudentId,
      subjectId: currentSubjectId,
      examType,
      score: Number(gradeScore)
    });

    setGradeSuccess(`تم تسجيل ورصد درجة الامتحان (${
      examType === "daily" ? "يومي" : examType === "monthly" ? "شهري" : examType === "course_work" ? "مجموع السعي" : "نهائي"
    }) بنجاح!`);
    setGradeScore("");
    setTimeout(() => setGradeSuccess(null), 4000);
  };

  // Handle assignment creation
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle) return;

    onAddAssignment({
      title: assignTitle,
      subject: teacher.subject,
      subjectId: currentSubjectId,
      dueDate: assignDueDate || "قريباً",
      colorType: assignColor
    });

    setAssignTitle("");
    setAssignDueDate("");
  };

  // Handle announcement creation
  const handleAnnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    onAddAnnouncement({
      title: annTitle,
      content: annContent,
      sender: teacher.name,
      classId: activeClass?.id,
      subjectId: currentSubjectId
    });

    setAnnTitle("");
    setAnnContent("");
  };

  // Bologna Warning triggers count for reference
  const getAbsenceCount = (studentId: string) => {
    const studentAtts = attendance.filter(a => a.studentId === studentId && a.subjectId === currentSubjectId);
    return studentAtts.filter(a => a.status === "absent").length;
  };

  const getAbsencePercent = (studentId: string) => {
    const studentAtts = attendance.filter(a => a.studentId === studentId && a.subjectId === currentSubjectId);
    if (studentAtts.length === 0) return 0;
    return Math.round((studentAtts.filter(a => a.status === "absent").length / studentAtts.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-right" id="teacher-portal-root">
      
      {/* Mobile Top Header (RTL-oriented) */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center z-30 w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
            <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{teacher.name}</h2>
            <p className="text-[10px] text-slate-400">{teacher.subject}</p>
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

      {/* Sidebar for navigation */}
      <aside className={`
        fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-100 p-6 flex flex-col justify-between z-40 transition-transform duration-300 md:relative md:translate-x-0 shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-black text-indigo-800">{settings.school_name_ar.split(" ")[0]}</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">البوابة الموحدة للمعلم</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
              <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-slate-800">{teacher.name}</h2>
              <p className="text-[9px] text-blue-600 font-bold mt-0.5">{teacher.subject}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab("attendance"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "attendance" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>أخذ الحضور والغيابات (بولونيا)</span>
            </button>

            <button
              onClick={() => { setActiveTab("grades"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "grades" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>رصد الدرجات وكشوف الطلاب</span>
            </button>

            <button
              onClick={() => { setActiveTab("assignments"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "assignments" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>نشر الواجبات والمهام</span>
            </button>

            <button
              onClick={() => { setActiveTab("announcements"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "announcements" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>إرسال إعلانات الصف</span>
            </button>
          </nav>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full mt-8 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج الموحد</span>
          </button>
        )}
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
        
        {/* Top Header Panel */}
        <div className="bg-gradient-to-l from-indigo-900 to-indigo-850 rounded-3xl p-6 text-white mb-6 relative overflow-hidden shadow-sm">
          <div className="z-10 relative">
            <span className="bg-indigo-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2.5 inline-block">
              مسار التدريس واللجان الامتحانية
            </span>
            <h2 className="text-xl md:text-2xl font-black mb-1">لوحة التقييم ورصد الدرجات للمعلم</h2>
            <p className="text-[11px] text-indigo-100">
              أهلاً بك مجدداً {teacher.name}. يمكنك من هنا رصد الغيابات وفق ضوابط بولونيا الاستباقية، وتسجيل درجات السعي الكلية المعتمدة.
            </p>
          </div>
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-850/55 rounded-full blur-2xl transform -translate-x-10"></div>
        </div>

        {/* Class/Subject Selector Dropdown Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-right">
            <h3 className="text-xs font-black text-slate-700">📚 المادة والصف الدراسي النشط حالياً:</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">يمكنك تغيير المادة والصف من القائمة لتحديث الكشوفات والواجبات تلقائياً</p>
          </div>
          <div className="w-full sm:w-72">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectIdState(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-indigo-900"
            >
              {finalTeacherSubjects.map(sub => {
                const boundClass = classesList.find(c => c.id === sub.classId);
                return (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} - {boundClass ? `${boundClass.name} (${boundClass.gender === "boys" ? "بنين" : "بنات"})` : "عام"}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Tab 1: Attendance Roster */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">أخذ الحضور والغياب اليومي للفصل</h3>
                <p className="text-xs text-slate-400 mt-0.5">سجل الحضور وفق نظام بولونيا ليقوم النظام بتلقيم التنبيهات تلقائياً</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">تاريخ الحضور:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                />
              </div>
            </div>

            {attendanceSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{attendanceSuccess}</span>
              </div>
            )}

            {/* Attendance Student Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                    <th className="p-3 text-right">اسم الطالب</th>
                    <th className="p-3">الصف الدراسي</th>
                    <th className="p-3">مجموع الغيابات الحالية بالمادة</th>
                    <th className="p-3">الموقف / الإجراء</th>
                    <th className="p-3">تأكيد الموقف الدراسي</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-800">
                  {filteredStudents.map((student) => {
                    const absCount = getAbsenceCount(student.id);
                    const absPercent = getAbsencePercent(student.id);
                    const status = attendanceStatus[student.id] || "present";

                    return (
                      <tr key={student.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200">
                              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{student.name}</span>
                              <span className="text-[10px] text-slate-400 block">{student.nickname || "لا يوجد لقب"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          {classesList.find(c => c.id === student.gradeLevel)?.name || student.gradeLevel}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded ${
                            absPercent >= settings.alert_percent_3 ? "bg-red-100 text-red-800" :
                            absPercent >= settings.alert_percent_2 ? "bg-orange-100 text-orange-800" :
                            absPercent >= settings.alert_percent_1 ? "bg-amber-100 text-amber-800" :
                            "bg-emerald-100 text-emerald-800"
                          }`}>
                            {absCount} غيابات ({absPercent}%)
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px]">
                            {absPercent >= settings.alert_percent_3 ? "❌ حرمان أكاديمي" :
                             absPercent >= settings.alert_percent_2 ? "⚠️ إنذار ثان" :
                             absPercent >= settings.alert_percent_1 ? "⚠️ إنذار أول" :
                             "🟢 سليم"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAttendanceChange(student.id, "present")}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                status === "present" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, "late")}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                status === "late" ? "bg-amber-500 text-white border-amber-500" : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              متأخر
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, "absent")}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                                status === "absent" ? "bg-red-500 text-white border-red-500" : "bg-white border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              غائب
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveAllAttendance}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition flex items-center gap-2 text-xs"
              >
                <Check className="w-4 h-4" />
                <span>حفظ كشف الغياب الكامل وإرساله تلقائياً للطلاب</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Grades Roster */}
        {activeTab === "grades" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">رصد وتسجيل درجات الامتحانات اليومية والشهرية والنهائية</h3>
              <p className="text-xs text-slate-400 mt-0.5">رصد درجات السعي من 50 أو النهائي من 100 مباشرة لمختلف الطلاب</p>
            </div>

            <form onSubmit={handleGradeSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">اختر الطالب المعني:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700"
                  required
                >
                  <option value="">-- اختر طالب --</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.nickname || "بلا لقب"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">نوع التقييم الدراسي:</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700"
                >
                  <option value="daily">امتحان يومي أعمال اليومي (أقصى 50)</option>
                  <option value="monthly">الامتحان والتقييم الشهري (أقصى 50)</option>
                  <option value="course_work">مجموع السعي المباشر (أقصى 100)</option>
                  <option value="final">الامتحان النهائي كشف نهائي (أقصى 100)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">الدرجة المحققة:</label>
                <input
                  type="number"
                  min="0"
                  max={examType === "final" || examType === "course_work" ? "100" : "50"}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={examType === "final" || examType === "course_work" ? "من 100" : "من 50"}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-md"
                >
                  رصد وحفظ الدرجة الآن
                </button>
              </div>
            </form>

            {gradeSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gradeSuccess}</span>
              </div>
            )}

            {/* List current grades for quick validation */}
            <div className="overflow-x-auto border border-slate-150 rounded-2xl">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                    <th className="p-3 text-right">اسم الطالب</th>
                    <th className="p-3">أعمال اليومي (50)</th>
                    <th className="p-3">التقييم الشهري (50)</th>
                    <th className="p-3">السعي المباشر (100)</th>
                    <th className="p-3">السعي الإجمالي</th>
                    <th className="p-3">الامتحان النهائي (100)</th>
                    <th className="p-3">المعدل النهائي التراكمي</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-800">
                  {filteredStudents.map(student => {
                    // Extract grades dynamically
                    const dailyRecord = grades.find(g => g.studentId === student.id && g.subjectId === currentSubjectId && g.examType === "daily");
                    const monthlyRecord = grades.find(g => g.studentId === student.id && g.subjectId === currentSubjectId && g.examType === "monthly");
                    const directCourseWork = grades.find(g => g.studentId === student.id && g.subjectId === currentSubjectId && g.examType === "course_work");
                    const finalRecord = grades.find(g => g.studentId === student.id && g.subjectId === currentSubjectId && g.examType === "final");

                    let strive = 0;
                    let hasStrive = false;
                    if (directCourseWork !== undefined) {
                      strive = directCourseWork.score;
                      hasStrive = true;
                    } else if (dailyRecord !== undefined || monthlyRecord !== undefined) {
                      strive = (dailyRecord?.score || 0) + (monthlyRecord?.score || 0);
                      hasStrive = true;
                    }

                    const final = finalRecord?.score;
                    const hasFinal = final !== undefined;

                    // Cumulative average
                    let cumulative: number | undefined = undefined;
                    if (hasFinal) {
                      if (hasStrive) {
                        cumulative = Math.round((strive * 0.5) + (final! * 0.5));
                      } else {
                        cumulative = final;
                      }
                    }

                    return (
                      <tr key={student.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                        <td className="p-3 text-right text-slate-800">{student.name}</td>
                        
                        {/* Daily Grade */}
                        <td className="p-3">
                          {dailyRecord ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>{dailyRecord.score}</span>
                              <button
                                onClick={() => { if (confirm("هل أنت متأكد من حذف درجة اليومي؟")) onDeleteGrade(dailyRecord.id); }}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="حذف الدرجة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Monthly Grade */}
                        <td className="p-3">
                          {monthlyRecord ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>{monthlyRecord.score}</span>
                              <button
                                onClick={() => { if (confirm("هل أنت متأكد من حذف درجة الشهري؟")) onDeleteGrade(monthlyRecord.id); }}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="حذف الدرجة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Direct Course Work (Strive) Grade */}
                        <td className="p-3">
                          {directCourseWork ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>{directCourseWork.score}</span>
                              <button
                                onClick={() => { if (confirm("هل أنت متأكد من حذف السعي المباشر؟")) onDeleteGrade(directCourseWork.id); }}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="حذف الدرجة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Calculated total strive */}
                        <td className="p-3 bg-indigo-50/30 text-indigo-700 font-extrabold">
                          {hasStrive ? strive : "-"}
                        </td>

                        {/* Final Exam Grade */}
                        <td className="p-3">
                          {finalRecord ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>{finalRecord.score}</span>
                              <button
                                onClick={() => { if (confirm("هل أنت متأكد من حذف درجة النهائي؟")) onDeleteGrade(finalRecord.id); }}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="حذف الدرجة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Cumulative Average */}
                        <td className="p-3 bg-indigo-50/50 text-indigo-800 font-black text-sm">
                          {hasFinal ? `${cumulative}%` : "معلق"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 3: Publish Assignments */}
        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create Assignment Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">نشر واجب دراسي جديد</h3>
                <p className="text-xs text-slate-400 mt-0.5">انشر المهام والمشاريع ليقوم الطلاب بتسليمها</p>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">عنوان الواجب الدراسي:</label>
                  <input
                    type="text"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="مثال: حل صفحة 45 من كتاب النشاط"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">تاريخ ووقت الاستحقاق النهائي:</label>
                  <input
                    type="text"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    placeholder="مثال: ينتهي غداً الساعة 10:00 م"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">أهمية المهمة (اللون المحدد):</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignColor("red")}
                      className={`py-2 px-3 text-[10px] font-bold border rounded-xl transition ${
                        assignColor === "red" ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      عاجل أحمر
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignColor("yellow")}
                      className={`py-2 px-3 text-[10px] font-bold border rounded-xl transition ${
                        assignColor === "yellow" ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      متوسط أصفر
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignColor("blue")}
                      className={`py-2 px-3 text-[10px] font-bold border rounded-xl transition ${
                        assignColor === "blue" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      عادي أزرق
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                >
                  نشر وإعلان الواجب فوراً
                </button>
              </form>
            </div>

            {/* Assignments List */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">قائمة واجباتك المنشورة حالياً</h3>
                <p className="text-xs text-slate-400 mt-0.5">تتبع الواجبات المفعّلة تحت مادة التدريس الخاصة بك</p>
              </div>

              <div className="space-y-3">
                {assignments.filter(a => a.subjectId === currentSubjectId).map(task => (
                  <div key={task.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 flex justify-between items-center text-right">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">تاريخ الاستحقاق: {task.dueDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      task.colorType === "red" ? "bg-red-500" : task.colorType === "yellow" ? "bg-amber-500" : "bg-blue-600"
                    }`}>
                      {task.colorType === "red" ? "عاجل" : task.colorType === "yellow" ? "متوسط" : "عادي"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Post Announcements */}
        {activeTab === "announcements" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create Announcement Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">إرسال إعلان هام لطلابك</h3>
                <p className="text-xs text-slate-400 mt-0.5">أرسل توجيهات عامة أو تنبيهات عاجلة للطلاب</p>
              </div>

              <form onSubmit={handleAnnSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">عنوان الإعلان الأساسي:</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="مثال: تبكير موعد اختبار الشفهي"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">محتوى وتفاصيل التوجيه:</label>
                  <textarea
                    rows={4}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="اكتب رسالتك وتوجيهاتك للطلاب بالتفصيل..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-md"
                >
                  إرسال الإعلان فوراً
                </button>
              </form>
            </div>

            {/* Announcements List */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">سجل الإعلانات والتنبيهات المدرسية</h3>
                <p className="text-xs text-slate-400 mt-0.5">التنبيهات المعتمدة والمنشورة بواسطة الكادر التدريسي</p>
              </div>

              <div className="space-y-3">
                {announcements.filter(ann => ann.subjectId === currentSubjectId).map(ann => (
                  <div key={ann.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 text-right space-y-1.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                      <span className="text-[10px] text-slate-400">{ann.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] font-bold text-indigo-600 block">الكاتب: {ann.sender}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
