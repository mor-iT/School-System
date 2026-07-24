/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GraduationCap, Key, Mail, ShieldAlert, Sparkles, RefreshCw, Landmark } from "lucide-react";
import { SchoolData } from "../types";

interface LoginPortalProps {
  schoolData: SchoolData;
  onLoginSuccess: (role: "student" | "teacher" | "director", user: any, data: SchoolData) => void;
}

export default function LoginPortal({ schoolData, onLoginSuccess }: LoginPortalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate small delay for better user experience
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Check Directors
      const director = schoolData.directors.find(d => d.email.trim().toLowerCase() === cleanEmail && d.password === password);
      if (director) {
        onLoginSuccess("director", director, schoolData);
        return;
      }

      // 2. Check Teachers
      const teacher = schoolData.teachers.find(t => t.email.trim().toLowerCase() === cleanEmail && t.password === password);
      if (teacher) {
        onLoginSuccess("teacher", teacher, schoolData);
        return;
      }

      // 3. Check Students
      const student = schoolData.students.find(s => s.email.trim().toLowerCase() === cleanEmail && s.password === password);
      if (student) {
        onLoginSuccess("student", student, schoolData);
        return;
      }

      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8" id="login-portal-root">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Right Info Panel - High Quality Custom Branding */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="z-10 space-y-6">
          <div className="flex items-center gap-3">
              {schoolData.settings.logo_path ? (
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-slate-700 shadow-lg shrink-0">
                  <img src={schoolData.settings.logo_path} alt="School Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 shrink-0">
                  🏫
                </div>
              )}
              <div className="text-right">
                <h1 className="text-sm font-black tracking-wide text-white">البوابة الرقمية الموحدة</h1>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {schoolData.settings.school_name_ar || "مدرسة المتميزين النموذجية الذكية"}
                </p>
              </div>
            </div>
<div className="text-right">
  <h1 className="text-sm font-black tracking-wide text-white">البوابة الرقمية الموحدة</h1>
  <p className="text-[10px] text-slate-400 mt-0.5">
    {schoolData?.settings?.school_name_ar || "مدرسة المتميزين النموذجية الذكية"}
  </p>
</div>
            </div>

            <div className="space-y-4 pt-6">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                مرحباً بك في البوابة الأكاديمية الذكية
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                منصة متكاملة تجمع بين إدارة شؤون الطلاب، الكادر التدريسي، جدولة الحصص الدراسية، ونظام رصد الغيابات الاستباقي ومسار الألعاب التعليمية المحفز.
              </p>
            </div>
          </div>

          <div className="z-10 pt-8 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>إرشادات الدخول الموحد:</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              يرجى تسجيل الدخول باستخدام الحساب الأكاديمي المعتمد من قبل إدارة المدرسة.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              إذا واجهتك أي مشكلة في الدخول أو كنت بحاجة لإصدار حساب جديد للطلاب أو الأساتذة، يرجى مراجعة قسم تكنولوجيا المعلومات في إدارة المدرسة.
            </p>
          </div>
        </div>

        {/* Left Login Form Panel */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 flex flex-col justify-center">
          <div className="mb-8 text-right">
            <h2 className="text-3xl font-black text-slate-800">تسجيل الدخول الموحد</h2>
            <p className="text-xs text-slate-400 mt-1.5">الرجاء إدخال البريد الإلكتروني الأكاديمي ورمز المرور الخاص بك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3.5 rounded-2xl flex items-center gap-2.5 text-right">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">البريد الإلكتروني الأكاديمي:</label>
              <div className="relative">
                <input
                  type="email"
                  dir="ltr"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-11 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 right-4 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 mb-1.5">كلمة المرور الخاصة بالحساب:</label>
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-11 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  required
                />
                <Key className="w-4 h-4 text-slate-400 absolute top-1/2 right-4 transform -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-black py-3.5 rounded-2xl transition duration-150 flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق من صحة البيانات...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>تسجيل الدخول الآمن للأنظمة</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              <span>وزارة التربية والتعليم العالي</span>
            </span>
            <span>رابط مشفر آمن بنظام SSL 🔒</span>
          </div>
        </div>

      </div>
    </div>
  );
}
