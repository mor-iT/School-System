/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, Users, Shield, Sliders, PlusCircle, Trash2, LogOut, CheckCircle2, 
  Search, X, Printer, Calendar, Star, MapPin, Mail, Key, Phone, BookOpen, Clock, Edit, Menu
} from "lucide-react";
import { Director, Student, Teacher, ClassSession, Announcement, AttendanceRecord, GradeRecord, SchoolSettings, ClassEntity, SubjectEntity } from "../types";

interface DirectorDashboardProps {
  director: Director;
  students: Student[];
  teachers: Teacher[];
  classes: ClassSession[];
  announcements: Announcement[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  settings: SchoolSettings;
  classesList: ClassEntity[];
  subjectsList: SubjectEntity[];
  onAddStudent: (student: any) => void;
  onDeleteStudent: (id: string) => void;
  onEditStudent: (id: string, student: any) => void;
  onAddTeacher: (teacher: any) => void;
  onDeleteTeacher: (id: string) => void;
  onAddClass: (classObj: any) => void;
  onDeleteClass: (id: string) => void;
  onAddSubject: (subjectObj: any) => void;
  onDeleteSubject: (id: string) => void;
  onAddAnnouncement: (announcement: any) => void;
  onSaveSettings: (settings: SchoolSettings) => void;
  onLogout?: () => void;
}

export default function DirectorDashboard({
  director,
  students,
  teachers,
  classes,
  announcements,
  attendance,
  grades,
  settings,
  classesList,
  subjectsList,
  onAddStudent,
  onDeleteStudent,
  onEditStudent,
  onAddTeacher,
  onDeleteTeacher,
  onAddClass,
  onDeleteClass,
  onAddSubject,
  onDeleteSubject,
  onAddAnnouncement,
  onSaveSettings,
  onLogout
}: DirectorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "students" | "teachers" | "classes_subjects" | "announcements">("settings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic state for dynamic AJAX live search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dynamic school settings state
  const [schoolAr, setSchoolAr] = useState(settings.school_name_ar);
  const [schoolEn, setSchoolEn] = useState(settings.school_name_en);
  const [logoPath, setLogoPath] = useState(settings.logo_path);
  const [warn1, setWarn1] = useState<number>(settings.alert_percent_1);
  const [warn2, setWarn2] = useState<number>(settings.alert_percent_2);
  const [warn3, setWarn3] = useState<number>(settings.alert_percent_3);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // State for editing and creating student
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [studName, setStudName] = useState("");
  const [studNickname, setStudNickname] = useState("");
  const [studEmail, setStudEmail] = useState("");
  const [studPass, setStudPass] = useState("");
  const [studGender, setStudGender] = useState<"male" | "female">("male");
  const [studBirth, setStudBirth] = useState("");
  const [studPhone, setStudPhone] = useState("");
  const [studRegion, setStudRegion] = useState("");
  const [studAlley, setStudAlley] = useState("");
  const [studStreet, setStudStreet] = useState("");
  const [studHouse, setStudHouse] = useState("");
  const [studGrade, setStudGrade] = useState("");
  const [studAvatar, setStudAvatar] = useState("");
  const [studSuccess, setStudSuccess] = useState<string | null>(null);

  // Auto-initialize selected student grade field to the first class ID
  useEffect(() => {
    if (classesList.length > 0 && !studGrade) {
      setStudGrade(classesList[0].id);
    }
  }, [classesList, studGrade]);

  // State for creating new class
  const [classNameInput, setClassNameInput] = useState("");
  const [classGenderInput, setClassGenderInput] = useState<"boys" | "girls">("boys");
  const [classSuccess, setClassSuccess] = useState<string | null>(null);

  // State for creating new subject
  const [subjectNameInput, setSubjectNameInput] = useState("");
  const [subjectClassInput, setSubjectClassInput] = useState("");
  const [subjectSuccess, setSubjectSuccess] = useState<string | null>(null);

  // State for creating new teacher
  const [teachName, setTeachName] = useState("");
  const [teachEmail, setTeachEmail] = useState("");
  const [teachPass, setTeachPass] = useState("");
  const [teachSubjectsSelected, setTeachSubjectsSelected] = useState<string[]>([]);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [teachAvatar, setTeachAvatar] = useState("");
  const [teachSuccess, setTeachSuccess] = useState<string | null>(null);

  // State for creating new announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annSuccess, setAnnSuccess] = useState<string | null>(null);

  // Selected student transcript pop-up
  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState<Student | null>(null);

  // Execute live search
  const handleLiveSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.error("Live search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      school_name_ar: schoolAr,
      school_name_en: schoolEn,
      logo_path: logoPath,
      alert_percent_1: Number(warn1),
      alert_percent_2: Number(warn2),
      alert_percent_3: Number(warn3),
    });
    setSettingsSuccess("تم تحديث وحفظ بيانات وإعدادات المدرسة والمشغل بنجاح!");
    setTimeout(() => setSettingsSuccess(null), 4000);
  };

  // Add Student Submit
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studName || !studEmail) return;

    onAddStudent({
      name: studName,
      nickname: studNickname,
      email: studEmail,
      password: studPass || "123",
      gender: studGender,
      birthDate: studBirth,
      phoneNumber: studPhone,
      region: studRegion,
      alley: studAlley,
      street: studStreet,
      houseNumber: studHouse,
      gradeLevel: studGrade,
      avatar: studAvatar || undefined
    });

    setStudSuccess(`تم تسجيل وإضافة الطالب (${studName}) بنجاح إلى قاعدة البيانات!`);
    
    // Reset fields
    setStudName("");
    setStudNickname("");
    setStudEmail("");
    setStudPass("");
    setStudBirth("");
    setStudPhone("");
    setStudRegion("");
    setStudAlley("");
    setStudStreet("");
    setStudHouse("");
    setStudAvatar("");

    setTimeout(() => setStudSuccess(null), 4000);
  };

  // Add Teacher Submit
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teachName || !teachEmail || teachSubjectsSelected.length === 0) {
      alert("يرجى إدخال اسم المعلم وبريده واختيار مادة واحدة على الأقل!");
      return;
    }

    onAddTeacher({
      name: teachName,
      email: teachEmail,
      password: teachPass || "123",
      subjectsList: teachSubjectsSelected,
      avatar: teachAvatar || undefined
    });

    setTeachSuccess(`تم تسجيل وإضافة الأستاذ (${teachName}) بنجاح إلى قاعدة البيانات!`);
    setTeachName("");
    setTeachEmail("");
    setTeachPass("");
    setTeachSubjectsSelected([]);
    setTeachAvatar("");
    setTimeout(() => setTeachSuccess(null), 4000);
  };

  // Add Class Submit
  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;
    onAddClass({
      name: classNameInput.trim(),
      gender: classGenderInput
    });
    setClassNameInput("");
    setClassSuccess("تمت إضافة الصف الدراسي بنجاح!");
    setTimeout(() => setClassSuccess(null), 3000);
  };

  // Add Subject Submit
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectNameInput.trim() || !subjectClassInput) return;
    onAddSubject({
      name: subjectNameInput.trim(),
      classId: subjectClassInput
    });
    setSubjectNameInput("");
    setSubjectSuccess("تمت إضافة المادة الدراسية بنجاح المقترنة بالصف!");
    setTimeout(() => setSubjectSuccess(null), 3000);
  };

  // Add Announcement Submit
  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    onAddAnnouncement({
      title: annTitle,
      content: annContent,
      sender: director.name
    });

    setAnnSuccess("تم نشر الإعلان الإداري العام بنجاح لكافة الطلاب والمعلمين!");
    setAnnTitle("");
    setAnnContent("");
    setTimeout(() => setAnnSuccess(null), 4000);
  };

  // Calculate Bologna Warnings per subject for transcript viewer
  const getStudentTranscript = (student: Student) => {
    const studentAtt = attendance.filter(a => a.studentId === student.id);
    const uniqueSubjects = classes.map(c => ({ id: c.subjectId, name: c.subject }));

    return uniqueSubjects.map(sub => {
      const records = studentAtt.filter(a => a.subjectId === sub.id);
      const totalRecords = records.length;
      const absentRecords = records.filter(a => a.status === "absent").length;
      const absentPercentage = totalRecords > 0 ? Math.round((absentRecords / totalRecords) * 100) : 0;

      const directCourseWork = grades.find(g => g.studentId === student.id && g.subjectId === sub.id && g.examType === "course_work");
      const dailyRecords = grades.filter(g => g.studentId === student.id && g.subjectId === sub.id && g.examType === "daily");
      const monthlyRecords = grades.filter(g => g.studentId === student.id && g.subjectId === sub.id && g.examType === "monthly");
      
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

      const finalRecord = grades.find(g => g.studentId === student.id && g.subjectId === sub.id && g.examType === "final");
      const finalScore = finalRecord ? finalRecord.score : undefined;
      const hasFinal = finalScore !== undefined;

      // Cumulative average
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
        subjectId: sub.id,
        subjectName: sub.name,
        totalRecords,
        absentRecords,
        absentPercentage,
        daily: dailyVal,
        monthly: monthlyVal,
        strive: hasStrive ? strive : "-",
        finalScore,
        average,
        hasFinal,
        resultStatus
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-right" id="director-portal-root">
      
      {/* Mobile Top Header (RTL-oriented) */}
      <div className="md:hidden bg-white border-b border-slate-100 p-4 flex justify-between items-center z-30 w-full shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden">
            <img src={director.avatar} alt={director.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{director.name}</h2>
            <p className="text-[10px] text-slate-400">المدير العام للمؤسسة</p>
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
      
      {/* Dynamic Transcript Print Pop-Up overlay */}
      {selectedTranscriptStudent && (
        <div 
          onClick={() => setSelectedTranscriptStudent(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-4xl w-full border border-slate-200 shadow-2xl relative print:border-0 print:shadow-none"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedTranscriptStudent(null)}
              className="absolute top-4 left-4 py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-black text-xs rounded-xl transition print:hidden flex items-center gap-1.5 shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>إغلاق (X)</span>
            </button>

            {/* Print trigger button */}
            <button
              onClick={() => window.print()}
              className="absolute top-4 left-16 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الشهادة الرسمية</span>
            </button>

            {/* Print Certificate Header */}
            <div className="border-[3px] border-slate-900 p-8 rounded-2xl outline outline-1 outline-slate-900 outline-offset-4 text-slate-950 text-right print:p-2 print:border-2">
              <div className="flex justify-between items-center border-b border-slate-300 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{schoolAr}</h2>
                  <p className="text-xs text-slate-500 font-mono" dir="ltr">{schoolEn}</p>
                </div>
                <img src={logoPath} className="h-16 w-16 object-contain" alt="Logo" />
              </div>

              <h1 className="text-2xl font-black text-center mb-8 tracking-tight text-slate-900">
                📜 الشهادة الأكاديمية وكشف الدرجات الموحد
              </h1>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">اسم الطالب المعتمد:</span>
                  <strong className="text-slate-800 text-base">{selectedTranscriptStudent.name} ({selectedTranscriptStudent.nickname || "-"})</strong>
                </div>
                <div className="text-left">
                  <span className="text-slate-500 block mb-1">الصف الدراسي المقيد به:</span>
                  <strong className="text-blue-700 text-base">{selectedTranscriptStudent.gradeLevel}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-3 text-right">المقرر الدراسي</th>
                      <th className="p-3">أعمال اليومي (50)</th>
                      <th className="p-3">التقييم الشهري (50)</th>
                      <th className="p-3">مجموع السعي (100)</th>
                      <th className="p-3">الامتحان النهائي (100)</th>
                      <th className="p-3">المعدل التراكمي (%)</th>
                      <th className="p-3">النتيجة النهائية</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-900">
                    {getStudentTranscript(selectedTranscriptStudent).map((sub, idx) => (
                      <tr key={idx} className="border-b border-slate-300">
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
                <div>توقيع الكنترول العام: ...........................</div>
                <div>ختم وتوقيع إدارة المدرسة والمدير: {director.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className={`
        fixed inset-y-0 right-0 w-64 bg-white border-l border-slate-100 flex flex-col justify-between p-6 z-40 transition-transform duration-300 md:relative md:translate-x-0 shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
      `}>
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-black text-blue-800">{schoolAr.split(" ")[0]}</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">البوابة الموحدة للمدير</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
              <img src={director.avatar} alt={director.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-slate-800">{director.name}</h2>
              <p className="text-[9px] text-blue-600 font-bold mt-0.5">المدير العام للمؤسسة</p>
            </div>
          </div>

          {/* Dynamic Search Bar (From PHP Search Component) */}
          <div className="mb-6 relative">
            <label className="block text-[10px] font-black text-slate-500 mb-1">🔍 بحث فوري عن مستخدم:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleLiveSearch}
                placeholder="ابحث باسم الطالب أو اللقب..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 right-2.5 transform -translate-y-1/2" />
            </div>

            {/* Dropdown Live Results Box */}
            {searchQuery.trim() && (
              <div className="absolute top-full right-0 left-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 mt-2 z-50 max-h-60 overflow-y-auto space-y-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-1.5 text-[10px] text-slate-400">
                  <span>نتائج البحث المباشرة:</span>
                  <button onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-slate-700">إغلاق</button>
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((user, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (user.role === "student") {
                          const original = students.find(s => s.id === user.id);
                          if (original) setSelectedTranscriptStudent(original);
                        } else {
                          alert(`الأستاذ: ${user.name}`);
                        }
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition text-right"
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-150 shrink-0">
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-800 block truncate">{user.name}</span>
                        <span className="text-[8px] text-slate-400 block truncate">
                          {user.role === "student" ? `طالب - ${user.nickname || "بلا لقب"}` : "أستاذ"}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 text-center py-2">لا توجد نتائج مطابقة.</p>
                )}
              </div>
            )}
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "settings" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>إعدادات مدرسة بولونيا</span>
            </button>

            <button
              onClick={() => { setActiveTab("students"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "students" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>إدارة حسابات الطلاب والشهادات</span>
            </button>

            <button
              onClick={() => { setActiveTab("teachers"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "teachers" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>إدارة حسابات الكادر والأساتذة</span>
            </button>

            <button
              onClick={() => { setActiveTab("classes_subjects"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "classes_subjects" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>إدارة الصفوف والمواد</span>
            </button>

            <button
              onClick={() => { setActiveTab("announcements"); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                activeTab === "announcements" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>نشر الأخبار والإعلانات المدرسية</span>
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
        
        {/* Banner */}
        <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-3xl p-6 text-white mb-6 relative overflow-hidden shadow-sm">
          <div className="z-10 relative">
            <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2.5 inline-block">
              منصة الرصد والتتبع والتحكم الشامل للمدير العام
            </span>
            <h2 className="text-xl md:text-2xl font-black mb-1">لوحة تحكم وإدارة المدرسة النموذجية</h2>
            <p className="text-[11px] text-slate-300">
              أهلاً بك حضرة المدير {director.name}. من هنا يمكنك إدارة حسابات الطلاب والأساتذة بالكامل، ونشر الإعلانات وتغيير ثوابت بولونيا للغياب.
            </p>
          </div>
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-slate-800 rounded-full blur-2xl transform -translate-x-10"></div>
        </div>

        {/* Tab 1: Settings Form */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-800">إعدادات مشغل مدرسة بولونيا الذكية</h3>
              <p className="text-xs text-slate-400 mt-0.5">تحكم في هوية المدرسة المكتوبة والحدود التحذيرية لغيابات بولونيا بالكامل</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1.5">اسم المدرسة باللغة العربية:</label>
                  <input
                    type="text"
                    value={schoolAr}
                    onChange={(e) => setSchoolAr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1.5">اسم المدرسة باللغة الإنجليزية:</label>
                  <input
                    type="text"
                    value={schoolEn}
                    onChange={(e) => setSchoolEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-slate-500 mb-1.5">شعار المدرسة الرسمي:</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                      {logoPath ? (
                        <img src={logoPath} alt="School Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-grow w-full space-y-1 text-right">
                      <input
                        type="file"
                        accept="image/*"
                        id="logo-file-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setLogoPath(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="logo-file-upload"
                        className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition shadow-sm"
                      >
                        رفع شعار المدرسة (صورة)
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">يدعم ملفات الصور بجميع الصيغ. سيتم تحديث وحفظ الشعار مباشرة بعد الحفظ.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-black text-slate-700">📊 حدود إنذار الحرمان وغلق الغيابات (نظام مسار بولونيا) %</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الإنذار الأول (%):</label>
                    <input
                      type="number"
                      value={warn1}
                      onChange={(e) => setWarn1(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الإنذار الثاني (%):</label>
                    <input
                      type="number"
                      value={warn2}
                      onChange={(e) => setWarn2(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">نسبة الحرمان النهائي (%):</label>
                    <input
                      type="number"
                      value={warn3}
                      onChange={(e) => setWarn3(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {settingsSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl text-xs transition shadow-md"
                >
                  حفظ وتطبيق التغييرات فوراً
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Manage Students */}
        {activeTab === "students" && (
          <div className="space-y-6">
            
            {/* Create Student form */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">تسجيل وإضافة حساب طالب جديد</h3>
                <p className="text-xs text-slate-400 mt-0.5">سجل بيانات وموقع سكن الطالب بالكامل لإنشاء ملفه الشخصي والأكاديمي</p>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">اسم الطالب الكامل:</label>
                    <input
                      type="text"
                      value={studName}
                      onChange={(e) => setStudName(e.target.value)}
                      placeholder="مثال: يوسف رائد سعيد"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">اللقب / الشهرة:</label>
                    <input
                      type="text"
                      value={studNickname}
                      onChange={(e) => setStudNickname(e.target.value)}
                      placeholder="مثال: البطل"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">الصف الأكاديمي:</label>
                    <select
                      value={studGrade}
                      onChange={(e) => setStudGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 font-bold"
                      required
                    >
                      <option value="">-- اختر الصف الدراسي --</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.gender === "boys" ? "بنين" : "بنات"})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">البريد الإلكتروني المعتمد:</label>
                    <input
                      type="email"
                      value={studEmail}
                      onChange={(e) => setStudEmail(e.target.value)}
                      placeholder="name@school.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">رمز المرور التجريبي (Password):</label>
                    <input
                      type="text"
                      value={studPass}
                      onChange={(e) => setStudPass(e.target.value)}
                      placeholder="123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">الجنس:</label>
                    <select
                      value={studGender}
                      onChange={(e) => setStudGender(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 font-bold"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">تاريخ الميلاد:</label>
                    <input
                      type="date"
                      value={studBirth}
                      onChange={(e) => setStudBirth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">رقم الهاتف للاتصال:</label>
                    <input
                      type="text"
                      value={studPhone}
                      onChange={(e) => setStudPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">صورة الطالب الشخصية:</label>
                    <div className="flex items-center gap-2">
                      {studAvatar ? (
                        <img src={studAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-300">بلا</div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setStudAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-form Address details matching the original database inputs requested */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <h4 className="text-[11px] font-black text-slate-600">📍 تفاصيل وبطاقة السكن والعنوان:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
                    <div>
                      <label className="block text-slate-500 mb-1">المحافظة / المحلة:</label>
                      <input type="text" value={studRegion} onChange={(e) => setStudRegion(e.target.value)} placeholder="مثال: الكرادة" className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">الزقاق:</label>
                      <input type="text" value={studAlley} onChange={(e) => setStudAlley(e.target.value)} placeholder="10" className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">الشارع:</label>
                      <input type="text" value={studStreet} onChange={(e) => setStudStreet(e.target.value)} placeholder="5" className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">الدار:</label>
                      <input type="text" value={studHouse} onChange={(e) => setStudHouse(e.target.value)} placeholder="12" className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none" />
                    </div>
                  </div>
                </div>

                {studSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{studSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl text-xs transition shadow-md"
                  >
                    تسجيل الطالب في المنصة
                  </button>
                </div>
              </form>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">قائمة حسابات الطلاب المسجلين</h3>
                <p className="text-xs text-slate-400 mt-0.5">تتبع الطلاب واستعرض درجات الشهادات الموثقة واطبعها بضغطة زر</p>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                      <th className="p-3 text-right">اسم الطالب</th>
                      <th className="p-3">الصف الدراسي</th>
                      <th className="p-3">البريد الإلكتروني</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">نقاط الألعاب</th>
                      <th className="p-3">طباعة الشهادة</th>
                      <th className="p-3">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-800">
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200">
                              <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{student.name}</span>
                              {student.nickname && <span className="text-[10px] text-slate-400 block">{student.nickname}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          {classesList.find(c => c.id === student.gradeLevel)?.name || student.gradeLevel}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{student.email}</td>
                        <td className="p-3 text-slate-500">{student.phoneNumber || "غير مدرج"}</td>
                        <td className="p-3 text-orange-600 font-black">{student.gamePoints}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedTranscriptStudent(student)}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>كشف الدرجات</span>
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingStudent(student)}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف حساب الطالب (${student.name}) نهائياً؟`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                              title="حذف حساب الطالب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Manage Teachers */}
        {activeTab === "teachers" && (
          <div className="space-y-6">
            
            {/* Create Teacher */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">إضافة وتعيين أستاذ جديد</h3>
                <p className="text-xs text-slate-400 mt-0.5">سجل حسابات الأساتذة وعين المادة التدريسية المقررة لهم</p>
              </div>

              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">اسم الأستاذ الكامل:</label>
                    <input
                      type="text"
                      value={teachName}
                      onChange={(e) => setTeachName(e.target.value)}
                      placeholder="مثال: أ.د. مروان سامي"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">البريد الإلكتروني الأكاديمي:</label>
                    <input
                      type="email"
                      value={teachEmail}
                      onChange={(e) => setTeachEmail(e.target.value)}
                      placeholder="name@school.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">رمز المرور (Password):</label>
                    <input
                      type="text"
                      value={teachPass}
                      onChange={(e) => setTeachPass(e.target.value)}
                      placeholder="123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">صورة الأستاذ الشخصية:</label>
                    <div className="flex items-center gap-2">
                      {teachAvatar ? (
                        <img src={teachAvatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-300">بلا</div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTeachAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <h4 className="text-xs font-black text-slate-700">📚 المواد والصفوف الموكلة للأستاذ:</h4>
                  
                  {/* Selected subjects badges */}
                  {teachSubjectsSelected.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-bold">المواد المحددة حالياً ({teachSubjectsSelected.length}):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {teachSubjectsSelected.map(subId => {
                          const sub = subjectsList.find(s => s.id === subId);
                          const cls = sub ? classesList.find(c => c.id === sub.classId) : null;
                          const clsName = cls ? ` (${cls.name})` : "";
                          return (
                            <span key={subId} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-blue-200">
                              <span>{sub ? `${sub.name}${clsName}` : subId}</span>
                              <button
                                type="button"
                                onClick={() => setTeachSubjectsSelected(prev => prev.filter(id => id !== subId))}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition text-blue-900"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Search Input Field */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 اكتب اسم المادة أو الصف للبحث والفلترة السريعة..."
                      value={subjectSearchQuery}
                      onChange={(e) => setSubjectSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 text-xs font-bold text-right"
                    />
                  </div>

                  {/* Scrollable Filtered Checkbox List */}
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar border-t border-slate-100 pt-2">
                    {(() => {
                      const displayedSubjects = subjectsList.filter(sub => {
                        const cls = classesList.find(c => c.id === sub.classId);
                        const clsName = cls ? cls.name : "";
                        const matchStr = `${sub.name} ${clsName}`.toLowerCase();
                        return matchStr.includes(subjectSearchQuery.toLowerCase());
                      });

                      if (subjectsList.length === 0) {
                        return (
                          <p className="text-slate-400 text-xs text-center py-2">لا توجد مواد دراسية مضافة حالياً. يرجى إضافة الصفوف والمواد أولاً.</p>
                        );
                      }

                      if (displayedSubjects.length === 0) {
                        return (
                          <p className="text-slate-400 text-[11px] text-center py-2">لا توجد مادة تطابق بحثك الحالي.</p>
                        );
                      }

                      return displayedSubjects.map(sub => {
                        const cls = classesList.find(c => c.id === sub.classId);
                        const clsName = cls ? ` [${cls.name}]` : "";
                        const isChecked = teachSubjectsSelected.includes(sub.id);
                        return (
                          <label 
                            key={sub.id} 
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition text-[11px] font-bold ${
                              isChecked 
                                ? "bg-blue-50 border-blue-200 text-blue-800" 
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTeachSubjectsSelected(prev => prev.filter(id => id !== sub.id));
                                } else {
                                  setTeachSubjectsSelected(prev => [...prev, sub.id]);
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-100"
                            />
                            <span>{sub.name}{clsName}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>

                {teachSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{teachSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-6 rounded-xl text-xs transition shadow-md"
                  >
                    تسجيل الأستاذ في الكادر
                  </button>
                </div>
              </form>
            </div>

            {/* Teachers List */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">قائمة حسابات الكادر والأساتذة</h3>
                <p className="text-xs text-slate-400 mt-0.5">تتبع الكادر التدريسي والمواد المسندة والمقيدة لهم</p>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-xs">
                      <th className="p-3 text-right">اسم المعلم</th>
                      <th className="p-3">المادة الدراسية المسندة</th>
                      <th className="p-3">البريد الإلكتروني</th>
                      <th className="p-3">الرمز التعريفي</th>
                      <th className="p-3">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="font-bold text-slate-800">
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                        <td className="p-3 text-right">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200">
                              <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-slate-800">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-blue-700">
                          {teacher.subjectsList && teacher.subjectsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {teacher.subjectsList.map(subId => {
                                const subObj = subjectsList.find(s => s.id === subId);
                                const clsObj = subObj ? classesList.find(c => c.id === subObj.classId) : null;
                                return (
                                  <span key={subId} className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
                                    {subObj ? `${subObj.name} (${clsObj ? clsObj.name : ""})` : subId}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            teacher.subject
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">{teacher.email}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">{teacher.id}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف حساب الأستاذ (${teacher.name}) نهائياً؟`)) {
                                onDeleteTeacher(teacher.id);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: School Announcements */}
        {activeTab === "announcements" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Create Announcement */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm h-fit">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">نشر إعلان عام للمدرسة</h3>
                <p className="text-xs text-slate-400 mt-0.5">انشر التنبيهات والأخبار الإدارية لجميع المنسبين</p>
              </div>

              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">عنوان الخبر / التنبيه:</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="مثال: تعطيل الدوام الرسمي بمناسبة الأعياد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">تفاصيل ومحتوى الإعلان:</label>
                  <textarea
                    rows={4}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="اكتب تفاصيل الإعلان هنا..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 font-bold"
                    required
                  ></textarea>
                </div>

                {annSuccess && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{annSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl text-xs transition shadow-md"
                >
                  نشر وإعلان الخبر فوراً
                </button>
              </form>
            </div>

            {/* List Current Announcements */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h3 className="text-base font-bold text-slate-800">سجل الإعلانات المعتمدة بالمنصة</h3>
                <p className="text-xs text-slate-400 mt-0.5">تتبع الإعلانات المدرسية الصادرة حالياً</p>
              </div>

              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 text-right space-y-1.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                      <span className="text-[10px] text-slate-400">{ann.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] font-bold text-blue-600 block">الكاتب: {ann.sender}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: Manage Classes and Subjects */}
        {activeTab === "classes_subjects" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand: Setup and list classes */}
            <div className="lg:col-span-6 space-y-6">
              {/* Add Class Form */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <h3 className="text-sm font-black text-slate-800">➕ إضافة صف دراسي جديد</h3>
                  <p className="text-xs text-slate-400 mt-0.5">انشئ شعبة أو صف دراسي جديد لتقييد الطلاب والمقررات</p>
                </div>

                <form onSubmit={handleAddClassSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">اسم الصف الدراسي / الشعبة:</label>
                    <input 
                      type="text" 
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="مثال: الصف العاشر - شعبة أ"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">جنس الطلاب المقيدين في هذا الصف:</label>
                    <select
                      value={classGenderInput}
                      onChange={(e) => setClassGenderInput(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                    >
                      <option value="boys">بنين (ذكور)</option>
                      <option value="girls">بنات (إناث)</option>
                    </select>
                  </div>

                  {classSuccess && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl">
                      {classSuccess}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition shadow-sm font-black"
                  >
                    إنشاء الصف الدراسي
                  </button>
                </form>
              </div>

              {/* Classes list */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-3">📋 الصفوف الدراسية النشطة</h3>
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 text-right">الصف الدراسي</th>
                        <th className="p-2.5">الجنس</th>
                        <th className="p-2.5">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-800">
                      {classesList.map(cls => (
                        <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-2.5 text-right">{cls.name}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${cls.gender === "boys" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                              {cls.gender === "boys" ? "بنين" : "بنات"}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف الصف (${cls.name})؟ سيتم قطع اقتران كافة الطلاب المرتبطين به.`)) {
                                  onDeleteClass(cls.id);
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {classesList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-slate-400 text-center">لا توجد صفوف دراسية مضافة حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Hand: Setup and list subjects */}
            <div className="lg:col-span-6 space-y-6">
              {/* Add Subject Form */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <h3 className="text-sm font-black text-slate-800">📚 إضافة مادة دراسية جديدة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">انشئ مقرر دراسي واقرنه بصف معين لتتبع غياباته ودرجاته</p>
                </div>

                <form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-500 mb-1">اسم المادة الدراسية:</label>
                    <input 
                      type="text" 
                      value={subjectNameInput}
                      onChange={(e) => setSubjectNameInput(e.target.value)}
                      placeholder="مثال: الرياضيات المتقدمة"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">الصف الدراسي المقترن بها:</label>
                    <select
                      value={subjectClassInput}
                      onChange={(e) => setSubjectClassInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 text-slate-700"
                      required
                    >
                      <option value="">-- اختر الصف الدراسي --</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.gender === "boys" ? "بنين" : "بنات"})</option>
                      ))}
                    </select>
                  </div>

                  {subjectSuccess && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl">
                      {subjectSuccess}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition shadow-sm font-black"
                  >
                    إنشاء وإدراج المادة
                  </button>
                </form>
              </div>

              {/* Subjects list */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 mb-3">📋 المقررات والمواد النشطة</h3>
                <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2.5 text-right">اسم المادة</th>
                        <th className="p-2.5">الصف الدراسي</th>
                        <th className="p-2.5">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="font-bold text-slate-800">
                      {subjectsList.map(sub => {
                        const boundClass = classesList.find(c => c.id === sub.classId);
                        return (
                          <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-2.5 text-right text-indigo-700">{sub.name}</td>
                            <td className="p-2.5 text-slate-500">{boundClass ? boundClass.name : "غير مقترن"}</td>
                            <td className="p-2.5">
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف مادة (${sub.name})؟ سيتم قطع الحضور والغياب والدرجات المقترنة بها.`)) {
                                    onDeleteSubject(sub.id);
                                  }
                                }}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {subjectsList.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-slate-400 text-center">لا توجد مواد دراسية مضافة حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Dynamic Edit Student Modal Popup Overlay */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          classesList={classesList}
          onSave={(id, updated) => {
            onEditStudent(id, updated);
            setEditingStudent(null);
          }}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}

interface EditStudentModalProps {
  student: Student;
  classesList: ClassEntity[];
  onSave: (id: string, updated: any) => void;
  onClose: () => void;
}

function EditStudentModal({
  student,
  classesList,
  onSave,
  onClose
}: EditStudentModalProps) {
  const [name, setName] = useState(student.name);
  const [nickname, setNickname] = useState(student.nickname || "");
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState(student.password || "123");
  const [gender, setGender] = useState<"male" | "female">(student.gender || "male");
  const [birthDate, setBirthDate] = useState(student.birthDate || "");
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || "");
  const [region, setRegion] = useState(student.region || "");
  const [alley, setAlley] = useState(student.alley || "");
  const [street, setStreet] = useState(student.street || "");
  const [houseNumber, setHouseNumber] = useState(student.houseNumber || "");
  const [gradeLevel, setGradeLevel] = useState(student.gradeLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(student.id, {
      name,
      nickname,
      email,
      password,
      gender,
      birthDate,
      phoneNumber,
      region,
      alley,
      street,
      houseNumber,
      gradeLevel
    });
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto text-right"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-slate-900 mb-2">✏️ تعديل بيانات وملف الطالب الأكاديمي</h3>
        <p className="text-xs text-slate-400 mb-5">قم بتحديث وتصحيح حقول السكن والصف الدراسي والبيانات المعتمدة للطالب</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 mb-1">اسم الطالب المعتمد:</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
                required 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">اللقب / الشهرة:</label>
              <input 
                type="text" 
                value={nickname} 
                onChange={(e) => setNickname(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">الصف الأكاديمي المقيد به:</label>
              <select 
                value={gradeLevel} 
                onChange={(e) => setGradeLevel(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
                required
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.gender === "boys" ? "بنين" : "بنات"})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">البريد الإلكتروني المعتمد:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100 font-mono" 
                required 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">رمز المرور (Password):</label>
              <input 
                type="text" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">الجنس:</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value as any)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">تاريخ الميلاد:</label>
              <input 
                type="date" 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">رقم الهاتف للاتصال:</label>
              <input 
                type="text" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-100" 
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3 text-right">
            <h4 className="text-[11px] font-black text-slate-600">📍 تفاصيل وبطاقة السكن والعنوان:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
              <div>
                <label className="block text-slate-500 mb-1">المحافظة / المحلة:</label>
                <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">الزقاق:</label>
                <input type="text" value={alley} onChange={(e) => setAlley(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">الشارع:</label>
                <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">الدار:</label>
                <input type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-5 rounded-xl transition"
            >
              إلغاء التعديل
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 px-6 rounded-xl transition shadow-md"
            >
              تحديث وحفظ التغييرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
