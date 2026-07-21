/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Gamepad2, Brain, Flame, Trophy, Play, CheckCircle, AlertTriangle, ArrowLeft, RotateCcw, Award } from "lucide-react";
import { Student } from "../types";

interface GamesPortalProps {
  currentStudent: Student;
  onPointsEarned: (points: number) => void;
  onBackToDashboard?: () => void;
}

type GameType = "math" | "code" | "science" | null;

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MATH_QUESTIONS: Question[] = [
  { question: "احسب الناتج: 14 + 27", options: ["31", "41", "39", "43"], correctIndex: 1, explanation: "جمع آحاد مع آحاد وعشرات مع عشرات يعطي 41." },
  { question: "ما قيمة x في المعادلة: 3x - 5 = 10 ؟", options: ["3", "5", "15", "4"], correctIndex: 1, explanation: "3x = 15 إذن x = 5." },
  { question: "احسب: 8 × 7", options: ["54", "56", "64", "48"], correctIndex: 1, explanation: "حاصل ضرب 8 في 7 هو 56." },
  { question: "احسب الناتج: 120 ÷ 4", options: ["25", "30", "40", "20"], correctIndex: 1, explanation: "120 مقسومة على 4 تساوي 30." },
  { question: "ما هو الجذر التربيعي للعدد 81؟", options: ["8", "9", "7", "11"], correctIndex: 1, explanation: "9 × 9 = 81، إذن الجذر هو 9." }
];

const CODE_QUESTIONS: Question[] = [
  { question: "ما هي مخرجات الكود التالي في بايثون: print(10 // 3)؟", options: ["3.33", "3", "1", "4"], correctIndex: 1, explanation: "العلامة // تمثل القسمة الصحيحة (بدون باقي)، والناتج هو 3." },
  { question: "أي مما يلي يُستخدم لتعريف دالة (Function) في لغة بايثon؟", options: ["function", "def", "func", "define"], correctIndex: 1, explanation: "نستخدم الكلمة المفتاحية def لتعريف الدوال في بايثون." },
  { question: "ما هي الطريقة الصحيحة لإضافة عنصر للقائمة (List) في بايثون؟", options: ["list.add(item)", "list.append(item)", "list.insert(item)", "list.push(item)"], correctIndex: 1, explanation: "تُستخدم الدالة append لإضافة عنصر لنهاية القائمة." },
  { question: "ماذا تعني الحلقة التكرارية for i in range(5)؟", options: ["تتكرر من 1 إلى 5", "تتكرر 5 مرات بدءاً من 0 إلى 4", "تتكرر من 0 إلى 5", "تتكرر لمالانهاية"], correctIndex: 1, explanation: "range(5) تولد تسلسلاً من 0 إلى 4 وتكرر الحلقة 5 مرات." },
  { question: "ما نوع البيانات للمتغير x = 5.5؟", options: ["int", "float", "str", "boolean"], correctIndex: 1, explanation: "الأرقام العشرية في البرمجة تسمى float." }
];

const SCIENCE_QUESTIONS: Question[] = [
  { question: "ما هو الغاز الأساسي المسبب للاحتراق؟", options: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"], correctIndex: 1, explanation: "الأكسجين غاز يساعد على الاشتعال وهو أساسي للتنفس والاحتراق." },
  { question: "ما هي الوحدة الأساسية لقياس القوة في الفيزياء؟", options: ["الوات", "النيوتن", "الجول", "الكيلوجرام"], correctIndex: 1, explanation: "تُقاس القوة بوحدة النيوتن تقديراً للعالم إسحاق نيوتن." },
  { question: "ما هي الصيغة الكيميائية للماء؟", options: ["CO2", "H2O", "NaCl", "O2"], correctIndex: 1, explanation: "يتكون الماء من ذرتي هيدروجين وذرة أكسجين H2O." },
  { question: "أين تقع الغدة الدرقية في جسم الإنسان؟", options: ["في الصدر", "في الرقبة", "في البطن", "في الرأس"], correctIndex: 1, explanation: "تقع الغدة الدرقية في الجزء الأمامي من الرقبة أسفل حنجرة الصوت." },
  { question: "أي الكواكب هو الأقرب إلى الشمس؟", options: ["الزهرة", "عطارد", "المريخ", "المشتري"], correctIndex: 1, explanation: "عطارد هو الكوكب الأقرب للشمس في المجموعة الشمسية." }
];

export default function GamesPortal({ currentStudent, onPointsEarned, onBackToDashboard }: GamesPortalProps) {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [totalSessionPoints, setTotalSessionPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  // Get current questions list based on active game
  const getQuestions = (): Question[] => {
    if (activeGame === "math") return MATH_QUESTIONS;
    if (activeGame === "code") return CODE_QUESTIONS;
    if (activeGame === "science") return SCIENCE_QUESTIONS;
    return [];
  };

  const questions = getQuestions();
  const currentQuestion = questions[currentQuestionIdx];

  // Timer effect
  useEffect(() => {
    if (!activeGame || gameOver || isAnswered) return;

    if (timeLeft === 0) {
      handleAnswerSelect(-1); // Timeout as wrong answer
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, activeGame, gameOver, isAnswered]);

  const startNewGame = (type: GameType) => {
    setActiveGame(type);
    setCurrentQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setGameOver(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      const addedPoints = activeGame === "code" ? 20 : 15;
      const streakBonus = streak >= 2 ? 5 : 0;
      const finalAward = addedPoints + streakBonus;

      setScore(prev => prev + finalAward);
      setTotalSessionPoints(prev => prev + finalAward);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx + 1 < questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      // Game Over
      setGameOver(true);
      // Sync to backend / parent
      onPointsEarned(score);
    }
  };

  const handleCloseGame = () => {
    setActiveGame(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto" id="games-portal-root">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-8 h-8 text-blue-600 animate-pulse" />
            <h1 className="text-2xl font-bold text-slate-800" id="portal-title">بوابة الألعاب التعليمية الذكية</h1>
          </div>
          <p className="text-slate-500 text-sm">
            العب، تعلم، واجمع النقاط لرفع مستواك والتربع على قائمة المتفوقين في المدرسة!
          </p>
        </div>
        <div className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 w-full md:w-auto">
          <div className="text-right">
            <p className="text-xs text-blue-600 font-bold">نقاطك الحالية</p>
            <p className="text-lg font-extrabold text-blue-900" id="user-points">{currentStudent.gamePoints + totalSessionPoints} نقطة</p>
          </div>
          <div className="h-8 w-[1px] bg-blue-200"></div>
          <div className="text-right">
            <p className="text-xs text-blue-600 font-bold">الرتبة في المدرسة</p>
            <p className="text-lg font-extrabold text-blue-900" id="user-rank">المركز {currentStudent.currentRank}</p>
          </div>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="mr-auto bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
              id="back-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              الرجوع للوحة
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {!activeGame ? (
        <div>
          {/* Game List Landing View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Math Game Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group">
              <div className="p-6 bg-amber-50 text-amber-800 border-b border-amber-100 flex justify-between items-center">
                <Brain className="w-8 h-8 text-amber-600" />
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">+15 نقطة لكل سؤال</span>
              </div>
              <div className="p-6 flex-grow">
                <h3 className="text-lg font-bold text-slate-800 mb-2">تحدي الرياضيات السريع</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  اختبر سرعتك الحسابية وقدراتك العقلية في حل المعادلات الأساسية والجبر تحت ضغط الوقت.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                  <span>⏰ 15 ثانية للسؤال</span>
                  <span>🧠 5 أسئلة متدرجة الصعوبة</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => startNewGame("math")}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition group-hover:scale-[1.02]"
                  id="start-math-btn"
                >
                  <Play className="w-4 h-4 fill-white" />
                  دخول التحدي
                </button>
              </div>
            </div>

            {/* Python Coding Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group">
              <div className="p-6 bg-blue-50 text-blue-800 border-b border-blue-100 flex justify-between items-center">
                <Gamepad2 className="w-8 h-8 text-blue-600" />
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">+20 نقطة لكل سؤال</span>
              </div>
              <div className="p-6 flex-grow">
                <h3 className="text-lg font-bold text-slate-800 mb-2">منطق البرمجة (Python)</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  طوّر مهاراتك في التفكير المنطقي ولغة بايثون. تعلم كيفية قراءة الكود وتوقع المخرجات والحلول البرمجية.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                  <span>⏰ 15 ثانية للسؤال</span>
                  <span>💻 للمبتدئين والمحترفين</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => startNewGame("code")}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition group-hover:scale-[1.02]"
                  id="start-code-btn"
                >
                  <Play className="w-4 h-4 fill-white" />
                  دخول التحدي
                </button>
              </div>
            </div>

            {/* Science Card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group">
              <div className="p-6 bg-emerald-50 text-emerald-800 border-b border-emerald-100 flex justify-between items-center">
                <Award className="w-8 h-8 text-emerald-600" />
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">+15 نقطة لكل سؤال</span>
              </div>
              <div className="p-6 flex-grow">
                <h3 className="text-lg font-bold text-slate-800 mb-2">مختبر العلوم والفيزياء</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                  اكتشف أسرار الطبيعة والفيزياء والكيمياء عبر أسئلة علمية شيقة تغذي العقل وتعطيك نقاطاً سريعة.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                  <span>⏰ 15 ثانية للسؤال</span>
                  <span>🧪 حقائق وتجارب تفاعلية</span>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => startNewGame("science")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition group-hover:scale-[1.02]"
                  id="start-science-btn"
                >
                  <Play className="w-4 h-4 fill-white" />
                  دخول التحدي
                </button>
              </div>
            </div>
          </div>

          {/* Session Summary Board */}
          {totalSessionPoints > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md text-center">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-300 animate-bounce" />
              <h4 className="text-xl font-bold mb-1">أداء رائع في هذه الجلسة!</h4>
              <p className="text-blue-100 text-sm mb-3">
                لقد جمعت <span className="font-bold text-yellow-300 text-lg">{totalSessionPoints}</span> نقطة إضافية في رصيدك العام.
              </p>
              <div className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-xs font-semibold">
                تم تحديث ترتيبك وحسابك تلقائياً في قاعدة بيانات المدرسة ⚡
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active Game Arena */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 md:p-8" id="game-arena">
          {!gameOver ? (
            <div>
              {/* Question Header Status */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    السؤال {currentQuestionIdx + 1} من {questions.length}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">
                    {activeGame === "math" && "تحدي الرياضيات"}
                    {activeGame === "code" && "تحدي البرمجة"}
                    {activeGame === "science" && "تحدي العلوم"}
                  </h2>
                </div>
                
                {/* Score & Timer and Streak badges */}
                <div className="flex items-center gap-3">
                  {streak >= 2 && (
                    <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold animate-bounce">
                      <Flame className="w-3.5 h-3.5" />
                      سلسلة {streak} متتالية!
                    </div>
                  )}
                  
                  <div className={`px-4 py-1.5 rounded-xl font-bold text-sm ${timeLeft <= 5 ? "bg-red-50 text-red-600 animate-pulse border border-red-200" : "bg-slate-100 text-slate-700"}`}>
                    الوقت: {timeLeft} ثانية
                  </div>

                  <div className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-1.5 rounded-xl font-bold text-sm">
                    النقاط: {score}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-center border border-slate-100">
                <p className="text-xl font-bold text-slate-800 leading-relaxed" id="question-text">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" id="options-container">
                {currentQuestion.options.map((option, idx) => {
                  let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                  let isCorrectStyle = false;

                  if (isAnswered) {
                    if (idx === currentQuestion.correctIndex) {
                      btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold ring-2 ring-emerald-200";
                      isCorrectStyle = true;
                    } else if (idx === selectedAnswer) {
                      btnStyle = "bg-red-50 border-red-500 text-red-800 font-semibold ring-2 ring-red-200";
                    } else {
                      btnStyle = "bg-white border-slate-100 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`text-right p-4 rounded-xl border text-base transition-all duration-200 ${btnStyle} flex items-center justify-between`}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrectStyle && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      {isAnswered && idx === selectedAnswer && idx !== currentQuestion.correctIndex && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Timeout Note */}
              {isAnswered && selectedAnswer === -1 && (
                <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  انتهى الوقت المتاح لهذا السؤال دون إجابة!
                </div>
              )}

              {/* Explanation section if answered */}
              {isAnswered && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 animate-fade-in">
                  <p className="text-sm font-bold text-blue-900 mb-1">الشرح التعليمي العلمي:</p>
                  <p className="text-xs text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Next Question Control */}
              {isAnswered && (
                <button
                  onClick={nextQuestion}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  id="next-question-btn"
                >
                  {currentQuestionIdx + 1 === questions.length ? "عرض النتيجة النهائية" : "السؤال التالي"}
                </button>
              )}
            </div>
          ) : (
            /* Game Over Scorecard */
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">انتهى التحدي بنجاح!</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                لقد أكملت جميع الأسئلة التعليمية وتجاوزت الاختبار بنجاح. أظهرت مهارة علمية متميزة!
              </p>

              <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl max-w-sm mx-auto mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-500 text-sm">النقاط التي جمعتها:</span>
                  <span className="text-lg font-bold text-emerald-600">+{score} نقطة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">مكافأة السلسلة المتتالية:</span>
                  <span className="text-sm font-bold text-orange-600">{streak > 3 ? "نعم (+10)" : "لا"}</span>
                </div>
                <div className="h-[1px] bg-slate-200 my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-800 font-bold">المجموع المضاف:</span>
                  <span className="text-xl font-black text-blue-700">{score} نقطة</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={() => startNewGame(activeGame)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                  id="retry-game-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة اللعب
                </button>
                <button
                  onClick={handleCloseGame}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition"
                  id="back-lobby-btn"
                >
                  <Gamepad2 className="w-4 h-4" />
                  قائمة الألعاب
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
