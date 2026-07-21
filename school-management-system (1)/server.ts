import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Student, Teacher, Director, ClassSession, Assignment, Announcement, SchoolData, AttendanceRecord, GradeRecord, SchoolSettings, ClassEntity, SubjectEntity } from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

// Default pre-populated high fidelity database matching PHP logic & Bologna Process rules
const DEFAULT_SETTINGS: SchoolSettings = {
  school_name_ar: "مدرسة المتميزين النموذجية الذكية",
  school_name_en: "Al-Motamayizeen Model Smart School",
  logo_path: "https://cdn-icons-png.flaticon.com/512/807/807478.png",
  alert_percent_1: 5,
  alert_percent_2: 10,
  alert_percent_3: 15
};

const DEFAULT_DATA: SchoolData = {
  settings: DEFAULT_SETTINGS,
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
  grades: []
};

const DEFAULT_CLASSES_LIST: ClassEntity[] = [];

const DEFAULT_SUBJECTS_LIST: SubjectEntity[] = [];

// Helper to read DB
function readDB(): SchoolData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      let changed = false;
      if (!db.classesList) {
        db.classesList = DEFAULT_CLASSES_LIST;
        changed = true;
      }
      if (!db.subjectsList) {
        db.subjectsList = DEFAULT_SUBJECTS_LIST;
        changed = true;
      }
      // Migrate teachers to have subjectsList
      if (db.teachers) {
        db.teachers.forEach((t: any) => {
          if (!t.subjectsList) {
            if (t.id === "teacher-1") t.subjectsList = ["math"];
            else if (t.id === "teacher-2") t.subjectsList = ["science"];
            else if (t.id === "teacher-3") t.subjectsList = ["english"];
            else t.subjectsList = [];
            changed = true;
          }
        });
      }
      if (changed) {
        writeDB(db);
      }
      return db;
    }
  } catch (error) {
    console.error("Error reading database file, using defaults:", error);
  }
  // Write default if not present
  const initData = {
    ...DEFAULT_DATA,
    classesList: DEFAULT_CLASSES_LIST,
    subjectsList: DEFAULT_SUBJECTS_LIST
  };
  if (initData.teachers && initData.teachers.length >= 3) {
    initData.teachers[0].subjectsList = ["math"];
    initData.teachers[1].subjectsList = ["science"];
    initData.teachers[2].subjectsList = ["english"];
  }
  writeDB(initData);
  return initData as any;
}

// Helper to write DB
function writeDB(data: SchoolData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Get full school data
  app.get("/api/data", (req, res) => {
    const db = readDB();
    res.json(db);
  });

  // Reset database to default
  app.post("/api/reset", (req, res) => {
    writeDB(DEFAULT_DATA);
    res.json({ message: "Database reset to defaults", data: DEFAULT_DATA });
  });

  // Authentication endpoint matching user's login form request
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبة" });
      return;
    }

    const db = readDB();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Directors
    const director = db.directors.find(d => d.email.trim().toLowerCase() === cleanEmail && d.password === password);
    if (director) {
      res.json({ role: "director", user: director, schoolData: db });
      return;
    }

    // 2. Check Teachers
    const teacher = db.teachers.find(t => t.email.trim().toLowerCase() === cleanEmail && t.password === password);
    if (teacher) {
      res.json({ role: "teacher", user: teacher, schoolData: db });
      return;
    }

    // 3. Check Students
    const student = db.students.find(s => s.email.trim().toLowerCase() === cleanEmail && s.password === password);
    if (student) {
      res.json({ role: "student", user: student, schoolData: db });
      return;
    }

    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
  });

  // Search API for AJAX live search
  app.get("/api/search", (req, res) => {
    const query = (req.query.q || "").toString().trim().toLowerCase();
    const db = readDB();
    if (!query) {
      res.json([]);
      return;
    }

    const matchedStudents = db.students.filter(
      s => s.name.toLowerCase().includes(query) || (s.nickname && s.nickname.toLowerCase().includes(query))
    ).map(s => ({ id: s.id, name: s.name, nickname: s.nickname, role: "student", avatar: s.avatar }));

    const matchedTeachers = db.teachers.filter(
      t => t.name.toLowerCase().includes(query)
    ).map(t => ({ id: t.id, name: t.name, nickname: "", role: "teacher", avatar: t.avatar }));

    res.json([...matchedStudents, ...matchedTeachers]);
  });

  // Update visual and warning settings for Bologna alerts
  app.post("/api/settings", (req, res) => {
    const { school_name_ar, school_name_en, logo_path, alert_percent_1, alert_percent_2, alert_percent_3 } = req.body;
    const db = readDB();

    db.settings = {
      school_name_ar: school_name_ar || db.settings.school_name_ar,
      school_name_en: school_name_en || db.settings.school_name_en,
      logo_path: logo_path || db.settings.logo_path,
      alert_percent_1: typeof alert_percent_1 === "number" ? alert_percent_1 : db.settings.alert_percent_1,
      alert_percent_2: typeof alert_percent_2 === "number" ? alert_percent_2 : db.settings.alert_percent_2,
      alert_percent_3: typeof alert_percent_3 === "number" ? alert_percent_3 : db.settings.alert_percent_3,
    };

    writeDB(db);
    res.json({ message: "تم تحديث الإعدادات بنجاح", settings: db.settings });
  });

  // Save specific detailed exam grade (Daily, Monthly, or Final)
  app.post("/api/grades", (req, res) => {
    const { studentId, subjectId, examType, score } = req.body;
    if (!studentId || !subjectId || !examType || typeof score !== "number") {
      res.status(400).json({ error: "بيانات رصد الدرجات ناقصة" });
      return;
    }

    const db = readDB();

    // Check if score exists already for this combination
    const idx = db.grades.findIndex(
      g => g.studentId === studentId && g.subjectId === subjectId && g.examType === examType
    );

    if (idx !== -1) {
      db.grades[idx].score = Math.max(0, Math.min(100, score));
    } else {
      db.grades.push({
        id: "g-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        studentId,
        subjectId,
        examType,
        score: Math.max(0, Math.min(100, score))
      });
    }

    writeDB(db);
    res.json({ message: "تم رصد الدرجة بنجاح", grades: db.grades });
  });

  // Delete specific grade record
  app.delete("/api/grades/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.grades = db.grades.filter(g => g.id !== id);
    writeDB(db);
    res.json({ message: "تم حذف الدرجة بنجاح" });
  });

  // Save specific attendance logs for entire class/students
  app.post("/api/attendance", (req, res) => {
    const { studentId, subjectId, status, date, teacherName } = req.body;
    if (!studentId || !subjectId || !status || !date) {
      res.status(400).json({ error: "بيانات غياب الحضور ناقصة" });
      return;
    }

    const db = readDB();

    // Check if record for student, subject and date already exists
    const idx = db.attendance.findIndex(
      a => a.studentId === studentId && a.subjectId === subjectId && a.date === date
    );

    if (idx !== -1) {
      db.attendance[idx].status = status;
      if (teacherName) db.attendance[idx].teacherName = teacherName;
    } else {
      db.attendance.push({
        id: "att-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        studentId,
        subjectId,
        date,
        status,
        teacherName: teacherName || "الأستاذ"
      });
    }

    // Optional legacy support: update aggregate attendance rate for student
    const studentIdx = db.students.findIndex(s => s.id === studentId);
    if (studentIdx !== -1) {
      const studentAtts = db.attendance.filter(a => a.studentId === studentId);
      const absentCount = studentAtts.filter(a => a.status === "absent").length;
      db.students[studentIdx].absentDaysCount = absentCount;

      const totalRecords = studentAtts.length || 1;
      const presentCount = studentAtts.filter(a => a.status === "present" || a.status === "late").length;
      db.students[studentIdx].attendancePercentage = Math.round((presentCount / totalRecords) * 100);
    }

    writeDB(db);
    res.json({ message: "تم رصد الحضور والغياب بنجاح", attendance: db.attendance });
  });

  // Add Student from Director panel
  app.post("/api/students", (req, res) => {
    const { name, nickname, email, password, gender, birthDate, phoneNumber, region, alley, street, houseNumber, gradeLevel, avatar } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "الاسم والبريد الإلكتروني مطلوبان" });
      return;
    }

    const db = readDB();
    const newStudent: Student = {
      id: "student-" + Date.now(),
      name,
      nickname: nickname || "",
      email,
      password: password || "123",
      gradeLevel: gradeLevel || "الصف العاشر",
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      gender: gender || "male",
      birthDate: birthDate || "2010-01-01",
      phoneNumber: phoneNumber || "",
      region: region || "",
      alley: alley || "",
      street: street || "",
      houseNumber: houseNumber || "",
      gamePoints: 0,
      gameLevel: 1,
      currentRank: db.students.length + 1
    };

    db.students.push(newStudent);
    db.students = recalculateRanks(db.students);

    writeDB(db);
    res.json({ message: "تم تسجيل الحساب بنجاح", student: newStudent });
  });

  // Delete student
  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.students = db.students.filter(s => s.id !== id);
    db.attendance = db.attendance.filter(a => a.studentId !== id);
    db.grades = db.grades.filter(g => g.studentId !== id);
    db.students = recalculateRanks(db.students);

    writeDB(db);
    res.json({ message: "تم حذف حساب الطالب بنجاح" });
  });

  // Edit Student details
  app.put("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const { name, nickname, email, password, gender, birthDate, phoneNumber, region, alley, street, houseNumber, gradeLevel, avatar } = req.body;
    const db = readDB();

    const idx = db.students.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "الطالب غير موجود" });
      return;
    }

    db.students[idx] = {
      ...db.students[idx],
      name: name || db.students[idx].name,
      nickname: nickname !== undefined ? nickname : db.students[idx].nickname,
      email: email || db.students[idx].email,
      password: password || db.students[idx].password,
      gender: gender || db.students[idx].gender,
      birthDate: birthDate !== undefined ? birthDate : db.students[idx].birthDate,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : db.students[idx].phoneNumber,
      region: region !== undefined ? region : db.students[idx].region,
      alley: alley !== undefined ? alley : db.students[idx].alley,
      street: street !== undefined ? street : db.students[idx].street,
      houseNumber: houseNumber !== undefined ? houseNumber : db.students[idx].houseNumber,
      gradeLevel: gradeLevel || db.students[idx].gradeLevel,
      avatar: avatar || db.students[idx].avatar
    };

    writeDB(db);
    res.json({ message: "تم تحديث بيانات الطالب بنجاح", student: db.students[idx] });
  });

  // Add Teacher (Director action)
  app.post("/api/teachers", (req, res) => {
    const { name, email, password, subject, subjectsList, avatar } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "الاسم والبريد الإلكتروني مطلوبان" });
      return;
    }

    const db = readDB();
    let finalSubjectsList = subjectsList || [];
    let finalSubjectString = subject || "";

    if (Array.isArray(subjectsList) && subjectsList.length > 0) {
      const subNames = subjectsList.map(sid => {
        const found = db.subjectsList?.find(s => s.id === sid);
        if (found) {
          const cls = db.classesList?.find(c => c.id === found.classId);
          const clsSuffix = cls ? ` (${cls.name})` : "";
          return found.name + clsSuffix;
        }
        return sid;
      });
      finalSubjectString = subNames.join("، ");
    } else if (subject) {
      finalSubjectString = subject;
      finalSubjectsList = [];
    }

    const newTeacher: Teacher = {
      id: "teacher-" + Date.now(),
      name,
      email,
      password: password || "123",
      subject: finalSubjectString,
      avatar: avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      assignedClasses: [],
      subjectsList: finalSubjectsList
    };

    db.teachers.push(newTeacher);
    writeDB(db);
    res.json({ message: "Teacher added successfully", teacher: newTeacher });
  });

  // Delete Teacher
  app.delete("/api/teachers/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.teachers = db.teachers.filter(t => t.id !== id);

    writeDB(db);
    res.json({ message: "تم حذف حساب الأستاذ بنجاح" });
  });

  // Classes List management (add/delete)
  app.post("/api/classes-list", (req, res) => {
    const { name, gender } = req.body;
    if (!name || !gender) {
      res.status(400).json({ error: "اسم الصف الدراسي والجنس مطلوبان" });
      return;
    }

    const db = readDB();
    const newClass = {
      id: "class-entity-" + Date.now(),
      name,
      gender
    };

    if (!db.classesList) db.classesList = [];
    db.classesList.push(newClass);
    writeDB(db);
    res.json({ message: "تمت إضافة الصف الدراسي بنجاح", class: newClass });
  });

  app.delete("/api/classes-list/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();

    if (db.classesList) {
      db.classesList = db.classesList.filter(c => c.id !== id);
    }
    if (db.subjectsList) {
      db.subjectsList = db.subjectsList.filter(s => s.classId !== id);
    }

    writeDB(db);
    res.json({ message: "تم حذف الصف الدراسي بنجاح" });
  });

  // Subjects List management (add/delete)
  app.post("/api/subjects-list", (req, res) => {
    const { name, classId } = req.body;
    if (!name || !classId) {
      res.status(400).json({ error: "اسم المادة والصف الدراسي مطلوبان" });
      return;
    }

    const db = readDB();
    const newSubject = {
      id: "subject-entity-" + Date.now(),
      name,
      classId
    };

    if (!db.subjectsList) db.subjectsList = [];
    db.subjectsList.push(newSubject);
    writeDB(db);
    res.json({ message: "تمت إضافة المادة الدراسية بنجاح", subject: newSubject });
  });

  app.delete("/api/subjects-list/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();

    if (db.subjectsList) {
      db.subjectsList = db.subjectsList.filter(s => s.id !== id);
    }

    writeDB(db);
    res.json({ message: "تم حذف المادة الدراسية بنجاح" });
  });

  // Update a student's game points
  app.post("/api/students/:id/game-points", (req, res) => {
    const { id } = req.params;
    const { pointsEarned } = req.body;
    const db = readDB();

    const studentIndex = db.students.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const currentPoints = db.students[studentIndex].gamePoints;
    const newPoints = currentPoints + (pointsEarned || 0);
    db.students[studentIndex].gamePoints = newPoints;
    db.students[studentIndex].gameLevel = Math.max(1, Math.floor(newPoints / 120));

    db.students = recalculateRanks(db.students);

    writeDB(db);
    res.json({ message: "Game points added", student: db.students[studentIndex], leaderboards: db.students });
  });

  // Add Assignment
  app.post("/api/assignments", (req, res) => {
    const { title, subject, subjectId, dueDate, colorType } = req.body;
    if (!title || !subject) {
      res.status(400).json({ error: "العنوان والمادة مطلوبان" });
      return;
    }

    const db = readDB();
    const newAssignment: Assignment = {
      id: "task-" + Date.now(),
      title,
      subject,
      subjectId: subjectId || "math",
      dueDate: dueDate || "قريباً",
      isCompleted: false,
      colorType: colorType || "blue"
    };

    db.assignments.unshift(newAssignment);
    writeDB(db);
    res.json({ message: "Assignment created successfully", assignment: newAssignment });
  });

  // Toggle Assignment completion (Student action)
  app.post("/api/assignments/:id/toggle", (req, res) => {
    const { id } = req.params;
    const db = readDB();

    const idx = db.assignments.findIndex(a => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    db.assignments[idx].isCompleted = !db.assignments[idx].isCompleted;
    writeDB(db);
    res.json({ message: "Assignment state toggled", assignment: db.assignments[idx] });
  });

  // Post Announcement (Director / Teacher action)
  app.post("/api/announcements", (req, res) => {
    const { title, content, sender, classId, subjectId } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "العنوان والمحتوى مطلوبان" });
      return;
    }

    const db = readDB();
    const newAnnouncement: Announcement = {
      id: "ann-" + Date.now(),
      title,
      content,
      date: "الآن",
      sender: sender || "الإدارة",
      classId,
      subjectId
    };

    db.announcements.unshift(newAnnouncement);
    writeDB(db);
    res.json({ message: "Announcement created successfully", announcement: newAnnouncement });
  });

  // Create or update class sessions (Director action)
  app.post("/api/classes", (req, res) => {
    const { id, subject, subjectId, teacherName, room, startTime, durationMinutes, isActive } = req.body;
    const db = readDB();

    if (id) {
      const idx = db.classes.findIndex(c => c.id === id);
      if (idx !== -1) {
        db.classes[idx] = {
          ...db.classes[idx],
          subject: subject || db.classes[idx].subject,
          subjectId: subjectId || db.classes[idx].subjectId,
          teacherName: teacherName || db.classes[idx].teacherName,
          room: room || db.classes[idx].room,
          startTime: startTime || db.classes[idx].startTime,
          durationMinutes: typeof durationMinutes === "number" ? durationMinutes : db.classes[idx].durationMinutes,
          isActive: typeof isActive === "boolean" ? isActive : db.classes[idx].isActive
        };
        writeDB(db);
        res.json({ message: "Class updated", class: db.classes[idx] });
        return;
      }
    }

    // Add new class session
    const newClass: ClassSession = {
      id: "class-" + Date.now(),
      subject: subject || "مادة جديدة",
      subjectId: subjectId || "math",
      teacherName: teacherName || "معلم غير معين",
      room: room || "قاعة غير معينة",
      startTime: startTime || "08:00",
      durationMinutes: durationMinutes || 45,
      day: "الثلاثاء",
      isActive: isActive || false
    };

    db.classes.push(newClass);
    writeDB(db);
    res.json({ message: "Class created", class: newClass });
  });

  // Delete class session (Director action)
  app.delete("/api/classes/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLength = db.classes.length;
    db.classes = db.classes.filter(c => c.id !== id);

    if (db.classes.length === initialLength) {
      res.status(404).json({ error: "Class not found" });
      return;
    }

    writeDB(db);
    res.json({ message: "Class deleted successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
