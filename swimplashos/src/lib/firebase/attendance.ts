import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from "./client";

const TENANT_ID = (process.env.NEXT_PUBLIC_TENANT_ID || "swimplash").trim();

export interface SessionRecord {
  studentId: string;
  status: "hadir" | "reschedule" | "no_show";
}

export interface Attendance {
  id?: string;
  date: Timestamp;
  classId: string;
  branchId: string;
  trainerId: string;
  sessionRecords: SessionRecord[];
  createdAt: Timestamp;
  createdBy: string;
}

import { sendWhatsApp, templates } from "../whatsapp/fonnte";

export const saveAttendance = async (
  attendance: Omit<Attendance, "id" | "createdAt">,
  trainerRate: number
) => {
  const batch = writeBatch(db);
  const tenantPath = `tenants/${TENANT_ID}`;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const trainerSessionId = `${attendance.trainerId}_${month}`;
  
  // 1. Create Attendance Record
  const attendanceRef = doc(collection(db, tenantPath, "attendance"));
  batch.set(attendanceRef, {
    ...attendance,
    createdAt: Timestamp.now()
  });

  const notificationTasks: { phone: string; message: string }[] = [];

  // 2. Update Student Session Counts
  for (const record of attendance.sessionRecords) {
    const studentRef = doc(db, tenantPath, "students", record.studentId);
    
    if (record.status === "hadir" || record.status === "no_show") {
      batch.update(studentRef, {
        "activePackage.usedSessions": increment(1)
      });

      // Prepare WhatsApp data
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const student = studentSnap.data();
        const sessionsLeft = student.activePackage.totalSessions - (student.activePackage.usedSessions + 1);
        notificationTasks.push({
          phone: student.phone,
          message: templates.attendance(student.name, sessionsLeft)
        });
      }
    }
  }

  // 3. Update Trainer Sessions
  const trainerSessionRef = doc(db, tenantPath, "trainer_sessions", trainerSessionId);
  const trainerSessionDoc = await getDoc(trainerSessionRef);

  if (trainerSessionDoc.exists()) {
    batch.update(trainerSessionRef, {
      totalSessions: increment(1),
      totalSalary: increment(trainerRate)
    });
  } else {
    batch.set(trainerSessionRef, {
      trainerId: attendance.trainerId,
      branchId: attendance.branchId,
      month,
      totalSessions: 1,
      ratePerSession: trainerRate,
      totalSalary: trainerRate,
      isPaid: false,
      createdAt: Timestamp.now()
    });
  }
  
  await batch.commit();

  // Send WhatsApp messages in background
  notificationTasks.forEach(task => sendWhatsApp(task.phone, task.message));
};

export const checkAttendanceExists = async (classId: string, date: Date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const attendanceRef = collection(db, "tenants", TENANT_ID, "attendance");
  const q = query(
    attendanceRef, 
    where("classId", "==", classId),
    where("date", ">=", Timestamp.fromDate(startOfDay)),
    where("date", "<=", Timestamp.fromDate(endOfDay))
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
